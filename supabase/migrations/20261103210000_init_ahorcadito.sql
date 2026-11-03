-- Ahorcadito Diario 11Diez — esquema inicial
-- Tablas con RLS activado y SIN políticas: solo el servidor (clave secreta / service_role) accede.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email))),
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.daily_words (
  game_date date primary key,
  word text not null,
  category text not null,
  time_limit_seconds int not null default 120 check (time_limit_seconds > 0),
  max_errors int not null default 3 check (max_errors > 0),
  check (game_date between '2026-11-04' and '2026-11-14')
);

create table public.plays (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  game_date date not null references public.daily_words(game_date),
  status text not null default 'playing' check (status in ('playing','won','lost')),
  lost_reason text null check (lost_reason in ('errors','timeout')),
  guessed_letters text[] not null default '{}',
  wrong_count int not null default 0,
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  finished_at timestamptz null,
  duration_ms int null,
  win_code text null unique,
  unique (participant_id, game_date)
);
create index plays_game_date_status_idx on public.plays (game_date, status);
create index participants_phone_idx on public.participants (phone);

alter table public.participants enable row level security;
alter table public.daily_words enable row level security;
alter table public.plays enable row level security;

revoke all on table public.participants, public.daily_words, public.plays from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Normalización (idéntica a lib/word.ts → normalizeChar)
--   Á É Í Ó Ú Ü → A E I O U U ; Ñ se conserva ; todo en mayúsculas.
-- ---------------------------------------------------------------------------

create or replace function public.ahd_normalize(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(translate(p_text, 'áéíóúüÁÉÍÓÚÜñ', 'AEIOUUAEIOUUÑ'));
$$;

-- Letras únicas (normalizadas, A–Z + Ñ) que hay que adivinar en una palabra/frase.
create or replace function public.ahd_word_letters(p_word text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(distinct c), '{}'::text[])
  from regexp_split_to_table(public.ahd_normalize(p_word), '') as c
  where c ~ '^[A-ZÑ]$';
$$;

-- Código de ganador: 11D- + 6 caracteres de un alfabeto de 32 símbolos (sin 0/O/1/I).
create or replace function public.ahd_win_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea := extensions.gen_random_bytes(6);
  v_code text := '11D-';
  i int;
begin
  for i in 0..5 loop
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Partidas
-- ---------------------------------------------------------------------------

-- Marca como perdida por tiempo una partida vencida. Devuelve la fila actualizada.
create or replace function public.refresh_play(
  p_participant uuid,
  p_date date,
  p_now timestamptz default null
)
returns setof public.plays
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
begin
  update public.plays
     set status = 'lost',
         lost_reason = 'timeout',
         finished_at = deadline_at,
         duration_ms = (extract(epoch from (deadline_at - started_at)) * 1000)::int
   where participant_id = p_participant
     and game_date = p_date
     and status = 'playing'
     and v_now >= deadline_at;

  return query
    select * from public.plays
     where participant_id = p_participant and game_date = p_date;
end;
$$;

-- Crea la partida del día si no existe (arranca el reloj). Si ya existe, la devuelve sin cambios.
create or replace function public.start_play(
  p_participant uuid,
  p_date date,
  p_now timestamptz default null
)
returns public.plays
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_word public.daily_words;
  v_play public.plays;
begin
  select * into v_play from public.plays
   where participant_id = p_participant and game_date = p_date;
  if found then
    return v_play;
  end if;

  -- Solo se puede iniciar la partida del día actual (hora Colombia).
  if p_date <> (v_now at time zone 'America/Bogota')::date then
    raise exception 'not_today' using errcode = 'P0001';
  end if;

  select * into v_word from public.daily_words where game_date = p_date;
  if not found then
    raise exception 'no_word' using errcode = 'P0001';
  end if;

  insert into public.plays (participant_id, game_date, started_at, deadline_at)
  values (p_participant, p_date, v_now, v_now + make_interval(secs => v_word.time_limit_seconds))
  on conflict (participant_id, game_date) do nothing;

  select * into v_play from public.plays
   where participant_id = p_participant and game_date = p_date;
  return v_play;
end;
$$;

-- Aplica una letra de forma atómica (bloqueo de fila).
create or replace function public.apply_guess(
  p_participant uuid,
  p_date date,
  p_letter text,
  p_now timestamptz default null
)
returns public.plays
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_letter text := public.ahd_normalize(coalesce(p_letter, ''));
  v_play public.plays;
  v_word public.daily_words;
  v_letters text[];
  v_guessed text[];
  v_wrong int;
  v_code text;
begin
  if v_letter !~ '^[A-ZÑ]$' then
    raise exception 'invalid_letter' using errcode = 'P0001';
  end if;

  select * into v_play from public.plays
   where participant_id = p_participant and game_date = p_date
   for update;

  if not found then
    -- La primera letra también arranca el reloj.
    perform public.start_play(p_participant, p_date, p_now);
    select * into v_play from public.plays
     where participant_id = p_participant and game_date = p_date
     for update;
  end if;

  if v_play.status <> 'playing' then
    return v_play;
  end if;

  if v_now >= v_play.deadline_at then
    update public.plays
       set status = 'lost', lost_reason = 'timeout', finished_at = deadline_at,
           duration_ms = (extract(epoch from (deadline_at - started_at)) * 1000)::int
     where id = v_play.id
     returning * into v_play;
    return v_play;
  end if;

  if v_letter = any(v_play.guessed_letters) then
    return v_play;
  end if;

  select * into v_word from public.daily_words where game_date = v_play.game_date;
  v_letters := public.ahd_word_letters(v_word.word);
  v_guessed := array_append(v_play.guessed_letters, v_letter);
  v_wrong := v_play.wrong_count;

  if not (v_letter = any(v_letters)) then
    v_wrong := v_wrong + 1;
    if v_wrong >= v_word.max_errors then
      update public.plays
         set guessed_letters = v_guessed, wrong_count = v_wrong,
             status = 'lost', lost_reason = 'errors', finished_at = v_now,
             duration_ms = (extract(epoch from (v_now - started_at)) * 1000)::int
       where id = v_play.id
       returning * into v_play;
    else
      update public.plays
         set guessed_letters = v_guessed, wrong_count = v_wrong
       where id = v_play.id
       returning * into v_play;
    end if;
    return v_play;
  end if;

  if v_letters <@ v_guessed then
    loop
      v_code := public.ahd_win_code();
      begin
        update public.plays
           set guessed_letters = v_guessed, status = 'won', finished_at = v_now,
               duration_ms = (extract(epoch from (v_now - started_at)) * 1000)::int,
               win_code = v_code
         where id = v_play.id
         returning * into v_play;
        exit;
      exception when unique_violation then
        -- Código repetido: se regenera.
      end;
    end loop;
  else
    update public.plays
       set guessed_letters = v_guessed
     where id = v_play.id
     returning * into v_play;
  end if;

  return v_play;
end;
$$;

-- Cierra por tiempo todas las partidas vencidas (para estadísticas del admin).
create or replace function public.expire_plays(p_now timestamptz default null)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  update public.plays
     set status = 'lost', lost_reason = 'timeout', finished_at = deadline_at,
         duration_ms = (extract(epoch from (deadline_at - started_at)) * 1000)::int
   where status = 'playing' and coalesce(p_now, now()) >= deadline_at;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Consultas del panel de administración
-- ---------------------------------------------------------------------------

create or replace function public.admin_day_summary()
returns table (
  game_date date,
  word text,
  category text,
  started bigint,
  won bigint,
  lost_errors bigint,
  lost_timeout bigint,
  playing bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.game_date, d.word, d.category,
         count(p.id),
         count(p.id) filter (where p.status = 'won'),
         count(p.id) filter (where p.status = 'lost' and p.lost_reason = 'errors'),
         count(p.id) filter (where p.status = 'lost' and p.lost_reason = 'timeout'),
         count(p.id) filter (where p.status = 'playing')
    from public.daily_words d
    left join public.plays p on p.game_date = d.game_date
   group by d.game_date, d.word, d.category
   order by d.game_date;
$$;

create or replace function public.admin_participants(
  p_search text default null,
  p_limit int default null,
  p_offset int default 0
)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  created_at timestamptz,
  last_seen_at timestamptz,
  days_played bigint,
  days_won bigint,
  phone_dup_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select pa.*,
           count(*) over (partition by pa.phone) as phone_dup_count
      from public.participants pa
  ), filtered as (
    select b.*
      from base b
     where p_search is null or btrim(p_search) = ''
        or b.full_name ilike '%' || btrim(p_search) || '%'
        or b.email ilike '%' || btrim(p_search) || '%'
        or b.phone ilike '%' || btrim(p_search) || '%'
  )
  select f.id, f.full_name, f.email, f.phone, f.created_at, f.last_seen_at,
         (select count(*) from public.plays p where p.participant_id = f.id),
         (select count(*) from public.plays p where p.participant_id = f.id and p.status = 'won'),
         f.phone_dup_count,
         count(*) over ()
    from filtered f
   order by f.created_at desc
   limit p_limit offset coalesce(p_offset, 0);
$$;

create or replace function public.admin_results(
  p_date date default null,
  p_search text default null,
  p_limit int default null,
  p_offset int default 0
)
returns table (
  play_id uuid,
  game_date date,
  full_name text,
  email text,
  phone text,
  status text,
  lost_reason text,
  wrong_count int,
  guessed_letters text[],
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms int,
  win_code text,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.game_date, pa.full_name, pa.email, pa.phone, p.status, p.lost_reason,
         p.wrong_count, p.guessed_letters, p.started_at, p.finished_at, p.duration_ms,
         p.win_code, count(*) over ()
    from public.plays p
    join public.participants pa on pa.id = p.participant_id
   where (p_date is null or p.game_date = p_date)
     and (p_search is null or btrim(p_search) = ''
          or pa.full_name ilike '%' || btrim(p_search) || '%'
          or pa.email ilike '%' || btrim(p_search) || '%'
          or pa.phone ilike '%' || btrim(p_search) || '%'
          or p.win_code ilike '%' || btrim(p_search) || '%')
   order by p.game_date,
            case p.status when 'won' then 0 when 'playing' then 1 else 2 end,
            p.finished_at asc nulls last,
            p.started_at asc
   limit p_limit offset coalesce(p_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Permisos: solo service_role (clave secreta del servidor)
-- ---------------------------------------------------------------------------

revoke execute on function
  public.ahd_normalize(text),
  public.ahd_word_letters(text),
  public.ahd_win_code(),
  public.refresh_play(uuid, date, timestamptz),
  public.start_play(uuid, date, timestamptz),
  public.apply_guess(uuid, date, text, timestamptz),
  public.expire_plays(timestamptz),
  public.admin_day_summary(),
  public.admin_participants(text, int, int),
  public.admin_results(date, text, int, int)
from public, anon, authenticated;

grant execute on function
  public.ahd_normalize(text),
  public.ahd_word_letters(text),
  public.ahd_win_code(),
  public.refresh_play(uuid, date, timestamptz),
  public.start_play(uuid, date, timestamptz),
  public.apply_guess(uuid, date, text, timestamptz),
  public.expire_plays(timestamptz),
  public.admin_day_summary(),
  public.admin_participants(text, int, int),
  public.admin_results(date, text, int, int)
to service_role;
