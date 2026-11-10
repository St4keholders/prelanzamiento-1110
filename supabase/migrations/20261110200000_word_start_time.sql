-- ===========================================================================
-- Hora de inicio por palabra
--   * daily_words.starts_at: momento en que sale la palabra (se elige en el panel).
--   * Cada palabra se juega desde su inicio hasta que sale la siguiente; la última, 24 h.
--   * Días sin fila empiezan a las 00:00 (hora Colombia) de su fecha.
--   * La misma regla está en lib/schedule.ts (buildSchedule / currentWindow).
-- ===========================================================================

alter table public.daily_words add column if not exists starts_at timestamptz;

-- Días existentes: a medianoche de su fecha (como funcionaba hasta ahora)...
update public.daily_words
   set starts_at = (game_date::timestamp at time zone 'America/Bogota')
 where starts_at is null;

-- ...y del 11 al 14 de noviembre: a las 12:00 p. m. (hora Colombia).
-- Así la palabra del 10 nov se puede jugar hasta el 11 nov a las 12:00 p. m.
update public.daily_words
   set starts_at = ((game_date::timestamp + time '12:00') at time zone 'America/Bogota')
 where game_date >= '2026-11-11';

alter table public.daily_words alter column starts_at set not null;

-- Si alguien inserta una palabra sin hora, empieza a medianoche de su fecha.
create or replace function public.ahd_default_starts_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.starts_at is null then
    new.starts_at := (new.game_date::timestamp at time zone 'America/Bogota');
  end if;
  return new;
end;
$$;

drop trigger if exists daily_words_default_starts_at on public.daily_words;
create trigger daily_words_default_starts_at
  before insert or update on public.daily_words
  for each row execute function public.ahd_default_starts_at();

-- Fecha (game_date) de la palabra que se puede jugar en p_now; null si el reto no está activo.
create or replace function public.ahd_current_date(p_now timestamptz default null)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  with cal as (
    select d::date as game_date,
           coalesce(w.starts_at, (d::date::timestamp at time zone 'America/Bogota')) as starts_at
      from generate_series('2026-11-04'::date, '2026-11-14'::date, interval '1 day') as d
      left join public.daily_words w on w.game_date = d::date
  ),
  win as (
    select game_date, starts_at,
           coalesce(lead(starts_at) over (order by game_date), starts_at + interval '1 day') as ends_at
      from cal
  )
  select game_date from win
   where starts_at <= coalesce(p_now, now())
     and coalesce(p_now, now()) < ends_at
   order by game_date desc
   limit 1;
$$;

revoke execute on function public.ahd_current_date(timestamptz) from public, anon, authenticated;
grant execute on function public.ahd_current_date(timestamptz) to service_role;

-- start_play: misma lógica de antes, pero "la palabra de hoy" ya no es la fecha calendario
-- sino la palabra activa según su hora de inicio.
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

  -- Solo se puede iniciar la partida de la palabra activa en este momento.
  if p_date is distinct from public.ahd_current_date(v_now) then
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
