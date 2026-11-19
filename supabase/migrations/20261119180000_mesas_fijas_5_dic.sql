-- ===========================================================================
-- 1. Mesas fijas: cada mesa (1 a 10) ya tiene nombre, bandera y color definidos
--    por el equipo 1110 (los datos viven en lib/teams-catalog.ts). El capitán
--    escoge una mesa libre en vez de inventar nombre, bandera y color.
-- 2. El evento pasa al sábado 5 de diciembre de 2026 a las 4:00 p. m.
-- Correr DESPUÉS de las migraciones de teams, staff y profesión.
-- ===========================================================================

create or replace function public.team_create_at(
  p_participant uuid,
  p_table int,
  p_name text,
  p_flag text,
  p_color text,
  p_motto text,
  p_squirrel text,
  p_now timestamptz default null
)
returns public.teams
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_ev public.event_settings;
  v_team public.teams;
  v_email text;
begin
  -- Serializa la reserva de mesas.
  perform 1 from public.event_settings where id = 1 for update;
  v_ev := public.team_assert_open(v_now);

  if exists (select 1 from public.team_members where participant_id = p_participant) then
    raise exception 'already_in_team' using errcode = 'P0001';
  end if;

  if p_table is null or p_table < 1 or p_table > v_ev.table_count then
    raise exception 'table_invalid' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.teams where table_number = p_table) then
    raise exception 'table_taken' using errcode = 'P0001';
  end if;

  -- Si tenía una invitación pendiente de otro team, la suelta al crear el suyo.
  select email into v_email from public.participants where id = p_participant;
  delete from public.team_invites where email = v_email;

  loop
    begin
      insert into public.teams (table_number, name, flag, color, motto, captain_id, join_code, created_at)
      values (p_table, p_name, p_flag, p_color, coalesce(p_motto, ''), p_participant, public.team_code(), v_now)
      returning * into v_team;
      exit;
    exception when unique_violation then
      -- Código repetido: se regenera (la mesa está protegida por el bloqueo).
    end;
  end loop;

  insert into public.team_members (team_id, participant_id, squirrel, joined_at)
  values (v_team.id, p_participant, p_squirrel, v_now);

  return v_team;
end;
$$;

revoke execute on function public.team_create_at(uuid, int, text, text, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.team_create_at(uuid, int, text, text, text, text, text, timestamptz)
  to service_role;

-- La versión anterior (mesa libre más baja, nombre inventado) ya no se usa.
drop function if exists public.team_create(uuid, text, text, text, text, text, timestamptz);

-- Nueva fecha del evento. Las reservas cierran el martes 1 de diciembre a las 11:59 p. m.
-- (se puede cambiar después en Admin → Mesas).
update public.event_settings
   set starts_at = '2026-12-05 16:00:00-05',
       reservations_close_at = '2026-12-01 23:59:59-05',
       table_count = 10
 where id = 1;
