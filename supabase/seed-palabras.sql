-- PALABRAS DEFINITIVAS DEL RETO (4 al 14 de noviembre de 2026, hora Colombia)
--
-- 1. Reemplaza cada 'PALABRA_DIA_X' y 'CATEGORIA_DIA_X' por la palabra y la categoría reales.
--    - Escribe la palabra en MAYÚSCULAS. Puede tener espacios, tildes, Ñ y guiones.
--      Ej.: 'RETENCIÓN EN LA FUENTE'
--    - Solo cuentan como letras a adivinar A–Z y Ñ (las tildes se adivinan con la vocal sin tilde).
-- 2. Copia todo este archivo en Supabase → SQL Editor → Run.
-- 3. Verifica con:  select * from public.daily_words order by game_date;  (deben salir 11 filas)
--
-- Si se ejecuta de nuevo, actualiza las palabras existentes (no duplica).
-- ⚠️ No subas este archivo con las palabras reales a un repositorio público.

begin;

insert into public.daily_words (game_date, word, category) values
  ('2026-11-04', 'PALABRA_DIA_1',  'CATEGORIA_DIA_1'),
  ('2026-11-05', 'PALABRA_DIA_2',  'CATEGORIA_DIA_2'),
  ('2026-11-06', 'PALABRA_DIA_3',  'CATEGORIA_DIA_3'),
  ('2026-11-07', 'PALABRA_DIA_4',  'CATEGORIA_DIA_4'),
  ('2026-11-08', 'PALABRA_DIA_5',  'CATEGORIA_DIA_5'),
  ('2026-11-09', 'PALABRA_DIA_6',  'CATEGORIA_DIA_6'),
  ('2026-11-10', 'PALABRA_DIA_7',  'CATEGORIA_DIA_7'),
  ('2026-11-11', 'PALABRA_DIA_8',  'CATEGORIA_DIA_8'),
  ('2026-11-12', 'PALABRA_DIA_9',  'CATEGORIA_DIA_9'),
  ('2026-11-13', 'PALABRA_DIA_10', 'CATEGORIA_DIA_10'),
  ('2026-11-14', 'PALABRA_DIA_11', 'CATEGORIA_DIA_11')
on conflict (game_date) do update
  set word = upper(excluded.word),
      category = excluded.category;

-- Seguridad: impide cargar las plantillas sin reemplazar.
do $$
begin
  if exists (select 1 from public.daily_words where word like 'PALABRA_DIA_%') then
    raise exception 'Faltan palabras por reemplazar en seed-palabras.sql';
  end if;
end $$;

commit;
