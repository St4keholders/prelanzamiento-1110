-- Cronómetro de 1 minuto desde el Día 2 (5 nov). El Día 1 (4 nov) se jugó con 120 s.
-- Las filas del 5 al 14 de noviembre ya se actualizaron el 4 nov a las ~8:45 p. m. (hora Colombia).
-- El panel (/admin/palabras) guarda siempre time_limit_seconds = 60 (lib/time.ts → TIME_LIMIT_SECONDS).
-- Ejecutar este archivo es opcional: solo cambia el valor por defecto de la columna y repite la actualización.

alter table public.daily_words alter column time_limit_seconds set default 60;

update public.daily_words
   set time_limit_seconds = 60
 where game_date >= '2026-11-05';
