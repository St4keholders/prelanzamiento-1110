-- Tiempo por defecto de 1:30 desde el Día 4 (7 nov). Aplicado el 6 nov ~5:30 p. m. (hora Colombia).
-- Días ya jugados o en curso no se tocan: 4 nov = 120 s, 5 y 6 nov = 60 s.
-- Desde ahora cada día se puede ajustar en /admin/palabras (30 s a 3 min).

alter table public.daily_words alter column time_limit_seconds set default 90;

update public.daily_words
   set time_limit_seconds = 90
 where game_date >= '2026-11-07';
