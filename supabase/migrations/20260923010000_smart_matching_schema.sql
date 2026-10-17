-- Smart position-matching upgrade: attribute-weighted scoring on top of the
-- existing modular/category system. Extends, does not replace: module_category
-- keeps organizing the module library and archetype_category_weights stays in
-- place as a legacy/admin-visible template, but the assembler's real targets
-- now come from a 7-attribute needs profile (position base -> phase modifier
-- -> goal-emphasis boost) scored against exercise-level attribute weights.

-- ---------------------------------------------------------------------------
-- 1. Taxonomies
-- ---------------------------------------------------------------------------
create type public.training_attribute as enum (
  'speed', 'strength', 'power', 'agility', 'coordination', 'conditioning', 'mobility'
);
create type public.movement_pattern as enum (
  'upper_push', 'upper_pull', 'hinge', 'squat', 'single_leg', 'core',
  'carry', 'rotational', 'plyometric', 'locomotion'
);
create type public.limitation_body_area as enum (
  'knee', 'ankle_foot', 'hip', 'low_back', 'shoulder', 'elbow_wrist', 'hamstring_groin', 'other'
);
create type public.calendar_event_type as enum ('game', 'practice');
-- ---------------------------------------------------------------------------
-- 2. Exercise-level tagging (Part 1): fixed 0-10 attribute weights + a
--    separate movement-pattern tag. Workout-level profiles are NOT stored -
--    they're computed by aggregating these, weighted by sets, at read time
--    (see src/lib/program/attributes.ts). This keeps tagging at one place and
--    consistent as exercises get reused across workouts.
-- ---------------------------------------------------------------------------
alter table public.exercises
  add column attr_speed smallint not null default 0 check (attr_speed between 0 and 10),
  add column attr_strength smallint not null default 0 check (attr_strength between 0 and 10),
  add column attr_power smallint not null default 0 check (attr_power between 0 and 10),
  add column attr_agility smallint not null default 0 check (attr_agility between 0 and 10),
  add column attr_coordination smallint not null default 0 check (attr_coordination between 0 and 10),
  add column attr_conditioning smallint not null default 0 check (attr_conditioning between 0 and 10),
  add column attr_mobility smallint not null default 0 check (attr_mobility between 0 and 10),
  add column movement_pattern public.movement_pattern;
comment on column public.exercises.attr_speed is 'Fixed-taxonomy attribute weight 0-10, admin-set (auto-suggested from name/muscle groups, confirmed/adjusted before save).';
-- Auto-suggest heuristic: admins get a starting point when adding an exercise,
-- then confirm or adjust before saving (never auto-applied silently). Also
-- used to backfill the 146 pre-existing exercises below. STABLE + no side
-- effects, so it's safe to expose to any authenticated caller; the write path
-- (exercises table RLS) is still admin-only regardless of who can call this.
create or replace function public.suggest_exercise_attributes(p_name text, p_muscle_groups text[] default '{}')
returns table (
  speed smallint, strength smallint, power smallint, agility smallint,
  coordination smallint, conditioning smallint, mobility smallint,
  movement_pattern public.movement_pattern
)
language plpgsql
stable
as $$
declare
  t text := lower(coalesce(p_name, '') || ' ' || array_to_string(coalesce(p_muscle_groups, '{}'), ' '));
  v_speed smallint := 1; v_strength smallint := 1; v_power smallint := 1; v_agility smallint := 1;
  v_coordination smallint := 1; v_conditioning smallint := 1; v_mobility smallint := 1;
  v_pattern public.movement_pattern := null;
begin
  if t ~ 'reaction|reactive|diving save|high-ball|mirror drill' then
    v_coordination := 9; v_agility := 6; v_speed := 4; v_power := 3;
  elsif t ~ 'woodchop|rotational throw|landmine rotation|med(icine)? ball slam|scoop toss' then
    v_power := 7; v_coordination := 7; v_strength := 3; v_agility := 2;
    v_pattern := 'rotational';
  elsif t ~ 'box jump|broad jump|depth jump|pogo|tuck jump|skater jump|split squat jump|trap bar jump|hurdle hop|jump squat' then
    v_power := 9; v_agility := 5; v_coordination := 4; v_strength := 3; v_speed := 3; v_mobility := 1;
    v_pattern := 'plyometric';
  elsif t ~ 'sprint|-yard dash|dash\b|acceleration|\bfly\b|flying|wicket run|first-step|three-point start' then
    v_speed := 9; v_power := 5; v_conditioning := 4; v_agility := 3; v_coordination := 2; v_strength := 2;
    v_pattern := 'locomotion';
  elsif t ~ 'shuttle|cone|ladder|carioca|backpedal|footwork|drop-step|drop step|t-drill|w-drill|box drill|zig-zag|closeout|cut drill|slide drill|defensive slide' then
    v_agility := 9; v_coordination := 6; v_speed := 5; v_conditioning := 3; v_power := 3; v_strength := 1;
    v_pattern := 'locomotion';
  elsif t ~ 'interval|tempo run|zone 2|fartlek|rowing|assault bike|battle rope|gasser|300-yard' then
    v_conditioning := 9; v_speed := 3; v_agility := 2; v_power := 2; v_strength := 1;
  elsif t ~ 'stretch|mobility|\bcars\b|foam roll|warm-up|wall slide|open book|rockback|90/90|couch stretch|sleeper stretch|ankle wall' then
    v_mobility := 9; v_coordination := 2; v_strength := 1;
  elsif t ~ 'farmer|suitcase carry|sled push|sled drag|turkish get-up' then
    v_strength := 7; v_conditioning := 5; v_coordination := 3; v_power := 2;
    v_pattern := 'carry';
  elsif t ~ 'plank|dead bug|pallof|ab wheel|hollow body|bird dog' then
    v_strength := 3; v_coordination := 5; v_mobility := 3; v_conditioning := 2;
    v_pattern := 'core';
  elsif t ~ 'clean|snatch|push press|hang power' then
    v_power := 9; v_strength := 6; v_coordination := 5; v_speed := 3;
  elsif t ~ 'single-leg|bulgarian|split squat(?! jump)|step-up|lateral lunge|reverse lunge|pistol|cossack' then
    v_strength := 5; v_coordination := 6; v_mobility := 3; v_agility := 2;
    v_pattern := 'single_leg';
  elsif t ~ 'squat|goblet' then
    v_strength := 8; v_power := 5; v_coordination := 3;
    v_pattern := 'squat';
  elsif t ~ 'deadlift|good morning|hip thrust|kettlebell swing|glute bridge' then
    v_strength := 8; v_power := 5; v_coordination := 3;
    v_pattern := 'hinge';
  elsif t ~ 'bench press|push-up|overhead press|incline|landmine press|dip|chest pass' then
    v_strength := 8; v_power := 4; v_coordination := 2;
    v_pattern := 'upper_push';
  elsif t ~ '\brow\b|pull-up|chin-up|pulldown' then
    v_strength := 8; v_power := 3; v_coordination := 3;
    v_pattern := 'upper_pull';
  elsif t ~ 'bear crawl|mountain climber|burpee' then
    v_conditioning := 5; v_strength := 3; v_coordination := 4; v_power := 2;
    v_pattern := 'core';
  end if;

  return query select
    least(10, greatest(0, v_speed))::smallint, least(10, greatest(0, v_strength))::smallint, least(10, greatest(0, v_power))::smallint,
    least(10, greatest(0, v_agility))::smallint, least(10, greatest(0, v_coordination))::smallint, least(10, greatest(0, v_conditioning))::smallint,
    least(10, greatest(0, v_mobility))::smallint, v_pattern;
end;
$$;
-- Backfill the 146 pre-existing exercises so nothing is left untagged.
do $$
declare
  r record;
  s record;
begin
  for r in select id, name, muscle_groups from public.exercises loop
    select * into s from public.suggest_exercise_attributes(r.name, r.muscle_groups);
    update public.exercises set
      attr_speed = s.speed, attr_strength = s.strength, attr_power = s.power, attr_agility = s.agility,
      attr_coordination = s.coordination, attr_conditioning = s.conditioning, attr_mobility = s.mobility,
      movement_pattern = coalesce(movement_pattern, s.movement_pattern)
    where id = r.id;
  end loop;
end $$;
do $$
declare untagged int;
begin
  select count(*) into untagged from public.exercises
    where attr_speed = 0 and attr_strength = 0 and attr_power = 0 and attr_agility = 0
      and attr_coordination = 0 and attr_conditioning = 0 and attr_mobility = 0;
  if untagged > 0 then
    raise exception 'Attribute backfill left % exercises with an all-zero profile', untagged;
  end if;
end $$;
-- ---------------------------------------------------------------------------
-- 3. Rep/set prescription flex (Part 1): the same exercise can be prescribed
--    differently depending on which role it's filling in a session. Optional
--    per (exercise, role) - falls back to the workout's own workout_exercises
--    row (sets/reps) when nothing role-specific is defined.
-- ---------------------------------------------------------------------------
create table public.exercise_role_prescriptions (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  role public.training_attribute not null,
  sets int not null check (sets between 1 and 20),
  reps text not null,
  load_pct smallint check (load_pct between 0 and 100),
  tempo text,
  primary key (exercise_id, role)
);
-- Seed a handful of common compounds so the flex is demonstrably live without
-- requiring a full admin backfill of every exercise (admins can add more).
insert into public.exercise_role_prescriptions (exercise_id, role, sets, reps, load_pct, tempo)
select id, role::public.training_attribute, sets, reps, load_pct, tempo from public.exercises
join (values
  ('back-squat', 'strength', 4, '3-5', 85, 'controlled'),
  ('back-squat', 'power', 4, '3', 65, 'explosive'),
  ('back-squat', 'conditioning', 3, '12-15', 45, 'moderate'),
  ('front-squat', 'strength', 4, '3-5', 82, 'controlled'),
  ('front-squat', 'power', 4, '3', 60, 'explosive'),
  ('conventional-deadlift', 'strength', 4, '2-4', 87, 'controlled'),
  ('conventional-deadlift', 'power', 3, '3', 65, 'explosive'),
  ('trap-bar-deadlift', 'strength', 4, '3-5', 85, 'controlled'),
  ('trap-bar-deadlift', 'power', 4, '3', 60, 'explosive'),
  ('barbell-bench-press', 'strength', 4, '3-5', 85, 'controlled'),
  ('barbell-bench-press', 'power', 4, '3', 55, 'explosive'),
  ('overhead-press', 'strength', 4, '4-6', 80, 'controlled'),
  ('push-press', 'power', 4, '3', 70, 'explosive'),
  ('barbell-row', 'strength', 4, '5-8', 75, 'controlled'),
  ('hang-power-clean', 'power', 5, '2-3', 70, 'explosive'),
  ('kettlebell-swing', 'power', 4, '10-12', null, 'explosive'),
  ('kettlebell-swing', 'conditioning', 4, '20-25', null, 'moderate'),
  ('goblet-squat', 'strength', 4, '6-8', null, 'controlled'),
  ('goblet-squat', 'conditioning', 3, '15-20', null, 'moderate'),
  ('bulgarian-split-squat', 'strength', 3, '6-8 per leg', null, 'controlled')
) as seed(slug, role, sets, reps, load_pct, tempo) on seed.slug = exercises.slug;
-- ---------------------------------------------------------------------------
-- 4. Position needs profile (dynamic scoring input, Part 1): base profile per
--    position, phase modifiers applied globally, and goal-emphasis handled at
--    generation time. One unified formula lives in TS
--    (src/lib/program/attributes.ts:computeEffectiveProfile).
-- ---------------------------------------------------------------------------
create table public.position_needs_profiles (
  position_id uuid primary key references public.positions(id) on delete cascade,
  attr_speed smallint not null default 5 check (attr_speed between 0 and 10),
  attr_strength smallint not null default 5 check (attr_strength between 0 and 10),
  attr_power smallint not null default 5 check (attr_power between 0 and 10),
  attr_agility smallint not null default 5 check (attr_agility between 0 and 10),
  attr_coordination smallint not null default 5 check (attr_coordination between 0 and 10),
  attr_conditioning smallint not null default 5 check (attr_conditioning between 0 and 10),
  attr_mobility smallint not null default 5 check (attr_mobility between 0 and 10),
  updated_at timestamptz not null default now()
);
create table public.phase_attribute_modifiers (
  phase public.training_phase not null,
  attribute public.training_attribute not null,
  modifier smallint not null default 0 check (modifier between -5 and 5),
  primary key (phase, attribute)
);
insert into public.phase_attribute_modifiers (phase, attribute, modifier) values
  ('off_season', 'strength', 2), ('off_season', 'power', 1), ('off_season', 'speed', 0),
  ('off_season', 'agility', 0), ('off_season', 'coordination', -1), ('off_season', 'conditioning', -1), ('off_season', 'mobility', -1),
  ('pre_season', 'strength', -1), ('pre_season', 'power', 0), ('pre_season', 'speed', 1),
  ('pre_season', 'agility', 2), ('pre_season', 'coordination', 1), ('pre_season', 'conditioning', 1), ('pre_season', 'mobility', -1),
  ('in_season', 'strength', -1), ('in_season', 'power', -1), ('in_season', 'speed', 0),
  ('in_season', 'agility', 0), ('in_season', 'coordination', 1), ('in_season', 'conditioning', 0), ('in_season', 'mobility', 2),
  ('post_season', 'strength', -2), ('post_season', 'power', -2), ('post_season', 'speed', -1),
  ('post_season', 'agility', -1), ('post_season', 'coordination', -1), ('post_season', 'conditioning', -1), ('post_season', 'mobility', 3);
-- Seed per-position base profiles from their archetype (admins can tweak a
-- specific position afterward - this table is per-position, not per-archetype).
insert into public.position_needs_profiles (position_id, attr_speed, attr_strength, attr_power, attr_agility, attr_coordination, attr_conditioning, attr_mobility)
select p.id, tmpl.speed, tmpl.strength, tmpl.power, tmpl.agility, tmpl.coordination, tmpl.conditioning, tmpl.mobility
from public.positions p
join public.position_archetypes a on a.id = p.archetype_id
join (values
  ('skill-speed', 9, 5, 7, 8, 7, 6, 5),
  ('power-leverage', 4, 9, 8, 4, 5, 5, 5),
  ('hybrid', 6, 7, 6, 6, 6, 7, 5),
  ('thrower', 5, 6, 7, 5, 8, 5, 7),
  ('engine', 6, 5, 5, 6, 6, 9, 5)
) as tmpl(archetype_slug, speed, strength, power, agility, coordination, conditioning, mobility)
  on tmpl.archetype_slug = a.slug
on conflict (position_id) do nothing;
-- Any position without an archetype (or added after this migration) still
-- gets a sane even-split default via the table's own column defaults - insert
-- one for every remaining position explicitly so scoring never silently no-ops.
insert into public.position_needs_profiles (position_id)
select p.id from public.positions p
left join public.position_needs_profiles n on n.position_id = p.id
where n.position_id is null;
-- ---------------------------------------------------------------------------
-- 5. Goal emphasis moves from module_category to the new attribute taxonomy
--    (Part 2: baseline coverage by default, emphasis is an "extra focus"
--    boost, not an inclusion filter). The old `emphasis` column is kept as
--    read-only history; new writes go to emphasis_attributes.
-- ---------------------------------------------------------------------------
alter table public.user_programs
  add column emphasis_attributes public.training_attribute[] not null default '{}'
    check (cardinality(emphasis_attributes) <= 2);
update public.user_programs up
set emphasis_attributes = (
  select coalesce(array_agg(distinct mapped.attr), '{}')
  from unnest(up.emphasis) as cat(c)
  join (values
    ('strength', 'strength'), ('speed_acceleration', 'speed'), ('agility_cod', 'agility'),
    ('conditioning', 'conditioning'), ('mobility_injury_prevention', 'mobility'), ('position_skill', 'coordination')
  ) as mapped(cat, attr) on mapped.cat = cat.c::text
)::public.training_attribute[]
where cardinality(up.emphasis) > 0;
-- ---------------------------------------------------------------------------
-- 6. Part 4 "personal coach" additions
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column target_date date,
  add column target_event text check (char_length(target_event) <= 100);
alter table public.user_program_days
  add column deload boolean not null default false;
create table public.user_training_limitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body_area public.limitation_body_area not null,
  note text check (char_length(note) <= 200),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.user_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_date date not null,
  event_type public.calendar_event_type not null,
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  unique (user_id, event_date, event_type)
);
-- ---------------------------------------------------------------------------
-- 7. RLS
-- ---------------------------------------------------------------------------
alter table public.exercise_role_prescriptions enable row level security;
alter table public.position_needs_profiles enable row level security;
alter table public.phase_attribute_modifiers enable row level security;
alter table public.user_training_limitations enable row level security;
alter table public.user_calendar_events enable row level security;
create policy "exercise_role_prescriptions_select_all" on public.exercise_role_prescriptions for select using (true);
create policy "exercise_role_prescriptions_admin_insert" on public.exercise_role_prescriptions for insert with check (public.is_admin());
create policy "exercise_role_prescriptions_admin_update" on public.exercise_role_prescriptions for update using (public.is_admin()) with check (public.is_admin());
create policy "exercise_role_prescriptions_admin_delete" on public.exercise_role_prescriptions for delete using (public.is_admin());
create policy "position_needs_profiles_select_all" on public.position_needs_profiles for select using (true);
create policy "position_needs_profiles_admin_insert" on public.position_needs_profiles for insert with check (public.is_admin());
create policy "position_needs_profiles_admin_update" on public.position_needs_profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "position_needs_profiles_admin_delete" on public.position_needs_profiles for delete using (public.is_admin());
create policy "phase_attribute_modifiers_select_all" on public.phase_attribute_modifiers for select using (true);
create policy "phase_attribute_modifiers_admin_insert" on public.phase_attribute_modifiers for insert with check (public.is_admin());
create policy "phase_attribute_modifiers_admin_update" on public.phase_attribute_modifiers for update using (public.is_admin()) with check (public.is_admin());
create policy "phase_attribute_modifiers_admin_delete" on public.phase_attribute_modifiers for delete using (public.is_admin());
create policy "user_training_limitations_select_own" on public.user_training_limitations for select using (auth.uid() = user_id);
create policy "user_training_limitations_insert_own" on public.user_training_limitations for insert with check (auth.uid() = user_id);
create policy "user_training_limitations_update_own" on public.user_training_limitations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_training_limitations_delete_own" on public.user_training_limitations for delete using (auth.uid() = user_id);
create policy "user_calendar_events_select_own" on public.user_calendar_events for select using (auth.uid() = user_id);
create policy "user_calendar_events_insert_own" on public.user_calendar_events for insert with check (auth.uid() = user_id);
create policy "user_calendar_events_update_own" on public.user_calendar_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_calendar_events_delete_own" on public.user_calendar_events for delete using (auth.uid() = user_id);
