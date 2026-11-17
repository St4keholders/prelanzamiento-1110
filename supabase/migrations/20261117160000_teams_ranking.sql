-- ===========================================================================
-- Fase post-juego: Ranking + Teams de Ardillas por mesa
--   * event_settings: datos del evento y ventana de reservas (una sola fila, editable en el panel).
--   * teams: un team = una mesa (número 1..table_count, el más bajo libre, por orden de llegada).
--   * team_members: integrantes dentro (cada uno con su ardilla). Una persona, un team.
--   * team_invites: invitaciones por correo pendientes; apartan puesto hasta que se aceptan.
--   * Cupo de una mesa = integrantes + invitaciones pendientes <= seats_per_table.
--   * Mesa "confirmada" cuando tiene seats_per_table integrantes dentro.
-- Todas las operaciones de jugador pasan por funciones atómicas (bloqueo de filas).
-- ===========================================================================

create table public.event_settings (
  id int primary key default 1 check (id = 1),
  title text not null default 'Lanzamiento 1110',
  starts_at timestamptz not null,
  place_name text not null default '',
  address text not null default '',
  maps_url text not null default '',
  reservations_open_at timestamptz not null,
  reservations_close_at timestamptz not null,
  table_count int not null default 10 check (table_count between 1 and 50),
  seats_per_table int not null default 6 check (seats_per_table between 1 and 20),
  check (reservations_close_at > reservations_open_at)
);

insert into public.event_settings
  (id, title, starts_at, place_name, address, maps_url, reservations_open_at, reservations_close_at)
values
  (1, 'Lanzamiento 1110', '2026-11-28 16:00:00-05', '',
   'Cl. 11B #40a-282, El Poblado, Medellín', 'https://maps.app.goo.gl/1GRytdnrPH39Zxmr6',
   now(), '2026-11-24 23:59:59-05');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  table_number int not null unique check (table_number >= 1),
  name text not null check (char_length(name) between 2 and 30),
  flag text not null,
  color text not null,
  motto text not null default '' check (char_length(motto) <= 60),
  captain_id uuid not null references public.participants(id),
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  squirrel text not null,
  joined_at timestamptz not null default now()
);
create index team_members_team_idx on public.team_members (team_id);

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  invited_at timestamptz not null default now()
);
create index team_invites_team_idx on public.team_invites (team_id);

alter table public.event_settings enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;
revoke all on table public.event_settings, public.teams, public.team_members, public.team_invites
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ayudas internas
-- ---------------------------------------------------------------------------

create or replace function public.team_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
    from generate_series(1, 6);
$$;

-- Lanza 'reservations_closed' si la ventana de reservas no está abierta.
create or replace function public.team_assert_open(p_now timestamptz)
returns public.event_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ev public.event_settings;
begin
  select * into v_ev from public.event_settings where id = 1;
  if p_now < v_ev.reservations_open_at or p_now >= v_ev.reservations_close_at then
    raise exception 'reservations_closed' using errcode = 'P0001';
  end if;
  return v_ev;
end;
$$;

create or replace function public.team_seats_used(p_team uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*) from public.team_members where team_id = p_team)::int
       + (select count(*) from public.team_invites where team_id = p_team)::int;
$$;

-- ---------------------------------------------------------------------------
-- Operaciones de jugador
-- ---------------------------------------------------------------------------

-- Crea un team y aparta la mesa libre de número más bajo. Quien lo crea es el capitán.
create or replace function public.team_create(
  p_participant uuid,
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
  v_table int;
  v_team public.teams;
  v_email text;
begin
  -- Serializa la asignación de mesas.
  perform 1 from public.event_settings where id = 1 for update;
  v_ev := public.team_assert_open(v_now);

  if exists (select 1 from public.team_members where participant_id = p_participant) then
    raise exception 'already_in_team' using errcode = 'P0001';
  end if;

  select n into v_table
    from generate_series(1, v_ev.table_count) as n
   where not exists (select 1 from public.teams t where t.table_number = n)
   order by n
   limit 1;
  if v_table is null then
    raise exception 'no_tables' using errcode = 'P0001';
  end if;

  -- Si tenía una invitación pendiente de otro team, la suelta al crear el suyo.
  select email into v_email from public.participants where id = p_participant;
  delete from public.team_invites where email = v_email;

  loop
    begin
      insert into public.teams (table_number, name, flag, color, motto, captain_id, join_code, created_at)
      values (v_table, p_name, p_flag, p_color, coalesce(p_motto, ''), p_participant, public.team_code(), v_now)
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

-- Entra a un team con su código. Si tenía invitación a ese team, la usa; si la tenía de otro, la suelta.
create or replace function public.team_join(
  p_participant uuid,
  p_code text,
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
  v_own_invite boolean;
begin
  v_ev := public.team_assert_open(v_now);

  select * into v_team from public.teams where join_code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'team_not_found' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.team_members where participant_id = p_participant) then
    raise exception 'already_in_team' using errcode = 'P0001';
  end if;

  select email into v_email from public.participants where id = p_participant;
  select exists (select 1 from public.team_invites where team_id = v_team.id and email = v_email)
    into v_own_invite;

  if not v_own_invite and public.team_seats_used(v_team.id) >= v_ev.seats_per_table then
    raise exception 'team_full' using errcode = 'P0001';
  end if;

  delete from public.team_invites where email = v_email;
  insert into public.team_members (team_id, participant_id, squirrel, joined_at)
  values (v_team.id, p_participant, p_squirrel, v_now);
  return v_team;
end;
$$;

-- Acepta la invitación pendiente que tiene su correo.
create or replace function public.team_accept_invite(
  p_participant uuid,
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
  v_inv public.team_invites;
  v_team public.teams;
begin
  perform public.team_assert_open(v_now);
  select i.* into v_inv
    from public.team_invites i
    join public.participants p on p.email = i.email
   where p.id = p_participant
   for update of i;
  if not found then
    raise exception 'no_invite' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.team_members where participant_id = p_participant) then
    raise exception 'already_in_team' using errcode = 'P0001';
  end if;

  delete from public.team_invites where id = v_inv.id;
  insert into public.team_members (team_id, participant_id, squirrel, joined_at)
  values (v_inv.team_id, p_participant, p_squirrel, v_now);
  select * into v_team from public.teams where id = v_inv.team_id;
  return v_team;
end;
$$;

-- El capitán invita a alguien por correo (aparta un puesto).
create or replace function public.team_invite(
  p_captain uuid,
  p_email text,
  p_full_name text,
  p_now timestamptz default null
)
returns public.team_invites
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_ev public.event_settings;
  v_team public.teams;
  v_email text := lower(trim(p_email));
  v_inv public.team_invites;
begin
  v_ev := public.team_assert_open(v_now);
  select * into v_team from public.teams where captain_id = p_captain for update;
  if not found then
    raise exception 'not_captain' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.team_members m join public.participants p on p.id = m.participant_id
     where p.email = v_email
  ) then
    raise exception 'invitee_in_team' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.team_invites where email = v_email) then
    raise exception 'invitee_invited' using errcode = 'P0001';
  end if;
  if public.team_seats_used(v_team.id) >= v_ev.seats_per_table then
    raise exception 'team_full' using errcode = 'P0001';
  end if;

  insert into public.team_invites (team_id, email, full_name, invited_at)
  values (v_team.id, v_email, trim(p_full_name), v_now)
  returning * into v_inv;
  return v_inv;
end;
$$;

-- Sale del team. Si es el capitán, la capitanía pasa al integrante más antiguo;
-- si era el último, la mesa se libera (se borra el team y sus invitaciones).
create or replace function public.team_leave(
  p_participant uuid,
  p_now timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_member public.team_members;
  v_team public.teams;
  v_next uuid;
begin
  perform public.team_assert_open(v_now);
  select * into v_member from public.team_members where participant_id = p_participant;
  if not found then
    raise exception 'not_in_team' using errcode = 'P0001';
  end if;
  select * into v_team from public.teams where id = v_member.team_id for update;

  delete from public.team_members where id = v_member.id;

  if v_team.captain_id = p_participant then
    select participant_id into v_next
      from public.team_members where team_id = v_team.id
     order by joined_at, id limit 1;
    if v_next is null then
      delete from public.teams where id = v_team.id;
      return 'released';
    end if;
    update public.teams set captain_id = v_next where id = v_team.id;
    return 'captain_transferred';
  end if;
  return 'left';
end;
$$;

revoke execute on function
  public.team_code(),
  public.team_assert_open(timestamptz),
  public.team_seats_used(uuid),
  public.team_create(uuid, text, text, text, text, text, timestamptz),
  public.team_join(uuid, text, text, timestamptz),
  public.team_accept_invite(uuid, text, timestamptz),
  public.team_invite(uuid, text, text, timestamptz),
  public.team_leave(uuid, timestamptz)
from public, anon, authenticated;

grant execute on function
  public.team_code(),
  public.team_assert_open(timestamptz),
  public.team_seats_used(uuid),
  public.team_create(uuid, text, text, text, text, text, timestamptz),
  public.team_join(uuid, text, text, timestamptz),
  public.team_accept_invite(uuid, text, timestamptz),
  public.team_invite(uuid, text, text, timestamptz),
  public.team_leave(uuid, timestamptz)
to service_role;

-- ---------------------------------------------------------------------------
-- Ranking (las 11 palabras del reto; la ronda bonus va aparte)
--   1) más palabras adivinadas  2) menor tiempo total de las adivinadas
--   3) menos vidas perdidas      4) quien se inscribió primero
-- ---------------------------------------------------------------------------

create or replace function public.ranking_table()
returns table (
  participant_id uuid,
  full_name text,
  won int,
  played int,
  total_ms bigint,
  best_ms int,
  lives_lost int,
  registered_at timestamptz,
  rank_position bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with agg as (
    select pl.participant_id,
           count(*) filter (where pl.status = 'won')::int as won,
           count(*)::int as played,
           coalesce(sum(pl.duration_ms) filter (where pl.status = 'won'), 0)::bigint as total_ms,
           min(pl.duration_ms) filter (where pl.status = 'won') as best_ms,
           coalesce(sum(pl.wrong_count), 0)::int as lives_lost
      from public.plays pl
     group by pl.participant_id
  )
  select a.participant_id, pa.full_name, a.won, a.played, a.total_ms, a.best_ms, a.lives_lost,
         pa.created_at,
         row_number() over (
           order by a.won desc, a.total_ms asc, a.lives_lost asc, pa.created_at asc, pa.id
         )
    from agg a
    join public.participants pa on pa.id = a.participant_id;
$$;

revoke execute on function public.ranking_table() from public, anon, authenticated;
grant execute on function public.ranking_table() to service_role;

-- El juego terminó: cierra partidas que quedaron "playing" con el reloj vencido.
select public.expire_plays();
