-- Modular training system: modules (categorized plans), training phases,
-- position archetypes, assembled weekly programs, readiness check-ins and
-- performance metrics.
--
-- Additive only. No existing table is dropped or recreated, no existing column
-- is removed, and no existing row is modified here (tagging/backfill of the
-- existing plans lives in the next migration). Existing plans, enrollments
-- (user_plans), progress_logs and exercise_logs are untouched.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.module_category as enum (
  'strength',
  'speed_acceleration',
  'agility_cod',
  'conditioning',
  'mobility_injury_prevention',
  'position_skill'
);
create type public.intensity_level as enum ('low', 'moderate', 'high');
create type public.training_phase as enum ('off_season', 'pre_season', 'in_season', 'post_season');
create type public.metric_direction as enum ('lower_is_better', 'higher_is_better');
create type public.program_status as enum ('active', 'archived');
-- ---------------------------------------------------------------------------
-- Modules = the existing plans, now categorized. Columns are nullable here and
-- tightened to NOT NULL once the next migration has backfilled them.
-- plans.goal is kept (legacy, superseded by category) and relaxed to nullable
-- so new modules don't have to supply it.
-- ---------------------------------------------------------------------------
alter table public.plans
  add column category public.module_category,
  add column secondary_category public.module_category,
  add column intensity public.intensity_level,
  add column phases public.training_phase[] not null
    default array['off_season','pre_season','in_season','post_season']::public.training_phase[];
alter table public.plans alter column goal drop not null;
comment on column public.plans.goal is 'Legacy training goal (superseded by plans.category). Kept for backward compatibility.';
comment on column public.plans.category is 'Primary module category used by the program assembler and library.';
comment on column public.plans.secondary_category is 'Optional second tag, e.g. a conditioning module that is also position-skill work.';
comment on column public.plans.intensity is 'Overall intensity of the module, used for weekly load balancing.';
comment on column public.plans.phases is 'Training phases this module is appropriate for.';
alter table public.plans add constraint plans_phases_not_empty check (cardinality(phases) > 0);
create index plans_category_idx on public.plans (category);
-- Session-level intensity (a module can contain an easy aerobic day and a hard interval day).
-- NULL means "inherit the module's intensity".
alter table public.workouts add column intensity public.intensity_level;
-- ---------------------------------------------------------------------------
-- Position archetypes: reusable templates so a new position inherits a solid
-- default instead of being programmed from scratch.
-- ---------------------------------------------------------------------------
create table public.position_archetypes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.positions
  add column archetype_id uuid references public.position_archetypes(id) on delete set null;
create index positions_archetype_id_idx on public.positions (archetype_id);
create table public.training_phase_config (
  phase public.training_phase primary key,
  label text not null,
  description text not null,
  sessions_per_week int not null check (sessions_per_week between 1 and 7),
  volume_pct int not null check (volume_pct between 20 and 100),
  max_high_intensity_sessions int not null check (max_high_intensity_sessions between 0 and 7),
  max_session_intensity public.intensity_level not null default 'high',
  sort_order int not null
);
-- The archetype template: how many "shares" of each category an archetype
-- wants in each phase. The assembler turns shares into sessions per week.
create table public.archetype_category_weights (
  archetype_id uuid not null references public.position_archetypes(id) on delete cascade,
  phase public.training_phase not null,
  category public.module_category not null,
  weight numeric(4,1) not null check (weight >= 0 and weight <= 20),
  primary key (archetype_id, phase, category)
);
-- ---------------------------------------------------------------------------
-- Athlete profile additions
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column training_phase public.training_phase not null default 'off_season',
  add column timezone text check (timezone is null or length(timezone) <= 64);
-- ---------------------------------------------------------------------------
-- Assembled weekly programs (per athlete). A program is a rolling 4-week
-- block; rest days are simply absent rows.
-- ---------------------------------------------------------------------------
create table public.user_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  position_id uuid references public.positions(id) on delete set null,
  phase public.training_phase not null,
  sessions_per_week int not null check (sessions_per_week between 1 and 7),
  emphasis public.module_category[] not null default '{}'
    check (cardinality(emphasis) <= 2),
  status public.program_status not null default 'active',
  started_on date not null default current_date,
  rationale jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index user_programs_user_id_idx on public.user_programs (user_id);
create unique index user_programs_one_active_per_user
  on public.user_programs (user_id) where (status = 'active');
create table public.user_program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.user_programs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_number int not null check (week_number between 1 and 12),
  day_number int not null check (day_number between 1 and 7),
  plan_id uuid references public.plans(id) on delete set null,
  workout_id uuid references public.workouts(id) on delete set null,
  category public.module_category not null,
  intensity public.intensity_level not null,
  volume_pct int not null default 100 check (volume_pct between 20 and 100),
  title text,
  unique (program_id, week_number, day_number)
);
create index user_program_days_program_id_idx on public.user_program_days (program_id);
create index user_program_days_user_id_idx on public.user_program_days (user_id);
-- ---------------------------------------------------------------------------
-- Workout completion logs gain program/category context (all nullable or
-- defaulted, so every existing row stays valid).
-- ---------------------------------------------------------------------------
alter table public.progress_logs
  add column program_day_id uuid references public.user_program_days(id) on delete set null,
  add column plan_id uuid references public.plans(id) on delete set null,
  add column category public.module_category,
  add column intensity public.intensity_level,
  add column volume_pct int not null default 100 check (volume_pct between 20 and 100),
  add column swapped boolean not null default false;
create index progress_logs_program_day_id_idx on public.progress_logs (program_day_id);
-- A log may only point at a program day owned by the same athlete.
create or replace function public.check_progress_log_program_day_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.program_day_id is not null and not exists (
    select 1 from public.user_program_days d
    where d.id = new.program_day_id and d.user_id = new.user_id
  ) then
    raise exception 'program_day_id does not belong to this athlete';
  end if;
  return new;
end;
$$;
create trigger progress_logs_check_program_day_owner
  before insert or update of program_day_id, user_id on public.progress_logs
  for each row execute function public.check_progress_log_program_day_owner();
-- ---------------------------------------------------------------------------
-- Readiness check-ins (one per athlete per day)
-- ---------------------------------------------------------------------------
create table public.readiness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_date date not null,
  score smallint not null check (score between 1 and 5),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);
create index readiness_checkins_user_date_idx on public.readiness_checkins (user_id, checkin_date desc);
-- ---------------------------------------------------------------------------
-- Performance metrics: admin-managed definitions + athlete-owned logs
-- ---------------------------------------------------------------------------
create table public.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  unit text not null,
  display_format text not null default 'number' check (display_format in ('number', 'time')),
  direction public.metric_direction not null,
  category public.module_category not null,
  min_value numeric(8,2) not null,
  max_value numeric(8,2) not null,
  sport_id uuid references public.sports(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (min_value >= 0 and max_value > min_value)
);
-- If a metric has no archetype rows it applies to every archetype.
create table public.metric_archetypes (
  metric_id uuid not null references public.metric_definitions(id) on delete cascade,
  archetype_id uuid not null references public.position_archetypes(id) on delete cascade,
  primary key (metric_id, archetype_id)
);
create table public.metric_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  metric_id uuid not null references public.metric_definitions(id) on delete cascade,
  value numeric(8,2) not null check (value > 0),
  logged_on date not null default current_date,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index metric_logs_user_metric_idx on public.metric_logs (user_id, metric_id, logged_on);
-- Server-side validation: value must be inside the metric's plausible range and
-- the test date can't be in the future (1 day of slack for timezones).
create or replace function public.validate_metric_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare d public.metric_definitions;
begin
  select * into d from public.metric_definitions where id = new.metric_id;
  if not found then raise exception 'unknown metric'; end if;
  if new.value < d.min_value or new.value > d.max_value then
    raise exception '% must be between % and % %', d.name, d.min_value, d.max_value, d.unit
      using errcode = '22003';
  end if;
  if new.logged_on > current_date + 1 then
    raise exception 'test date cannot be in the future' using errcode = '22008';
  end if;
  return new;
end;
$$;
create trigger metric_logs_validate
  before insert or update of value, logged_on, metric_id on public.metric_logs
  for each row execute function public.validate_metric_log();
-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.position_archetypes enable row level security;
alter table public.training_phase_config enable row level security;
alter table public.archetype_category_weights enable row level security;
alter table public.metric_definitions enable row level security;
alter table public.metric_archetypes enable row level security;
alter table public.user_programs enable row level security;
alter table public.user_program_days enable row level security;
alter table public.readiness_checkins enable row level security;
alter table public.metric_logs enable row level security;
-- Admin-managed content: public read, admin write.
create policy "position_archetypes_select_all" on public.position_archetypes for select using (true);
create policy "position_archetypes_admin_insert" on public.position_archetypes for insert with check (public.is_admin());
create policy "position_archetypes_admin_update" on public.position_archetypes for update using (public.is_admin()) with check (public.is_admin());
create policy "position_archetypes_admin_delete" on public.position_archetypes for delete using (public.is_admin());
create policy "training_phase_config_select_all" on public.training_phase_config for select using (true);
create policy "training_phase_config_admin_insert" on public.training_phase_config for insert with check (public.is_admin());
create policy "training_phase_config_admin_update" on public.training_phase_config for update using (public.is_admin()) with check (public.is_admin());
create policy "training_phase_config_admin_delete" on public.training_phase_config for delete using (public.is_admin());
create policy "archetype_category_weights_select_all" on public.archetype_category_weights for select using (true);
create policy "archetype_category_weights_admin_insert" on public.archetype_category_weights for insert with check (public.is_admin());
create policy "archetype_category_weights_admin_update" on public.archetype_category_weights for update using (public.is_admin()) with check (public.is_admin());
create policy "archetype_category_weights_admin_delete" on public.archetype_category_weights for delete using (public.is_admin());
create policy "metric_definitions_select_all" on public.metric_definitions for select using (true);
create policy "metric_definitions_admin_insert" on public.metric_definitions for insert with check (public.is_admin());
create policy "metric_definitions_admin_update" on public.metric_definitions for update using (public.is_admin()) with check (public.is_admin());
create policy "metric_definitions_admin_delete" on public.metric_definitions for delete using (public.is_admin());
create policy "metric_archetypes_select_all" on public.metric_archetypes for select using (true);
create policy "metric_archetypes_admin_insert" on public.metric_archetypes for insert with check (public.is_admin());
create policy "metric_archetypes_admin_update" on public.metric_archetypes for update using (public.is_admin()) with check (public.is_admin());
create policy "metric_archetypes_admin_delete" on public.metric_archetypes for delete using (public.is_admin());
-- Athlete-owned data: own rows only.
create policy "user_programs_select_own" on public.user_programs for select using (auth.uid() = user_id);
create policy "user_programs_insert_own" on public.user_programs for insert with check (auth.uid() = user_id);
create policy "user_programs_update_own" on public.user_programs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_programs_delete_own" on public.user_programs for delete using (auth.uid() = user_id);
create policy "user_program_days_select_own" on public.user_program_days for select using (auth.uid() = user_id);
create policy "user_program_days_insert_own" on public.user_program_days for insert
  with check (auth.uid() = user_id and exists (
    select 1 from public.user_programs p where p.id = program_id and p.user_id = auth.uid()));
create policy "user_program_days_update_own" on public.user_program_days for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and exists (
    select 1 from public.user_programs p where p.id = program_id and p.user_id = auth.uid()));
create policy "user_program_days_delete_own" on public.user_program_days for delete using (auth.uid() = user_id);
create policy "readiness_checkins_select_own" on public.readiness_checkins for select using (auth.uid() = user_id);
create policy "readiness_checkins_insert_own" on public.readiness_checkins for insert with check (auth.uid() = user_id);
create policy "readiness_checkins_update_own" on public.readiness_checkins for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "readiness_checkins_delete_own" on public.readiness_checkins for delete using (auth.uid() = user_id);
create policy "metric_logs_select_own" on public.metric_logs for select using (auth.uid() = user_id);
create policy "metric_logs_insert_own" on public.metric_logs for insert with check (auth.uid() = user_id);
create policy "metric_logs_update_own" on public.metric_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "metric_logs_delete_own" on public.metric_logs for delete using (auth.uid() = user_id);
-- ---------------------------------------------------------------------------
-- Seed: training phases
-- ---------------------------------------------------------------------------
insert into public.training_phase_config
  (phase, label, description, sessions_per_week, volume_pct, max_high_intensity_sessions, max_session_intensity, sort_order)
values
  ('off_season',  'Off-season',  'Build the engine: peak strength, power and speed. Highest volume of the year.', 5, 100, 3, 'high', 1),
  ('pre_season',  'Pre-season',  'Sharpen: convert strength into speed and position skill, and build game conditioning.', 4, 90, 3, 'high', 2),
  ('in_season',   'In-season',   'Maintain: keep strength and speed with reduced volume and plenty of recovery so it never competes with practice and games.', 3, 60, 2, 'high', 3),
  ('post_season', 'Post-season', 'Recover: light, restorative work, mobility and easy aerobic movement.', 2, 50, 0, 'low', 4);
-- ---------------------------------------------------------------------------
-- Seed: archetypes, position mapping and per-phase category templates
-- ---------------------------------------------------------------------------
insert into public.position_archetypes (slug, name, description) values
  ('skill-speed', 'Skill / Speed', 'Speed and change-of-direction dominant athletes (receivers, guards, forwards, outfielders). Heavier emphasis on acceleration, top speed and agility.'),
  ('power-leverage', 'Power / Leverage', 'Size and force dominant athletes (linemen, post players). Heavier emphasis on maximal strength and power, with short-area quickness.'),
  ('hybrid', 'Hybrid', 'Athletes who blend strength, speed and contact (linebackers, defenders). Balanced strength, speed and agility.'),
  ('thrower', 'Rotational / Thrower', 'Athletes whose sport centres on a throwing arm (quarterbacks, pitchers). Strength and rotational power with a large arm-care and mobility component.'),
  ('engine', 'Engine / Endurance', 'Athletes who cover the most ground (midfielders). Strength base plus a large conditioning and repeat-sprint component.');
update public.positions p set archetype_id = a.id
from public.position_archetypes a
join (values
  ('wide-receiver','skill-speed'), ('point-guard','skill-speed'), ('shooting-guard','skill-speed'),
  ('forward','skill-speed'), ('outfielder','skill-speed'), ('infielder','skill-speed'), ('goalkeeper','skill-speed'),
  ('offensive-lineman','power-leverage'), ('center','power-leverage'),
  ('linebacker','hybrid'), ('defender','hybrid'),
  ('quarterback','thrower'), ('pitcher','thrower'),
  ('midfielder','engine')
) as m(pos_slug, arch_slug) on a.slug = m.arch_slug
where p.slug = m.pos_slug;
-- shares per category: strength, speed, agility, conditioning, mobility, position-skill
insert into public.archetype_category_weights (archetype_id, phase, category, weight)
select a.id, v.phase::public.training_phase, c.category::public.module_category, c.weight
from (values
  ('skill-speed',    'off_season',  3.0, 3.0, 2.0, 1.0, 1.0, 0.0),
  ('skill-speed',    'pre_season',  2.0, 3.0, 3.0, 2.0, 1.0, 1.0),
  ('skill-speed',    'in_season',   2.0, 1.5, 1.0, 0.0, 1.5, 0.0),
  ('skill-speed',    'post_season', 0.0, 0.0, 0.0, 1.0, 3.0, 0.0),
  ('power-leverage', 'off_season',  5.0, 1.5, 1.0, 1.5, 1.0, 0.0),
  ('power-leverage', 'pre_season',  3.0, 1.5, 2.0, 2.0, 1.0, 1.0),
  ('power-leverage', 'in_season',   3.0, 0.5, 0.5, 0.0, 1.5, 0.0),
  ('power-leverage', 'post_season', 0.0, 0.0, 0.0, 1.0, 3.0, 0.0),
  ('hybrid',         'off_season',  4.0, 2.0, 2.0, 2.0, 1.0, 0.0),
  ('hybrid',         'pre_season',  2.5, 2.0, 2.5, 2.5, 1.0, 1.0),
  ('hybrid',         'in_season',   2.5, 1.0, 1.0, 0.0, 1.5, 0.0),
  ('hybrid',         'post_season', 0.0, 0.0, 0.0, 1.0, 3.0, 0.0),
  ('thrower',        'off_season',  3.5, 1.5, 1.5, 1.5, 2.5, 0.0),
  ('thrower',        'pre_season',  2.5, 1.5, 2.0, 1.5, 2.5, 1.5),
  ('thrower',        'in_season',   2.5, 0.5, 0.5, 0.0, 3.0, 0.0),
  ('thrower',        'post_season', 0.0, 0.0, 0.0, 1.0, 4.0, 0.0),
  ('engine',         'off_season',  3.0, 2.0, 1.5, 3.0, 1.0, 0.0),
  ('engine',         'pre_season',  2.0, 2.0, 2.0, 3.0, 1.0, 1.0),
  ('engine',         'in_season',   2.5, 1.0, 1.0, 0.0, 1.5, 0.0),
  ('engine',         'post_season', 0.0, 0.0, 0.0, 1.0, 3.0, 0.0)
) as v(arch, phase, s, sp, ag, c, m, ps)
join public.position_archetypes a on a.slug = v.arch
cross join lateral (values
  ('strength', v.s), ('speed_acceleration', v.sp), ('agility_cod', v.ag),
  ('conditioning', v.c), ('mobility_injury_prevention', v.m), ('position_skill', v.ps)
) as c(category, weight);
-- ---------------------------------------------------------------------------
-- Seed: testable metrics
-- (slug, name, unit, format, direction, category, min, max, sport, sort, description)
-- ---------------------------------------------------------------------------
insert into public.metric_definitions
  (slug, name, unit, display_format, direction, category, min_value, max_value, sport_id, sort_order, description)
select v.slug, v.name, v.unit, v.fmt, v.dir::public.metric_direction, v.cat::public.module_category,
       v.mn, v.mx, s.id, v.ord, v.descr
from (values
  ('forty-yard-dash', '40-Yard Dash', 'sec', 'number', 'lower_is_better', 'speed_acceleration', 3.50, 12.00, 'football', 10, 'Timed 40-yard sprint from a three-point start.'),
  ('ten-yard-split', '10-Yard Split', 'sec', 'number', 'lower_is_better', 'speed_acceleration', 1.20, 4.00, null, 11, 'Time for the first 10 yards of a sprint. Your acceleration score.'),
  ('sixty-yard-dash', '60-Yard Dash', 'sec', 'number', 'lower_is_better', 'speed_acceleration', 5.50, 12.00, 'baseball', 12, 'Timed 60-yard sprint.'),
  ('thirty-meter-sprint', '30-Meter Sprint', 'sec', 'number', 'lower_is_better', 'speed_acceleration', 3.00, 8.00, 'soccer', 13, 'Timed 30-meter sprint from a standing start.'),
  ('pro-agility', 'Pro Agility (5-10-5)', 'sec', 'number', 'lower_is_better', 'agility_cod', 3.50, 8.00, null, 20, '5-10-5 shuttle. Your change-of-direction score.'),
  ('three-cone', '3-Cone L-Drill', 'sec', 'number', 'lower_is_better', 'agility_cod', 5.50, 12.00, 'football', 21, 'Timed L-drill around three cones.'),
  ('lane-agility', 'Lane Agility Drill', 'sec', 'number', 'lower_is_better', 'agility_cod', 8.00, 20.00, 'basketball', 22, 'Timed lane agility drill around the key.'),
  ('vertical-jump', 'Vertical Jump', 'in', 'number', 'higher_is_better', 'strength', 5.00, 60.00, null, 30, 'Standing vertical jump height.'),
  ('broad-jump', 'Broad Jump', 'in', 'number', 'higher_is_better', 'strength', 40.00, 170.00, null, 31, 'Standing broad jump distance.'),
  ('back-squat-max', 'Back Squat Max', 'lb', 'number', 'higher_is_better', 'strength', 45.00, 1000.00, null, 40, 'Heaviest back squat for one rep (or estimated 1RM from a heavy set).'),
  ('bench-press-max', 'Bench Press Max', 'lb', 'number', 'higher_is_better', 'strength', 45.00, 800.00, null, 41, 'Heaviest bench press for one rep (or estimated 1RM).'),
  ('power-clean-max', 'Power Clean Max', 'lb', 'number', 'higher_is_better', 'strength', 45.00, 500.00, null, 42, 'Heaviest power clean for one rep.'),
  ('trap-bar-deadlift-max', 'Trap Bar Deadlift Max', 'lb', 'number', 'higher_is_better', 'strength', 65.00, 900.00, null, 43, 'Heaviest trap bar deadlift for one rep.'),
  ('pull-up-max', 'Max Pull-Ups', 'reps', 'number', 'higher_is_better', 'strength', 1.00, 60.00, null, 44, 'Maximum strict pull-ups in one set.'),
  ('shuttle-300', '300-Yard Shuttle', 'sec', 'number', 'lower_is_better', 'conditioning', 40.00, 140.00, null, 50, 'Six 50-yard lengths, timed.'),
  ('run-1-5-mile', '1.5-Mile Run', 'sec', 'time', 'lower_is_better', 'conditioning', 400.00, 1500.00, null, 51, 'Timed 1.5-mile run. Enter as mm:ss.'),
  ('pitch-velocity', 'Pitch Velocity', 'mph', 'number', 'higher_is_better', 'position_skill', 40.00, 110.00, 'baseball', 60, 'Peak fastball velocity.'),
  ('exit-velocity', 'Exit Velocity', 'mph', 'number', 'higher_is_better', 'position_skill', 40.00, 125.00, 'baseball', 61, 'Peak batted-ball exit velocity.')
) as v(slug, name, unit, fmt, dir, cat, mn, mx, sport, ord, descr)
left join public.sports s on s.slug = v.sport;
-- Pitch velocity is a thrower metric only.
insert into public.metric_archetypes (metric_id, archetype_id)
select m.id, a.id from public.metric_definitions m, public.position_archetypes a
where m.slug = 'pitch-velocity' and a.slug = 'thrower';
