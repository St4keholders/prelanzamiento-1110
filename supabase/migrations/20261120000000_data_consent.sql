-- ===========================================================================
-- Autorización de tratamiento de datos (Ley 1581 de 2012).
-- Guarda cuándo cada persona aceptó la Política de Tratamiento de Datos, como
-- prueba de la autorización. Se llena al registrarse o al dejar sus datos para
-- reservar o unirse a una mesa.
-- ===========================================================================

alter table public.participants
  add column if not exists data_consent_at timestamptz;

comment on column public.participants.data_consent_at is
  'Fecha en que aceptó la Política de Tratamiento de Datos (null = aún no la acepta).';
