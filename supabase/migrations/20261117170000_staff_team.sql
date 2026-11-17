-- ===========================================================================
-- Mesa del equipo 1110 (admins): una mesa extra, fuera de las mesas públicas.
--   * teams.staff = true la marca. Solo puede haber una.
--   * Toma el número siguiente a las mesas públicas (con 10 mesas, es la Mesa 11),
--     así nunca le quita puesto a los jugadores.
--   * Se crea y se llena desde el panel (Admin → Mesas).
-- Correr DESPUÉS de 20261117160000_teams_ranking.sql.
-- ===========================================================================

alter table public.teams add column if not exists staff boolean not null default false;

create unique index if not exists teams_one_staff on public.teams ((true)) where staff;
