-- ===========================================================================
-- Ronda bonus
--   * Una palabra extra, con su propio cronómetro, disponible en una ventana de tiempo.
--   * Solo la puede jugar quien ya terminó (ganó o perdió) la palabra de `eligible_date`.
--   * Una partida por persona por ronda. Mismas reglas: 3 vidas, cada letra errada resta 1.
--   * Ganador: el primero en adivinar que aún no tenga título (cuenta como su único título).
--     Esa regla se calcula en el servidor (lib/winner-rules.ts), no aquí.
-- ===========================================================================

create table public.bonus_rounds (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  eligible_date date not null references public.daily_words(game_date),
  word text not null,
  category text not null,
  time_limit_seconds int not null default 120 check (time_limit_seconds > 0),
  max_errors int not null default 3 check (max_errors > 0),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  check (closes_at > opens_at)
);

create table public.bonus_plays (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  round_id text not null references public.bonus_rounds(id),
  status text not null default 'playing' check (status in ('playing','won','lost')),
  lost_reason text null check (lost_reason in ('errors','timeout')),
  guessed_letters text[] not null default '{}',
  wrong_count int not null default 0,
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  finished_at timestamptz null,
  duration_ms int null,
  win_code text null unique,
  unique (participant_id, round_id)
);
create index bonus_plays_round_status_idx on public.bonus_plays (round_id, status);

alter table public.bonus_rounds enable row level security;
alter table public.bonus_plays enable row level security;
revoke all on table public.bonus_rounds, public.bonus_plays from anon, authenticated;

-- Marca como perdida por tiempo una partida bonus vencida y la devuelve.
create or replace function public.bonus_refresh_play(
  p_participant uuid,
  p_round text,
  p_now timestamptz default null
)
returns setof public.bonus_plays
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
begin
  update public.bonus_plays
     set status = 'lost',
         lost_reason = 'timeout',
         finished_at = deadline_at,
         duration_ms = (extract(epoch from (deadline_at - started_at)) * 1000)::int
   where participant_id = p_participant
     and round_id = p_round
     and status = 'playing'
     and v_now >= deadline_at;

  return query
    select * from public.bonus_plays
     where participant_id = p_participant and round_id = p_round;
end;
$$;

-- Crea la partida bonus si no existe (arranca el reloj). Valida ventana y elegibilidad.
create or replace function public.bonus_start_play(
  p_participant uuid,
  p_round text,
  p_now timestamptz default null
)
returns public.bonus_plays
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_round public.bonus_rounds;
  v_play public.bonus_plays;
  v_daily public.plays;
begin
  select * into v_play from public.bonus_plays
   where participant_id = p_participant and round_id = p_round;
  if found then
    return v_play;
  end if;

  select * into v_round from public.bonus_rounds where id = p_round;
  if not found then
    raise exception 'bonus_not_found' using errcode = 'P0001';
  end if;
  if v_now < v_round.opens_at or v_now >= v_round.closes_at then
    raise exception 'bonus_closed' using errcode = 'P0001';
  end if;

  -- Solo quien ya terminó la palabra del día (ganó o perdió).
  select * into v_daily from public.refresh_play(p_participant, v_round.eligible_date, p_now);
  if v_daily.id is null or v_daily.status = 'playing' then
    raise exception 'bonus_not_eligible' using errcode = 'P0001';
  end if;

  insert into public.bonus_plays (participant_id, round_id, started_at, deadline_at)
  values (p_participant, p_round, v_now, v_now + make_interval(secs => v_round.time_limit_seconds))
  on conflict (participant_id, round_id) do nothing;

  select * into v_play from public.bonus_plays
   where participant_id = p_participant and round_id = p_round;
  return v_play;
end;
$$;

-- Aplica una letra de forma atómica (bloqueo de fila). Igual que apply_guess.
create or replace function public.bonus_apply_guess(
  p_participant uuid,
  p_round text,
  p_letter text,
  p_now timestamptz default null
)
returns public.bonus_plays
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_letter text := public.ahd_normalize(coalesce(p_letter, ''));
  v_play public.bonus_plays;
  v_round public.bonus_rounds;
  v_letters text[];
  v_guessed text[];
  v_wrong int;
  v_code text;
begin
  if v_letter !~ '^[A-ZÑ]$' then
    raise exception 'invalid_letter' using errcode = 'P0001';
  end if;

  select * into v_play from public.bonus_plays
   where participant_id = p_participant and round_id = p_round
   for update;

  if not found then
    -- La primera letra también arranca el reloj (con las mismas validaciones).
    perform public.bonus_start_play(p_participant, p_round, p_now);
    select * into v_play from public.bonus_plays
     where participant_id = p_participant and round_id = p_round
     for update;
  end if;

  if v_play.status <> 'playing' then
    return v_play;
  end if;

  if v_now >= v_play.deadline_at then
    update public.bonus_plays
       set status = 'lost', lost_reason = 'timeout', finished_at = deadline_at,
           duration_ms = (extract(epoch from (deadline_at - started_at)) * 1000)::int
     where id = v_play.id
     returning * into v_play;
    return v_play;
  end if;

  if v_letter = any(v_play.guessed_letters) then
    return v_play;
  end if;

  select * into v_round from public.bonus_rounds where id = v_play.round_id;
  v_letters := public.ahd_word_letters(v_round.word);
  v_guessed := array_append(v_play.guessed_letters, v_letter);
  v_wrong := v_play.wrong_count;

  if not (v_letter = any(v_letters)) then
    v_wrong := v_wrong + 1;
    if v_wrong >= v_round.max_errors then
      update public.bonus_plays
         set guessed_letters = v_guessed, wrong_count = v_wrong,
             status = 'lost', lost_reason = 'errors', finished_at = v_now,
             duration_ms = (extract(epoch from (v_now - started_at)) * 1000)::int
       where id = v_play.id
       returning * into v_play;
    else
      update public.bonus_plays
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
        update public.bonus_plays
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
    update public.bonus_plays
       set guessed_letters = v_guessed
     where id = v_play.id
     returning * into v_play;
  end if;

  return v_play;
end;
$$;

revoke execute on function
  public.bonus_refresh_play(uuid, text, timestamptz),
  public.bonus_start_play(uuid, text, timestamptz),
  public.bonus_apply_guess(uuid, text, text, timestamptz)
from public, anon, authenticated;

grant execute on function
  public.bonus_refresh_play(uuid, text, timestamptz),
  public.bonus_start_play(uuid, text, timestamptz),
  public.bonus_apply_guess(uuid, text, text, timestamptz)
to service_role;

-- Ronda bonus del viernes 6 de noviembre: de 12:00 p. m. a 12:00 a. m. (hora Colombia),
-- 2 minutos, solo para quienes ya jugaron la palabra del 6 de noviembre.
insert into public.bonus_rounds
  (id, eligible_date, word, category, time_limit_seconds, max_errors, opens_at, closes_at)
values
  ('2026-11-06-bonus', '2026-11-06', 'BENEFICIO DE AUDITORÍA', 'Procedimiento', 120, 3,
   '2026-11-06 12:00:00-05', '2026-11-07 00:00:00-05');
