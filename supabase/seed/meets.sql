-- 2026 Pro Indoor meets
-- Insert into the 2026 Pro Indoor season (look up by name)

insert into public.meets (season_id, name, location, tier, starts_at, ends_at, is_scored)
select
  s.id,
  m.name,
  m.location,
  m.tier::public.meet_tier,
  m.starts_at::timestamptz,
  m.ends_at::timestamptz,
  m.is_scored
from public.seasons s
cross join (values
  ('Millrose Games',            'New York, USA',        'gold',               '2026-02-07 18:00:00+00', '2026-02-07 22:00:00+00', false),
  ('Boston Indoor Games',       'Boston, USA',          'silver',             '2026-01-24 18:00:00+00', '2026-01-24 22:00:00+00', false),
  ('Copernicus Cup',            'Torun, Poland',        'gold',               '2026-02-14 14:00:00+00', '2026-02-14 18:00:00+00', false),
  ('Indoor Meetings Karlsruhe', 'Karlsruhe, Germany',   'silver',             '2026-01-31 14:00:00+00', '2026-01-31 18:00:00+00', false),
  ('XL Galan',                  'Stockholm, Sweden',    'gold',               '2026-02-20 15:00:00+00', '2026-02-20 19:00:00+00', false),
  ('Sydbank Games',             'Søndeborg, Denmark',   'bronze',             '2026-02-05 15:00:00+00', '2026-02-05 19:00:00+00', false),
  ('New Balance Indoor Grand Prix', 'Boston, USA',      'silver',             '2026-02-28 17:00:00+00', '2026-02-28 21:00:00+00', false),
  ('World Athletics Indoor Championships', 'Nanjing, China', 'world_championship', '2026-03-13 08:00:00+00', '2026-03-15 18:00:00+00', false)
) as m(name, location, tier, starts_at, ends_at, is_scored)
where s.name = '2026 Pro Indoor'
on conflict do nothing;
