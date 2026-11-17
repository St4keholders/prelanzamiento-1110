-- ===========================================================================
-- Datos de contacto para reservar o unirse a una mesa: se agrega la profesión.
-- (Nombre completo, correo y teléfono ya están en participants.)
-- ===========================================================================

alter table public.participants
  add column if not exists profession text
  check (profession is null or char_length(profession) between 2 and 80);
