-- Personalization inputs, secondary position, per-exercise equipment/level gating and
-- post-session difficulty feedback. Purely additive: new nullable columns / defaults, no
-- existing row is rewritten except the new equipment_tier / min_level backfill on exercises.

create type public.equipment_access as enum ('bodyweight', 'home', 'full_gym');
create type public.session_feedback as enum ('too_easy', 'just_right', 'too_hard');
-- Athlete defaults (prefill the build screen) -------------------------------------------
alter table public.profiles
  add column secondary_position_id uuid references public.positions(id) on delete set null,
  add column equipment_access public.equipment_access,
  add column days_per_week int check (days_per_week between 1 and 7),
  add column session_minutes int check (session_minutes between 20 and 120),
  add constraint profiles_secondary_differs check (secondary_position_id is null or secondary_position_id <> position_id);
-- What a given program was built with (a rebuild must reproduce the same constraints) ---
alter table public.user_programs
  add column secondary_position_id uuid references public.positions(id) on delete set null,
  add column equipment_access public.equipment_access,
  add column days_per_week int check (days_per_week between 1 and 7),
  add column session_minutes int check (session_minutes between 20 and 120),
  add column level public.experience_level,
  add column adjustments jsonb not null default '[]'::jsonb;
-- Exercise gating ---------------------------------------------------------------------
alter table public.exercises
  add column equipment_tier public.equipment_access not null default 'full_gym',
  add column min_level public.experience_level not null default 'beginner';
comment on column public.exercises.equipment_tier is 'Lowest equipment access that can do this exercise (bodyweight < home < full_gym).';
comment on column public.exercises.min_level is 'Lowest training level this exercise is suitable for.';
update public.exercises set equipment_tier = case
  when equipment in ('Bodyweight','Cones','Turf','Wall','Any','None','Court','Track','Field','Bases','Ball','Mat/Turf','Tennis Ball') then 'bodyweight'::public.equipment_access
  when equipment in ('Dumbbells','Dumbbell','Light Dumbbells','Light Dumbbell','Resistance Band','Medicine Ball','Plyo Box','Agility Ladder','Mini Hurdles','Kettlebell','Pull-Up Bar','Jump Rope','Ab Wheel','Sliders','Reaction Ball','Bench','Partner/Anchor','Cable/Band') then 'home'::public.equipment_access
  else 'full_gym'::public.equipment_access end;
update public.exercises set min_level = 'advanced' where slug in
  ('depth-jump','hang-power-clean','single-leg-box-jump','turkish-get-up','nordic-hamstring-curl','single-leg-bound','ab-wheel-rollout','push-press','trap-bar-jump','conventional-deadlift');
update public.exercises set min_level = 'intermediate' where min_level = 'beginner' and slug in
  ('front-squat','good-morning','copenhagen-plank','single-leg-romanian-deadlift','bulgarian-split-squat','cossack-squat','tuck-jump','parallel-bar-dip','pull-up','chin-up','overhead-press','split-squat-jump','hop-and-stick','barbell-row','trap-bar-deadlift','landmine-rotation');
do $$
declare n_bw int; n_home int; n_gym int;
begin
  select count(*) filter (where equipment_tier='bodyweight'), count(*) filter (where equipment_tier='home'), count(*) filter (where equipment_tier='full_gym')
    into n_bw, n_home, n_gym from public.exercises;
  if n_bw < 40 or n_home < 25 or n_gym < 20 then raise exception 'equipment backfill looks wrong: % / % / %', n_bw, n_home, n_gym; end if;
end $$;
-- Post-session difficulty feedback (separate from the pre-workout readiness check-in) --
alter table public.progress_logs
  add column feedback public.session_feedback,
  add column feedback_at timestamptz;
