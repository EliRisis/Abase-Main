-- Smart matching v2: finishes the schema for the attribute-weighted assembler
-- (builds on 20260923010000_smart_matching_schema). Additive and backfilled:
-- nothing is dropped except the never-used suggest_exercise_attributes() SQL
-- helper, which is replaced by a TypeScript suggester so it can use the
-- description/equipment and be tested.

-- ---------------------------------------------------------------------------
-- 1. Exercise tagging completion: prescription mode + heavily-loaded areas,
--    and hand-curated attribute weights / movement patterns for all existing
--    exercises (replaces the regex-heuristic first-pass backfill).
-- ---------------------------------------------------------------------------
drop function if exists public.suggest_exercise_attributes(text, text[]);
create type public.prescription_mode as enum
  ('loaded', 'bodyweight', 'ballistic', 'drill', 'hold', 'interval', 'steady', 'mobility');
alter table public.exercises
  add column prescription_mode public.prescription_mode,
  add column loaded_areas public.limitation_body_area[] not null default '{}';
comment on column public.exercises.loaded_areas is 'Body areas this movement loads heavily. Used to go easy when an athlete flags an area (a plain flag, not a diagnosis).';
comment on column public.exercises.prescription_mode is 'How reps are written for this movement (weight x reps, distance drill, timed hold...). Sets/reps themselves flex by the role the exercise fills.';
update public.exercises e set
  attr_speed = v.sp, attr_strength = v.st, attr_power = v.po, attr_agility = v.ag,
  attr_coordination = v.co, attr_conditioning = v.cd, attr_mobility = v.mo,
  movement_pattern = nullif(v.pattern, '')::public.movement_pattern,
  prescription_mode = v.mode::public.prescription_mode,
  loaded_areas = v.areas::public.limitation_body_area[]
from (values
  ('ten-yard-acceleration', 9, 2, 6, 2, 3, 4, 1, 'locomotion', 'drill', array['hamstring_groin']),
  ('twenty-yard-sprint', 9, 2, 5, 2, 3, 4, 1, 'locomotion', 'drill', array['hamstring_groin']),
  ('forty-yard-sprint', 9, 2, 5, 2, 3, 5, 1, 'locomotion', 'drill', array['hamstring_groin']),
  ('sixty-yard-dash', 9, 2, 4, 1, 3, 5, 1, 'locomotion', 'drill', array['hamstring_groin']),
  ('flying-sprint-30', 10, 2, 5, 1, 4, 3, 1, 'locomotion', 'drill', array['hamstring_groin']),
  ('curved-sprint', 8, 2, 4, 5, 4, 4, 1, 'locomotion', 'drill', array['hamstring_groin','ankle_foot']),
  ('three-point-start', 8, 3, 7, 2, 4, 2, 1, 'locomotion', 'drill', array['knee','hamstring_groin']),
  ('first-step-steal-start', 7, 2, 5, 6, 6, 2, 1, 'locomotion', 'drill', array[]::text[]),
  ('resisted-sled-sprint', 8, 5, 7, 1, 3, 4, 1, 'locomotion', 'drill', array['hamstring_groin']),
  ('wicket-run', 7, 1, 3, 2, 7, 2, 2, 'locomotion', 'drill', array['hamstring_groin']),
  ('a-skip', 4, 1, 2, 3, 7, 2, 3, 'locomotion', 'drill', array[]::text[]),
  ('wall-drive-march', 5, 2, 2, 1, 7, 1, 2, 'locomotion', 'bodyweight', array[]::text[]),
  ('three-cone-drill', 5, 1, 3, 9, 6, 3, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('cone-shuttle-5-10-5', 5, 1, 4, 9, 5, 4, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('t-drill', 5, 1, 3, 9, 5, 4, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('w-drill', 4, 1, 3, 8, 6, 3, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('zig-zag-cut-drill', 4, 1, 3, 9, 5, 3, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('box-drill', 5, 1, 2, 8, 5, 4, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('backpedal-break', 4, 1, 3, 8, 6, 3, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('closeout-drill', 5, 1, 3, 8, 5, 4, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('defensive-slide-drill', 3, 2, 2, 8, 5, 5, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('drop-step-drill', 5, 1, 3, 8, 6, 2, 1, 'locomotion', 'drill', array['knee','hip']),
  ('drop-step-route-run', 6, 1, 3, 8, 6, 3, 1, 'locomotion', 'drill', array[]::text[]),
  ('mirror-drill', 2, 1, 1, 9, 8, 3, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('pocket-slide-drill', 2, 1, 1, 7, 7, 2, 2, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('reactive-cone-sprint', 6, 1, 3, 8, 7, 3, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('ground-ball-shuffle', 2, 1, 1, 7, 7, 3, 2, 'locomotion', 'drill', array['knee']),
  ('shuttle-run', 5, 1, 2, 7, 3, 6, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('suicide-sprints', 5, 1, 2, 5, 3, 8, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('carioca', 3, 1, 2, 6, 8, 3, 4, 'locomotion', 'drill', array[]::text[]),
  ('five-step-drop-footwork', 3, 1, 2, 6, 8, 2, 1, 'locomotion', 'drill', array[]::text[]),
  ('three-step-drop-footwork', 3, 1, 2, 6, 8, 2, 1, 'locomotion', 'drill', array[]::text[]),
  ('agility-ladder-icky-shuffle', 3, 0, 1, 6, 9, 2, 1, 'locomotion', 'drill', array['ankle_foot']),
  ('ladder-in-out', 3, 0, 1, 5, 9, 2, 1, 'locomotion', 'drill', array['ankle_foot']),
  ('ladder-lateral-run', 3, 0, 1, 6, 8, 2, 1, 'locomotion', 'drill', array['ankle_foot']),
  ('reaction-ball-drill', 2, 0, 1, 6, 9, 1, 0, 'locomotion', 'bodyweight', array[]::text[]),
  ('tennis-ball-reaction-catch', 1, 0, 0, 3, 9, 0, 1, '', 'bodyweight', array[]::text[]),
  ('diving-save-progression', 3, 2, 5, 6, 9, 2, 4, 'locomotion', 'bodyweight', array['shoulder']),
  ('tempo-run-200', 4, 1, 1, 1, 2, 8, 1, 'locomotion', 'drill', array[]::text[]),
  ('repeat-sprint-30m', 7, 1, 3, 2, 2, 8, 1, 'locomotion', 'drill', array['hamstring_groin']),
  ('three-hundred-yard-shuttle', 4, 1, 1, 4, 2, 9, 1, 'locomotion', 'drill', array['knee','ankle_foot']),
  ('gasser-sprints', 5, 1, 2, 2, 2, 9, 1, 'locomotion', 'drill', array['hamstring_groin']),
  ('assault-bike-intervals', 3, 1, 2, 0, 1, 9, 0, 'locomotion', 'interval', array[]::text[]),
  ('rowing-intervals', 2, 3, 3, 0, 2, 9, 1, 'locomotion', 'interval', array['low_back']),
  ('battle-rope-waves', 1, 2, 3, 1, 4, 8, 1, 'core', 'interval', array['shoulder']),
  ('burpee', 1, 3, 4, 1, 4, 8, 2, 'core', 'interval', array[]::text[]),
  ('mountain-climber', 1, 2, 2, 1, 4, 7, 2, 'core', 'interval', array[]::text[]),
  ('jump-rope', 3, 0, 3, 3, 8, 6, 1, 'plyometric', 'interval', array['ankle_foot']),
  ('fartlek-run', 3, 0, 1, 1, 1, 9, 0, 'locomotion', 'steady', array[]::text[]),
  ('zone-2-run', 0, 0, 0, 0, 1, 8, 0, 'locomotion', 'steady', array[]::text[]),
  ('sled-push', 2, 6, 5, 0, 2, 7, 1, 'carry', 'drill', array['knee']),
  ('sled-drag-backward', 2, 5, 3, 1, 2, 6, 1, 'carry', 'drill', array['knee']),
  ('box-jump', 3, 3, 9, 3, 5, 2, 1, 'plyometric', 'ballistic', array['knee','ankle_foot']),
  ('broad-jump', 3, 3, 9, 2, 5, 2, 1, 'plyometric', 'ballistic', array['knee','ankle_foot']),
  ('depth-jump', 3, 4, 10, 3, 5, 1, 1, 'plyometric', 'ballistic', array['knee','ankle_foot']),
  ('single-leg-box-jump', 2, 3, 9, 3, 7, 1, 1, 'plyometric', 'ballistic', array['knee','ankle_foot']),
  ('single-leg-bound', 4, 3, 9, 3, 6, 2, 1, 'plyometric', 'ballistic', array['ankle_foot','hamstring_groin']),
  ('lateral-bound', 2, 3, 8, 6, 5, 2, 2, 'plyometric', 'ballistic', array['knee','hamstring_groin']),
  ('skater-jump', 2, 3, 6, 6, 6, 3, 2, 'plyometric', 'ballistic', array['knee','ankle_foot']),
  ('tuck-jump', 1, 2, 7, 2, 5, 3, 1, 'plyometric', 'ballistic', array['knee','ankle_foot']),
  ('jump-squat', 2, 3, 8, 2, 4, 3, 1, 'plyometric', 'ballistic', array['knee']),
  ('split-squat-jump', 2, 3, 8, 3, 5, 3, 2, 'plyometric', 'ballistic', array['knee']),
  ('trap-bar-jump', 3, 4, 9, 1, 4, 1, 1, 'plyometric', 'loaded', array['knee','low_back']),
  ('hurdle-hop', 2, 2, 7, 3, 6, 3, 1, 'plyometric', 'ballistic', array['ankle_foot']),
  ('lateral-hurdle-hop', 2, 2, 6, 6, 7, 3, 1, 'plyometric', 'ballistic', array['ankle_foot']),
  ('pogo-hop', 3, 2, 6, 3, 6, 3, 1, 'plyometric', 'ballistic', array['ankle_foot']),
  ('hop-and-stick', 1, 3, 5, 4, 7, 1, 2, 'plyometric', 'ballistic', array['ankle_foot']),
  ('high-ball-jump-catch', 2, 2, 7, 3, 9, 2, 1, 'plyometric', 'ballistic', array['knee','ankle_foot']),
  ('back-squat', 2, 9, 5, 1, 3, 2, 2, 'squat', 'loaded', array['knee','low_back','hip']),
  ('front-squat', 2, 8, 5, 1, 4, 2, 3, 'squat', 'loaded', array['knee']),
  ('goblet-squat', 1, 6, 3, 1, 3, 2, 4, 'squat', 'loaded', array['knee']),
  ('spanish-squat', 0, 5, 1, 0, 2, 1, 1, 'squat', 'hold', array['knee']),
  ('deep-squat-hold', 0, 2, 0, 0, 3, 1, 8, 'squat', 'hold', array[]::text[]),
  ('conventional-deadlift', 1, 9, 6, 0, 3, 2, 1, 'hinge', 'loaded', array['low_back','hip','hamstring_groin']),
  ('trap-bar-deadlift', 2, 9, 6, 0, 3, 2, 1, 'hinge', 'loaded', array['low_back','hip']),
  ('dumbbell-romanian-deadlift', 1, 7, 3, 0, 3, 2, 3, 'hinge', 'loaded', array['low_back','hamstring_groin']),
  ('single-leg-romanian-deadlift', 1, 6, 3, 1, 7, 2, 3, 'hinge', 'loaded', array['hamstring_groin','low_back']),
  ('good-morning', 1, 7, 3, 0, 3, 1, 3, 'hinge', 'loaded', array['low_back','hamstring_groin']),
  ('barbell-hip-thrust', 2, 8, 5, 0, 2, 2, 2, 'hinge', 'loaded', array['hip']),
  ('glute-bridge', 1, 4, 2, 0, 2, 1, 3, 'hinge', 'bodyweight', array[]::text[]),
  ('single-leg-glute-bridge', 1, 5, 2, 1, 5, 1, 2, 'hinge', 'bodyweight', array[]::text[]),
  ('hamstring-slider-curl', 1, 6, 1, 0, 4, 1, 2, 'hinge', 'bodyweight', array['hamstring_groin']),
  ('nordic-hamstring-curl', 1, 8, 2, 0, 3, 1, 1, 'hinge', 'bodyweight', array['hamstring_groin']),
  ('kettlebell-swing', 2, 6, 8, 0, 4, 6, 2, 'hinge', 'loaded', array['low_back']),
  ('hang-power-clean', 2, 6, 10, 1, 6, 2, 2, 'hinge', 'loaded', array['low_back']),
  ('med-ball-scoop-toss', 2, 3, 9, 1, 5, 2, 2, 'hinge', 'ballistic', array['low_back']),
  ('bulgarian-split-squat', 1, 7, 3, 2, 6, 2, 4, 'single_leg', 'loaded', array['knee','hip']),
  ('step-up', 1, 6, 3, 1, 5, 2, 2, 'single_leg', 'loaded', array['knee']),
  ('reverse-lunge', 1, 6, 2, 1, 5, 2, 3, 'single_leg', 'loaded', array['knee']),
  ('lateral-lunge', 1, 5, 2, 3, 5, 2, 6, 'single_leg', 'loaded', array['knee','hamstring_groin']),
  ('cossack-squat', 0, 3, 1, 2, 5, 1, 7, 'single_leg', 'bodyweight', array['knee','hamstring_groin']),
  ('banded-lateral-walk', 1, 3, 1, 2, 4, 2, 3, 'single_leg', 'bodyweight', array[]::text[]),
  ('hip-airplane', 0, 3, 1, 1, 6, 0, 7, 'single_leg', 'bodyweight', array[]::text[]),
  ('single-leg-balance-reach', 0, 2, 0, 1, 8, 0, 4, 'single_leg', 'bodyweight', array[]::text[]),
  ('single-leg-calf-raise', 1, 5, 1, 0, 3, 1, 2, 'single_leg', 'bodyweight', array['ankle_foot']),
  ('barbell-bench-press', 0, 9, 5, 0, 3, 1, 1, 'upper_push', 'loaded', array['shoulder','elbow_wrist']),
  ('dumbbell-bench-press', 0, 8, 4, 0, 4, 1, 1, 'upper_push', 'loaded', array['shoulder']),
  ('incline-dumbbell-press', 0, 7, 4, 0, 3, 1, 1, 'upper_push', 'loaded', array['shoulder']),
  ('overhead-press', 0, 7, 5, 0, 3, 1, 2, 'upper_push', 'loaded', array['shoulder','low_back']),
  ('push-press', 1, 6, 9, 0, 5, 2, 2, 'upper_push', 'loaded', array['shoulder','low_back']),
  ('landmine-press', 0, 6, 6, 0, 4, 1, 2, 'upper_push', 'loaded', array['shoulder']),
  ('push-up', 0, 6, 3, 0, 4, 2, 1, 'upper_push', 'bodyweight', array[]::text[]),
  ('parallel-bar-dip', 0, 7, 3, 0, 3, 1, 1, 'upper_push', 'bodyweight', array['shoulder','elbow_wrist']),
  ('med-ball-chest-pass', 0, 3, 8, 0, 5, 2, 0, 'upper_push', 'ballistic', array[]::text[]),
  ('cuban-press', 0, 3, 1, 0, 4, 0, 6, 'upper_push', 'bodyweight', array[]::text[]),
  ('serratus-wall-slide', 0, 2, 0, 0, 4, 0, 6, 'upper_push', 'bodyweight', array[]::text[]),
  ('barbell-row', 0, 8, 3, 0, 3, 1, 1, 'upper_pull', 'loaded', array['low_back','elbow_wrist']),
  ('one-arm-dumbbell-row', 0, 7, 2, 0, 3, 1, 1, 'upper_pull', 'loaded', array[]::text[]),
  ('seated-cable-row', 0, 6, 2, 0, 2, 1, 1, 'upper_pull', 'loaded', array[]::text[]),
  ('pull-up', 0, 9, 3, 0, 3, 1, 1, 'upper_pull', 'bodyweight', array['shoulder','elbow_wrist']),
  ('chin-up', 0, 8, 3, 0, 3, 1, 1, 'upper_pull', 'bodyweight', array['shoulder','elbow_wrist']),
  ('inverted-row', 0, 6, 2, 0, 3, 1, 1, 'upper_pull', 'bodyweight', array[]::text[]),
  ('face-pull', 0, 4, 1, 0, 4, 1, 5, 'upper_pull', 'loaded', array[]::text[]),
  ('band-pull-apart', 0, 3, 1, 0, 3, 1, 3, 'upper_pull', 'bodyweight', array[]::text[]),
  ('band-external-rotation', 0, 3, 0, 0, 3, 0, 4, 'upper_pull', 'bodyweight', array[]::text[]),
  ('band-internal-rotation', 0, 3, 0, 0, 3, 0, 4, 'upper_pull', 'bodyweight', array[]::text[]),
  ('y-t-w-raise', 0, 3, 0, 0, 4, 0, 6, 'upper_pull', 'bodyweight', array[]::text[]),
  ('forearm-flexor-extensor-curl', 0, 3, 0, 0, 2, 0, 1, 'upper_pull', 'loaded', array[]::text[]),
  ('plank', 0, 3, 0, 0, 5, 1, 1, 'core', 'hold', array[]::text[]),
  ('side-plank', 0, 4, 0, 0, 5, 1, 2, 'core', 'hold', array[]::text[]),
  ('hollow-body-hold', 0, 4, 0, 0, 5, 1, 1, 'core', 'hold', array[]::text[]),
  ('pallof-press', 0, 4, 1, 0, 6, 1, 2, 'core', 'hold', array[]::text[]),
  ('copenhagen-plank', 0, 5, 0, 0, 4, 1, 3, 'core', 'hold', array['hamstring_groin']),
  ('dead-bug', 0, 3, 0, 0, 7, 0, 3, 'core', 'bodyweight', array[]::text[]),
  ('bird-dog', 0, 2, 0, 0, 6, 0, 4, 'core', 'bodyweight', array[]::text[]),
  ('ab-wheel-rollout', 0, 5, 1, 0, 4, 1, 2, 'core', 'bodyweight', array['low_back','shoulder']),
  ('hanging-knee-raise', 0, 4, 1, 0, 4, 1, 2, 'core', 'bodyweight', array[]::text[]),
  ('med-ball-slam', 0, 3, 8, 0, 4, 5, 1, 'core', 'ballistic', array[]::text[]),
  ('cable-woodchop', 0, 3, 6, 0, 6, 1, 3, 'rotational', 'loaded', array[]::text[]),
  ('landmine-rotation', 0, 3, 6, 1, 6, 1, 3, 'rotational', 'loaded', array['low_back']),
  ('med-ball-rotational-throw', 0, 3, 9, 1, 6, 2, 2, 'rotational', 'ballistic', array['low_back']),
  ('farmers-carry', 0, 6, 2, 0, 3, 5, 1, 'carry', 'drill', array[]::text[]),
  ('suitcase-carry', 0, 5, 1, 0, 4, 3, 1, 'carry', 'drill', array[]::text[]),
  ('bottoms-up-kettlebell-carry', 0, 4, 1, 0, 6, 2, 3, 'carry', 'drill', array['shoulder']),
  ('bear-crawl', 0, 4, 1, 1, 6, 5, 3, 'core', 'drill', array['shoulder','elbow_wrist']),
  ('turkish-get-up', 0, 5, 2, 1, 8, 2, 7, 'core', 'loaded', array['shoulder']),
  ('hip-90-90', 0, 1, 0, 0, 3, 0, 9, 'mobility', 'mobility', array[]::text[]),
  ('adductor-rockback', 0, 1, 0, 0, 2, 0, 8, 'mobility', 'mobility', array[]::text[]),
  ('ankle-wall-mobility', 0, 1, 0, 0, 2, 0, 8, 'mobility', 'mobility', array[]::text[]),
  ('band-shoulder-warmup', 0, 1, 0, 0, 4, 0, 7, 'mobility', 'mobility', array[]::text[]),
  ('couch-stretch', 0, 0, 0, 0, 1, 0, 9, 'mobility', 'hold', array[]::text[]),
  ('shoulder-cars', 0, 1, 0, 0, 4, 0, 9, 'mobility', 'mobility', array[]::text[]),
  ('sleeper-stretch', 0, 0, 0, 0, 1, 0, 9, 'mobility', 'hold', array[]::text[]),
  ('thoracic-open-book', 0, 0, 0, 0, 3, 0, 9, 'mobility', 'mobility', array[]::text[]),
  ('worlds-greatest-stretch', 0, 1, 0, 0, 4, 1, 9, 'mobility', 'mobility', array[]::text[]),
  ('tibialis-raise', 0, 3, 0, 0, 2, 0, 4, 'mobility', 'bodyweight', array[]::text[])
) as v(slug, sp, st, po, ag, co, cd, mo, pattern, mode, areas)
where e.slug = v.slug;
do $$
declare missing text;
begin
  select string_agg(slug, ', ') into missing from public.exercises where prescription_mode is null;
  if missing is not null then
    raise exception 'Exercises without curated tags: %', missing;
  end if;
end $$;
alter table public.exercises
  alter column prescription_mode set default 'bodyweight',
  alter column prescription_mode set not null;
-- Mobility movements get the new dedicated pattern value (added in the previous migration).
-- (Curated rows above already carry it where it applies.)

-- ---------------------------------------------------------------------------
-- 2. Workout attribute profile = computed, never hand-tagged: set-weighted
--    average of the exercise weights inside the workout.
-- ---------------------------------------------------------------------------
create view public.workout_attribute_profiles with (security_invoker = true) as
select
  we.workout_id,
  round(sum(e.attr_speed * we.sets)::numeric        / nullif(sum(we.sets), 0), 2) as speed,
  round(sum(e.attr_strength * we.sets)::numeric     / nullif(sum(we.sets), 0), 2) as strength,
  round(sum(e.attr_power * we.sets)::numeric        / nullif(sum(we.sets), 0), 2) as power,
  round(sum(e.attr_agility * we.sets)::numeric      / nullif(sum(we.sets), 0), 2) as agility,
  round(sum(e.attr_coordination * we.sets)::numeric / nullif(sum(we.sets), 0), 2) as coordination,
  round(sum(e.attr_conditioning * we.sets)::numeric / nullif(sum(we.sets), 0), 2) as conditioning,
  round(sum(e.attr_mobility * we.sets)::numeric     / nullif(sum(we.sets), 0), 2) as mobility,
  count(*)::int as exercise_count,
  sum(we.sets)::int as total_sets
from public.workout_exercises we
join public.exercises e on e.id = we.exercise_id
group by we.workout_id;
-- ---------------------------------------------------------------------------
-- 3. Position needs: curated per-position base profiles + the one-line
--    "why this matters for your position" notes.
-- ---------------------------------------------------------------------------
update public.position_needs_profiles n set
  attr_speed = v.sp, attr_strength = v.st, attr_power = v.po, attr_agility = v.ag,
  attr_coordination = v.co, attr_conditioning = v.cd, attr_mobility = v.mo, updated_at = now()
from (values
  ('football', 'wide-receiver', 9, 5, 7, 8, 7, 6, 5),
  ('football', 'offensive-lineman', 3, 10, 8, 3, 4, 5, 4),
  ('football', 'linebacker', 7, 8, 7, 7, 5, 7, 4),
  ('football', 'quarterback', 5, 5, 7, 5, 8, 5, 7),
  ('baseball', 'infielder', 8, 5, 7, 9, 8, 5, 6),
  ('baseball', 'outfielder', 9, 5, 7, 7, 7, 6, 5),
  ('baseball', 'pitcher', 5, 6, 8, 4, 8, 5, 8),
  ('basketball', 'center', 4, 9, 8, 4, 5, 6, 5),
  ('basketball', 'point-guard', 8, 4, 6, 9, 8, 8, 5),
  ('basketball', 'shooting-guard', 8, 5, 7, 8, 7, 7, 5),
  ('soccer', 'defender', 7, 7, 6, 7, 5, 8, 5),
  ('soccer', 'forward', 9, 5, 7, 8, 8, 7, 5),
  ('soccer', 'goalkeeper', 5, 6, 8, 8, 9, 4, 8),
  ('soccer', 'midfielder', 6, 5, 5, 7, 7, 10, 5)
) as v(sport, pos, sp, st, po, ag, co, cd, mo)
join public.sports s on s.slug = v.sport
join public.positions p on p.sport_id = s.id and p.slug = v.pos
where n.position_id = p.id;
create table public.position_attribute_notes (
  position_id uuid not null references public.positions(id) on delete cascade,
  attribute public.training_attribute not null,
  note text not null check (char_length(note) between 5 and 200),
  primary key (position_id, attribute)
);
insert into public.position_attribute_notes (position_id, attribute, note)
select p.id, v.attr::public.training_attribute, v.note
from (values
  ('football', 'wide-receiver', 'speed', 'Separation at the top of the route starts with top-end speed and a fast release.'),
  ('football', 'wide-receiver', 'strength', 'Enough strength to win at the catch point and fight through contact.'),
  ('football', 'wide-receiver', 'power', 'Explosive hips give you the burst off the line and the leap on contested balls.'),
  ('football', 'wide-receiver', 'agility', 'Sharp cuts at full speed are what shake a defender in and out of breaks.'),
  ('football', 'wide-receiver', 'coordination', 'Tracking the ball while your feet and hands work together is the whole catch.'),
  ('football', 'wide-receiver', 'conditioning', 'Repeating full-speed routes drive after drive without slowing down.'),
  ('football', 'wide-receiver', 'mobility', 'Loose hips and ankles keep your cuts clean and your hamstrings healthy.'),
  ('football', 'offensive-lineman', 'speed', 'A quick first step gets you into your block before the defender gets into you.'),
  ('football', 'offensive-lineman', 'strength', 'Raw strength is what moves people off the ball and holds the pocket.'),
  ('football', 'offensive-lineman', 'power', 'Hip power delivers the punch at the snap and drives defenders backward.'),
  ('football', 'offensive-lineman', 'agility', 'Short-area quickness keeps you square when rushers move laterally.'),
  ('football', 'offensive-lineman', 'coordination', 'Hands, feet, and hips have to fire together to keep your base under you.'),
  ('football', 'offensive-lineman', 'conditioning', 'You have to stay powerful on the 12th play of a long drive, not just the first.'),
  ('football', 'offensive-lineman', 'mobility', 'Hip and ankle mobility let you stay low and balanced in your stance.'),
  ('football', 'linebacker', 'speed', 'Closing speed is what turns a read into a tackle before the ball carrier gets going.'),
  ('football', 'linebacker', 'strength', 'Strength lets you take on blockers and finish tackles with authority.'),
  ('football', 'linebacker', 'power', 'Explosive hips drive through contact and get you to the ball first.'),
  ('football', 'linebacker', 'agility', 'Changing direction fast keeps you on the ball carrier''s hip in traffic.'),
  ('football', 'linebacker', 'coordination', 'Reading, shedding and tackling all depend on clean footwork under pressure.'),
  ('football', 'linebacker', 'conditioning', 'Every play is a sprint and a collision, and you play a lot of plays.'),
  ('football', 'linebacker', 'mobility', 'Loose hips and shoulders keep you tackling low and recovering fast.'),
  ('football', 'quarterback', 'speed', 'Enough speed to escape pressure and make defenses respect your legs.'),
  ('football', 'quarterback', 'strength', 'A strong base and core is where throwing velocity comes from.'),
  ('football', 'quarterback', 'power', 'Rotational power through the hips and trunk is what drives the ball downfield.'),
  ('football', 'quarterback', 'agility', 'Moving in the pocket without losing your base keeps throws accurate.'),
  ('football', 'quarterback', 'coordination', 'Footwork and timing on every drop are what make accuracy repeatable.'),
  ('football', 'quarterback', 'conditioning', 'Your arm and legs have to stay sharp late in the game, not just early.'),
  ('football', 'quarterback', 'mobility', 'Shoulder and thoracic mobility protect your arm and free up your throwing motion.'),
  ('baseball', 'infielder', 'speed', 'First-step quickness and a fast release turn hard-hit balls into outs.'),
  ('baseball', 'infielder', 'strength', 'A sturdy lower half keeps you low on grounders and strong through the swing.'),
  ('baseball', 'infielder', 'power', 'Rotational power gives you bat speed and a quick, strong throw.'),
  ('baseball', 'infielder', 'agility', 'Lateral range and quick redirects are what get you to more balls.'),
  ('baseball', 'infielder', 'coordination', 'Hands and feet working as one make the routine play automatic.'),
  ('baseball', 'infielder', 'conditioning', 'You stay explosive and focused across a long game and a long season.'),
  ('baseball', 'infielder', 'mobility', 'Hip and shoulder mobility protect your arm and keep your fielding position low.'),
  ('baseball', 'outfielder', 'speed', 'Top-end speed is what runs balls down in the gap and turns singles into extra bases.'),
  ('baseball', 'outfielder', 'strength', 'A strong base supports bat speed and a hard, accurate throw.'),
  ('baseball', 'outfielder', 'power', 'Explosive rotation drives the ball out of the park and to the cutoff man.'),
  ('baseball', 'outfielder', 'agility', 'Efficient routes and quick turns on the ball save steps and runs.'),
  ('baseball', 'outfielder', 'coordination', 'Tracking a fly ball while your feet find the spot is pure timing.'),
  ('baseball', 'outfielder', 'conditioning', 'You have to be as fast in the ninth inning as the first.'),
  ('baseball', 'outfielder', 'mobility', 'Hip and shoulder mobility keep the arm and hamstrings healthy over a long season.'),
  ('baseball', 'pitcher', 'speed', 'Arm speed and a quick delivery come from how fast the whole chain moves.'),
  ('baseball', 'pitcher', 'strength', 'Leg and trunk strength are the engine behind velocity and repeatable mechanics.'),
  ('baseball', 'pitcher', 'power', 'Rotational power from the ground up is where fastball velocity comes from.'),
  ('baseball', 'pitcher', 'agility', 'Fielding your position and covering bases need quick, controlled feet.'),
  ('baseball', 'pitcher', 'coordination', 'Repeating your delivery pitch after pitch is coordination, not just strength.'),
  ('baseball', 'pitcher', 'conditioning', 'Staying strong deep into a start keeps your command and velocity late.'),
  ('baseball', 'pitcher', 'mobility', 'Hip, thoracic and shoulder mobility let you throw hard with less stress on the arm.'),
  ('basketball', 'center', 'speed', 'Getting down the floor first earns easy baskets and good post position.'),
  ('basketball', 'center', 'strength', 'Strength lets you hold your ground, seal defenders and finish through contact.'),
  ('basketball', 'center', 'power', 'Explosive jumping is what gets you rebounds and blocks above the rim.'),
  ('basketball', 'center', 'agility', 'Quick footwork keeps you in front of guards on switches.'),
  ('basketball', 'center', 'coordination', 'Timing your jump and hands is what turns height into rebounds.'),
  ('basketball', 'center', 'conditioning', 'You need to keep battling inside in the fourth quarter.'),
  ('basketball', 'center', 'mobility', 'Ankle and hip mobility protect your knees on constant jumping and landing.'),
  ('basketball', 'point-guard', 'speed', 'Speed in transition is what creates advantages before the defense sets.'),
  ('basketball', 'point-guard', 'strength', 'Enough strength to finish through contact and hold position on defense.'),
  ('basketball', 'point-guard', 'power', 'A quick first step and a solid jump help you get by your man and score.'),
  ('basketball', 'point-guard', 'agility', 'Change of direction is your dribble game and your on-ball defense.'),
  ('basketball', 'point-guard', 'coordination', 'Ball handling at speed depends on hands, eyes and feet working together.'),
  ('basketball', 'point-guard', 'conditioning', 'You run the offense for the whole game, so your engine has to hold.'),
  ('basketball', 'point-guard', 'mobility', 'Ankle and hip mobility keep you quick and protect against the usual guard injuries.'),
  ('basketball', 'shooting-guard', 'speed', 'Speed off screens and in transition gets you open looks and easy points.'),
  ('basketball', 'shooting-guard', 'strength', 'Strength helps you finish through contact and fight around screens.'),
  ('basketball', 'shooting-guard', 'power', 'A high, quick jump is what gets your shot off over the defender.'),
  ('basketball', 'shooting-guard', 'agility', 'Cutting off the ball and staying with your man rely on sharp direction changes.'),
  ('basketball', 'shooting-guard', 'coordination', 'Repeatable shooting form comes from a well-coordinated base and follow-through.'),
  ('basketball', 'shooting-guard', 'conditioning', 'Chasing shooters around screens all night takes a big engine.'),
  ('basketball', 'shooting-guard', 'mobility', 'Loose hips and ankles keep your jumps and landings healthy.'),
  ('soccer', 'defender', 'speed', 'Recovery speed lets you close down forwards who beat you a step.'),
  ('soccer', 'defender', 'strength', 'Strength wins duels, shields the ball and holds your line in the box.'),
  ('soccer', 'defender', 'power', 'Explosive jumps win aerial balls on corners and long clearances.'),
  ('soccer', 'defender', 'agility', 'Turning and adjusting to attackers is the core of one-on-one defending.'),
  ('soccer', 'defender', 'coordination', 'Clean first touches under pressure start your team''s build-up.'),
  ('soccer', 'defender', 'conditioning', 'You cover a lot of ground and have to stay sharp for 90 minutes.'),
  ('soccer', 'defender', 'mobility', 'Hip and groin mobility keep you resilient through the constant turning.'),
  ('soccer', 'forward', 'speed', 'Speed in behind is what defenders fear most and what creates one-on-ones.'),
  ('soccer', 'forward', 'strength', 'Strength helps you hold the ball up and shield it from centre-backs.'),
  ('soccer', 'forward', 'power', 'Explosive acceleration and shooting power decide chances in tight spaces.'),
  ('soccer', 'forward', 'agility', 'Quick feints and cuts create the half-yard you need to shoot.'),
  ('soccer', 'forward', 'coordination', 'Touch and timing in the box turn half-chances into goals.'),
  ('soccer', 'forward', 'conditioning', 'You need repeated sprints late in the game when defenses tire.'),
  ('soccer', 'forward', 'mobility', 'Hip and hamstring mobility protect you from the classic sprinting injuries.'),
  ('soccer', 'goalkeeper', 'speed', 'Fast reactions and a quick first step get you to shots and through balls.'),
  ('soccer', 'goalkeeper', 'strength', 'Core and shoulder strength help you land dives and win crosses.'),
  ('soccer', 'goalkeeper', 'power', 'Explosive legs are what extend your reach on a dive or a high ball.'),
  ('soccer', 'goalkeeper', 'agility', 'Quick footwork sets you in position before the shot is taken.'),
  ('soccer', 'goalkeeper', 'coordination', 'Hands, eyes and feet reacting together decide close-range saves.'),
  ('soccer', 'goalkeeper', 'conditioning', 'Repeated dives and quick recoveries matter more than long-distance running.'),
  ('soccer', 'goalkeeper', 'mobility', 'Hip and shoulder mobility let you stretch for saves without straining.'),
  ('soccer', 'midfielder', 'speed', 'Getting box-to-box fast lets you support both the attack and defense.'),
  ('soccer', 'midfielder', 'strength', 'Strength lets you win midfield duels and protect the ball under pressure.'),
  ('soccer', 'midfielder', 'power', 'Bursts of power let you break lines and win second balls.'),
  ('soccer', 'midfielder', 'agility', 'Quick turns and dribbles in tight space keep possession alive.'),
  ('soccer', 'midfielder', 'coordination', 'Touch and passing at pace decide who controls the middle of the field.'),
  ('soccer', 'midfielder', 'conditioning', 'You cover the most ground on the pitch, so your engine is your edge.'),
  ('soccer', 'midfielder', 'mobility', 'Hip and ankle mobility keep you moving well through the whole match and season.')
) as v(sport, pos, attr, note)
join public.sports s on s.slug = v.sport
join public.positions p on p.sport_id = s.id and p.slug = v.pos;
do $$
declare n int;
begin
  select count(*) into n from public.positions p
  where (select count(*) from public.position_attribute_notes x where x.position_id = p.id) < 7;
  if n > 0 then raise exception '% positions are missing why-notes', n; end if;
end $$;
alter table public.plans add column why_note text check (why_note is null or char_length(why_note) <= 200);
alter table public.workouts add column why_note text check (why_note is null or char_length(why_note) <= 200);
comment on column public.plans.why_note is 'Optional admin-written override for the one-line "why this matters" note; otherwise derived from the position note for the workout''s dominant attribute.';
-- ---------------------------------------------------------------------------
-- 4. Personal-coach settings
-- ---------------------------------------------------------------------------
create type public.limitation_side as enum ('left', 'right', 'both');
alter table public.user_training_limitations
  add column side public.limitation_side not null default 'both';
create unique index user_training_limitations_unique_flag
  on public.user_training_limitations (user_id, body_area, side);
create or replace function public.validate_training_limitation()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.user_training_limitations where user_id = new.user_id and active) >= 6 then
    raise exception 'You can flag at most 6 areas at once.';
  end if;
  if new.note is not null then new.note := nullif(btrim(new.note), ''); end if;
  return new;
end $$;
create trigger user_training_limitations_validate before insert or update on public.user_training_limitations
  for each row execute function public.validate_training_limitation();
create or replace function public.validate_calendar_event()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.event_date < current_date - 30 or new.event_date > current_date + 400 then
    raise exception 'Choose a date within the next year.';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.user_calendar_events where user_id = new.user_id and event_date >= current_date) >= 120 then
    raise exception 'Too many upcoming events. Remove some first.';
  end if;
  if new.note is not null then new.note := nullif(btrim(new.note), ''); end if;
  return new;
end $$;
create trigger user_calendar_events_validate before insert or update on public.user_calendar_events
  for each row execute function public.validate_calendar_event();
create index user_calendar_events_user_date_idx on public.user_calendar_events (user_id, event_date);
create or replace function public.validate_profile_target_date()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.target_date is not null and (tg_op = 'INSERT' or new.target_date is distinct from old.target_date) then
    if new.target_date < current_date or new.target_date > current_date + 730 then
      raise exception 'Target date must be within the next two years.';
    end if;
  end if;
  if new.target_event is not null then new.target_event := nullif(btrim(new.target_event), ''); end if;
  if new.target_date is null then new.target_event := null; end if;
  return new;
end $$;
create trigger profiles_validate_target_date before insert or update on public.profiles
  for each row execute function public.validate_profile_target_date();
-- Deload cadence per phase (admin-editable) and program length/carry-over.
alter table public.training_phase_config
  add column deload_every_weeks int not null default 4 check (deload_every_weeks between 3 and 8);
update public.training_phase_config set deload_every_weeks = case phase
  when 'off_season' then 4 when 'pre_season' then 4 when 'in_season' then 5 else 6 end;
alter table public.user_programs
  add column weeks int not null default 4 check (weeks between 1 and 12),
  add column deload_carry int not null default 0 check (deload_carry between 0 and 12),
  add column target_date date,
  add column target_event text check (target_event is null or char_length(target_event) <= 100);
-- Metrics know which attribute they measure (drives plateau -> emphasis).
alter table public.metric_definitions add column attribute public.training_attribute;
update public.metric_definitions m set attribute = v.attr::public.training_attribute
from (values
  ('forty-yard-dash','speed'), ('ten-yard-split','speed'), ('sixty-yard-dash','speed'), ('thirty-meter-sprint','speed'),
  ('pro-agility','agility'), ('three-cone','agility'), ('lane-agility','agility'),
  ('vertical-jump','power'), ('broad-jump','power'), ('power-clean-max','power'),
  ('back-squat-max','strength'), ('bench-press-max','strength'), ('trap-bar-deadlift-max','strength'), ('pull-up-max','strength'),
  ('shuttle-300','conditioning'), ('run-1-5-mile','conditioning'),
  ('pitch-velocity','power'), ('exit-velocity','power')
) as v(slug, attr) where m.slug = v.slug;
-- ---------------------------------------------------------------------------
-- 5. Assembled sessions are built from EXERCISES (not pre-authored workouts):
--    per-day exercise prescriptions, and logging that can point at them.
-- ---------------------------------------------------------------------------
alter table public.user_program_days
  add column template text,
  add column focus public.training_attribute,
  add column attribute_profile jsonb,
  add column patterns public.movement_pattern[] not null default '{}',
  add column why_note text,
  add column note text,
  add column est_minutes int check (est_minutes is null or est_minutes between 5 and 240);
create table public.user_program_day_exercises (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.user_program_days(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  order_index int not null check (order_index >= 0),
  block text not null check (block in ('warmup', 'main', 'secondary', 'accessory', 'finisher')),
  role public.training_attribute not null,
  sets int not null check (sets between 1 and 20),
  reps text not null check (char_length(reps) between 1 and 40),
  rest_seconds int check (rest_seconds is null or rest_seconds between 0 and 1800),
  target_weight numeric(6, 1) check (target_weight is null or target_weight >= 0),
  weight_unit public.weight_unit not null default 'lb',
  rx_note text check (rx_note is null or char_length(rx_note) <= 200),
  created_at timestamptz not null default now(),
  unique (program_day_id, order_index)
);
create index user_program_day_exercises_day_idx on public.user_program_day_exercises (program_day_id);
create index user_program_day_exercises_user_idx on public.user_program_day_exercises (user_id);
alter table public.exercise_logs
  add column program_day_exercise_id uuid references public.user_program_day_exercises(id) on delete set null;
create unique index exercise_logs_program_day_exercise_set_uidx
  on public.exercise_logs (progress_log_id, program_day_exercise_id, set_number)
  where program_day_exercise_id is not null;
create index exercise_logs_exercise_user_idx on public.exercise_logs (user_id, exercise_id, created_at desc);
-- Every completed session - assembled, legacy-module or a standalone extra -
-- records what it loaded so the readiness check sees all of it.
alter table public.progress_logs
  add column patterns public.movement_pattern[] not null default '{}',
  add column attribute_profile jsonb,
  add column supplemental boolean not null default false;
comment on column public.progress_logs.supplemental is 'True when the athlete did this module on their own, outside the assembled program.';
-- Backfill existing history so it feeds the new fatigue logic like new sessions do.
update public.progress_logs pl set
  patterns = coalesce((
    select array_agg(distinct e.movement_pattern)
    from public.workout_exercises we join public.exercises e on e.id = we.exercise_id
    where we.workout_id = pl.workout_id and e.movement_pattern is not null
  ), '{}'),
  attribute_profile = (
    select to_jsonb(p) - 'workout_id' - 'exercise_count' - 'total_sets'
    from public.workout_attribute_profiles p where p.workout_id = pl.workout_id
  )
where pl.workout_id is not null;
-- ---------------------------------------------------------------------------
-- 6. RLS for everything new (athlete-owned rows are own-only; content is
--    readable by all and admin-write-only).
-- ---------------------------------------------------------------------------
alter table public.position_attribute_notes enable row level security;
create policy "position_attribute_notes_select_all" on public.position_attribute_notes for select using (true);
create policy "position_attribute_notes_admin_insert" on public.position_attribute_notes for insert with check (public.is_admin());
create policy "position_attribute_notes_admin_update" on public.position_attribute_notes for update using (public.is_admin()) with check (public.is_admin());
create policy "position_attribute_notes_admin_delete" on public.position_attribute_notes for delete using (public.is_admin());
alter table public.user_program_day_exercises enable row level security;
create policy "user_program_day_exercises_select_own" on public.user_program_day_exercises
  for select using (auth.uid() = user_id);
create policy "user_program_day_exercises_insert_own" on public.user_program_day_exercises
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.user_program_days d where d.id = program_day_id and d.user_id = auth.uid())
  );
create policy "user_program_day_exercises_update_own" on public.user_program_day_exercises
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.user_program_days d where d.id = program_day_id and d.user_id = auth.uid())
  );
create policy "user_program_day_exercises_delete_own" on public.user_program_day_exercises
  for delete using (auth.uid() = user_id);
