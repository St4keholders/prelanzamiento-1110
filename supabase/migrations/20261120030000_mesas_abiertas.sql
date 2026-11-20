-- ===========================================================================
-- Mesas abiertas: cualquier persona escoge la mesa en la que quiere estar,
-- aunque no conozca a nadie.
--   * Si la mesa está vacía, se crea el team con el nombre, bandera y color de
--     la mesa, y esa persona queda como capitán (solo edita el lema).
--   * Si la mesa tiene gente y quedan puestos, entra como integrante.
--   * Si ya estaba en otra mesa, se cambia (hasta el cierre de reservas). En la
--     mesa que deja, la capitanía pasa al integrante más antiguo, y si queda
--     vacía, la mesa se libera.
--   * El enlace para invitar amigos (/m/CÓDIGO) usa esta misma función.
-- Correr DESPUÉS de 20261119180000_mesas_fijas_5_dic.sql.
-- ===========================================================================

create or replace function public.team_take_seat(
  p_participant uuid,
  p_table int,
  p_name text,
  p_flag text,
  p_color text,
  p_squirrel text default null,
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
  v_old public.team_members;
  v_old_team public.teams;
  v_next uuid;
  v_squirrel text;
  v_email text;
begin
  -- Serializa todas las tomas de puesto.
  perform 1 from public.event_settings where id = 1 for update;
  v_ev := public.team_assert_open(v_now);

  if p_table is null or p_table < 1 or p_table > v_ev.table_count then
    raise exception 'table_invalid' using errcode = 'P0001';
  end if;

  select * into v_team from public.teams where table_number = p_table for update;
  if found and v_team.staff then
    raise exception 'table_invalid' using errcode = 'P0001';
  end if;

  select * into v_old from public.team_members where participant_id = p_participant;
  if found and v_team.id is not null and v_old.team_id = v_team.id then
    raise exception 'already_here' using errcode = 'P0001';
  end if;

  if v_team.id is not null and public.team_seats_used(v_team.id) >= v_ev.seats_per_table then
    raise exception 'team_full' using errcode = 'P0001';
  end if;

  v_squirrel := coalesce(p_squirrel, v_old.squirrel);
  if v_squirrel is null then
    raise exception 'invalid' using errcode = 'P0001';
  end if;

  -- Deja la mesa anterior (cambio de mesa).
  if v_old.id is not null then
    select * into v_old_team from public.teams where id = v_old.team_id for update;
    delete from public.team_members where id = v_old.id;
    if v_old_team.captain_id = p_participant then
      select participant_id into v_next
        from public.team_members where team_id = v_old_team.id
       order by joined_at, id limit 1;
      if v_next is null then
        delete from public.teams where id = v_old_team.id;
      else
        update public.teams set captain_id = v_next where id = v_old_team.id;
      end if;
    end if;
  end if;

  -- Si tenía una invitación pendiente, la suelta.
  select email into v_email from public.participants where id = p_participant;
  delete from public.team_invites where email = v_email;

  -- Mesa vacía: se crea el team y quien llega es el capitán.
  if v_team.id is null then
    loop
      begin
        insert into public.teams (table_number, name, flag, color, motto, captain_id, join_code, created_at)
        values (p_table, p_name, p_flag, p_color, '', p_participant, public.team_code(), v_now)
        returning * into v_team;
        exit;
      exception when unique_violation then
        -- Código repetido: se regenera (la mesa está protegida por el bloqueo).
      end;
    end loop;
  end if;

  insert into public.team_members (team_id, participant_id, squirrel, joined_at)
  values (v_team.id, p_participant, v_squirrel, v_now);

  return v_team;
end;
$$;

revoke execute on function public.team_take_seat(uuid, int, text, text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.team_take_seat(uuid, int, text, text, text, text, timestamptz)
  to service_role;

-- Ya no se usan: el capitán no invita por correo y las mesas se toman con team_take_seat.
drop function if exists public.team_create_at(uuid, int, text, text, text, text, text, timestamptz);
drop function if exists public.team_join(uuid, text, text, timestamptz);
drop function if exists public.team_invite(uuid, text, text, timestamptz);
