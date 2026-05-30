-- FieldDay seed data
-- Run after migrations: supabase db reset (applies migrations + seed)
-- Or manually: psql -f supabase/seed/seed.sql

-- ============================================================
-- Athletes (pro pool — Phase 1 only)
-- Salaries use a 50,000 credit cap; top stars ~10K, depth ~7K
-- ============================================================

insert into public.athletes (pool, gender, first_name, last_name, country_code, primary_event, events, salary, is_active) values
-- Men's sprints
('pro','men','Noah','Lyles','USA','100m',array['100m','200m'],10000,true),
('pro','men','Kishane','Thompson','JAM','100m',array['100m','200m'],9500,true),
('pro','men','Marcell','Jacobs','ITA','100m',array['100m'],9200,true),
('pro','men','Fred','Kerley','USA','100m',array['100m','200m'],9000,true),
('pro','men','Oblique','Seville','JAM','100m',array['100m','200m'],8500,true),
('pro','men','Ferdinand','Omanyala','KEN','100m',array['100m'],7800,true),
('pro','men','Letsile','Tebogo','BOT','200m',array['200m','100m'],9000,true),
('pro','men','Kenny','Bednarek','USA','200m',array['200m'],8500,true),
('pro','men','Joseph','Fahnbulleh','LBR','200m',array['200m','100m'],7500,true),
-- Men's 400m
('pro','men','Quincy','Hall','USA','400m',array['400m'],8800,true),
('pro','men','Matthew','Hudson-Smith','GBR','400m',array['400m'],8200,true),
('pro','men','Michael','Norman','USA','400m',array['400m'],7900,true),
('pro','men','Muzala','Samukonga','ZAM','400m',array['400m'],7500,true),
-- Men's middle distance
('pro','men','Emmanuel','Wanyonyi','KEN','800m',array['800m'],9200,true),
('pro','men','Marco','Arop','CAN','800m',array['800m','1500m'],8500,true),
('pro','men','Djamel','Sedjati','ALG','800m',array['800m'],8000,true),
('pro','men','Jakob','Ingebrigtsen','NOR','1500m',array['1500m','5000m'],10000,true),
('pro','men','Josh','Kerr','GBR','1500m',array['1500m'],9500,true),
('pro','men','Cole','Hocker','USA','1500m',array['1500m'],9000,true),
-- Men's long distance
('pro','men','Grant','Fisher','USA','5000m',array['5000m','10000m'],8500,true),
('pro','men','Joshua','Cheptegei','UGA','5000m',array['5000m','10000m'],9200,true),
('pro','men','Selemon','Barega','ETH','10000m',array['10000m','5000m'],8000,true),
-- Men's steeplechase
('pro','men','Soufiane','El Bakkali','MAR','3000m_steeplechase',array['3000m_steeplechase'],9000,true),
('pro','men','Lamecha','Girma','ETH','3000m_steeplechase',array['3000m_steeplechase'],8500,true),
-- Men's hurdles
('pro','men','Grant','Holloway','USA','110m_hurdles',array['110m_hurdles'],10000,true),
('pro','men','Hansle','Parchment','JAM','110m_hurdles',array['110m_hurdles'],8500,true),
('pro','men','Karsten','Warholm','NOR','400m_hurdles',array['400m_hurdles'],10000,true),
('pro','men','Rai','Benjamin','USA','400m_hurdles',array['400m_hurdles'],9500,true),
('pro','men','Alison','dos Santos','BRA','400m_hurdles',array['400m_hurdles'],9000,true),
-- Men's field
('pro','men','Mondo','Duplantis','SWE','pole_vault',array['pole_vault'],10000,true),
('pro','men','Sam','Kendricks','USA','pole_vault',array['pole_vault'],8500,true),
('pro','men','Chris','Nilsen','USA','pole_vault',array['pole_vault'],7800,true),
('pro','men','Gianmarco','Tamberi','ITA','high_jump',array['high_jump'],8500,true),
('pro','men','Mutaz Essa','Barshim','QAT','high_jump',array['high_jump'],8000,true),
('pro','men','Miltiadis','Tentoglou','GRE','long_jump',array['long_jump'],9000,true),
('pro','men','JuVaughn','Harrison','USA','long_jump',array['long_jump','high_jump'],7500,true),
('pro','men','Pedro Pablo','Pichardo','POR','triple_jump',array['triple_jump'],8500,true),
('pro','men','Ryan','Crouser','USA','shot_put',array['shot_put'],10000,true),
('pro','men','Joe','Kovacs','USA','shot_put',array['shot_put'],8500,true),
('pro','men','Kristjan','Čeh','SLO','discus',array['discus'],8500,true),
('pro','men','Andrius','Gudžius','LTU','discus',array['discus'],7500,true),
('pro','men','Wojciech','Nowicki','POL','hammer',array['hammer'],8000,true),
('pro','men','Neeraj','Chopra','IND','javelin',array['javelin'],10000,true),
('pro','men','Julian','Weber','GER','javelin',array['javelin'],8000,true),
('pro','men','Eliud','Kipchoge','KEN','marathon',array['marathon'],10000,true),
-- Women's sprints
('pro','women','Sha''Carri','Richardson','USA','100m',array['100m','200m'],10000,true),
('pro','women','Julien Alfred','Alfred','LCA','100m',array['100m'],9500,true),
('pro','women','Shericka','Jackson','JAM','100m',array['100m','200m'],9200,true),
('pro','women','Elaine','Thompson-Herah','JAM','100m',array['100m','200m'],8800,true),
('pro','women','Dina Asher','Smith','GBR','100m',array['100m','200m'],8000,true),
('pro','women','Gabrielle','Thomas','USA','200m',array['200m','100m'],9000,true),
-- Women's 400m
('pro','women','Marileidy','Paulino','DOM','400m',array['400m'],10000,true),
('pro','women','Natalia','Kaczmarek','POL','400m',array['400m'],9000,true),
('pro','women','Alexis','Holmes','USA','400m',array['400m'],8500,true),
-- Women's middle distance
('pro','women','Athing','Mu','USA','800m',array['800m'],10000,true),
('pro','women','Keely','Hodgkinson','GBR','800m',array['800m'],9500,true),
('pro','women','Mary','Moraa','KEN','800m',array['800m'],9000,true),
('pro','women','Faith','Kipyegon','KEN','1500m',array['1500m','5000m'],10000,true),
('pro','women','Gudaf','Tsegay','ETH','1500m',array['1500m','5000m'],9000,true),
('pro','women','Laura','Muir','GBR','1500m',array['1500m'],8000,true),
-- Women's long distance
('pro','women','Sifan','Hassan','NED','5000m',array['5000m','10000m','marathon'],9500,true),
('pro','women','Beatrice','Chebet','KEN','5000m',array['5000m','10000m'],8500,true),
('pro','women','Letesenbet','Gidey','ETH','10000m',array['10000m','5000m'],9000,true),
-- Women's steeplechase
('pro','women','Winfred','Yavi','BRN','3000m_steeplechase',array['3000m_steeplechase'],9000,true),
('pro','women','Norah','Jeruto','KAZ','3000m_steeplechase',array['3000m_steeplechase'],8500,true),
-- Women's hurdles
('pro','women','Sydney','McLaughlin-Levrone','USA','400m_hurdles',array['400m_hurdles'],10000,true),
('pro','women','Femke','Bol','NED','400m_hurdles',array['400m_hurdles','400m'],9500,true),
('pro','women','Masai','Russell','USA','100m_hurdles',array['100m_hurdles'],9000,true),
('pro','women','Tobi','Amusan','NGR','100m_hurdles',array['100m_hurdles'],8500,true),
('pro','women','Anna','Cockrell','USA','400m_hurdles',array['400m_hurdles'],8000,true),
-- Women's field
('pro','women','Nina','Kennedy','AUS','pole_vault',array['pole_vault'],9000,true),
('pro','women','Katie','Moon','USA','pole_vault',array['pole_vault'],8500,true),
('pro','women','Yaroslava','Mahuchikh','UKR','high_jump',array['high_jump'],9000,true),
('pro','women','Eleanor','Patterson','AUS','high_jump',array['high_jump'],8500,true),
('pro','women','Tara','Davis-Woodhall','USA','long_jump',array['long_jump'],9000,true),
('pro','women','Malaika','Mihambo','GER','long_jump',array['long_jump'],8500,true),
('pro','women','Shanieka','Ricketts','JAM','triple_jump',array['triple_jump'],8000,true),
('pro','women','Chase','Ealey','USA','shot_put',array['shot_put'],8500,true),
('pro','women','Sarah','Mitton','CAN','shot_put',array['shot_put'],8000,true),
('pro','women','Valarie','Allman','USA','discus',array['discus'],9000,true),
('pro','women','Brooke','Andersen','USA','hammer',array['hammer'],8500,true),
('pro','women','Haruka','Kitaguchi','JPN','javelin',array['javelin'],8000,true),
('pro','women','Kelsey-Lee','Barber','AUS','javelin',array['javelin'],7500,true),
('pro','women','Nafissatou','Thiam','BEL','heptathlon',array['heptathlon'],9000,true),
('pro','women','Anna','Hall','USA','heptathlon',array['heptathlon'],8500,true),
('pro','women','Ruth','Chepngetich','KEN','marathon',array['marathon'],9500,true),
('pro','women','Brigid','Kosgei','KEN','marathon',array['marathon'],9000,true)
on conflict do nothing;

-- ============================================================
-- Seasons (2026 Pro Indoor — the first active season)
-- ============================================================

insert into public.seasons (level, discipline, name, status, draft_opens_at, starts_at, ends_at, salary_cap, roster_size, starting_slots)
values (
  'pro',
  'indoor',
  '2026 Pro Indoor',
  'upcoming',
  '2026-01-01 00:00:00+00',
  '2026-01-10 00:00:00+00',
  '2026-03-15 00:00:00+00',
  50000,
  8,
  6
)
on conflict do nothing;
