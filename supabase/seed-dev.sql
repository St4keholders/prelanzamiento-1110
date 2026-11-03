-- SOLO DESARROLLO: palabras de prueba para correr la app en local.
-- NO ejecutar en el proyecto real si ya se cargaron las palabras definitivas.
-- Para borrarlas:  delete from public.plays; delete from public.daily_words;

insert into public.daily_words (game_date, word, category) values
  ('2026-11-04', 'PRUEBA UNO',         'Prueba'),
  ('2026-11-05', 'CAMIÓN',             'Prueba'),
  ('2026-11-06', 'PIÑA',               'Prueba'),
  ('2026-11-07', 'AÑO-NUEVO',          'Prueba'),
  ('2026-11-08', 'ÁRBOL GRANDE',       'Prueba'),
  ('2026-11-09', 'PINGÜINO',           'Prueba'),
  ('2026-11-10', 'SOL',                'Prueba'),
  ('2026-11-11', 'LUNA LLENA',         'Prueba'),
  ('2026-11-12', 'MONTAÑA',            'Prueba'),
  ('2026-11-13', 'RÍO',                'Prueba'),
  ('2026-11-14', 'ÚLTIMO DÍA',         'Prueba')
on conflict (game_date) do update set word = excluded.word, category = excluded.category;
