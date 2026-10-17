
-- Adds a "goal" (training focus) tag to plans, alongside the existing
-- sport/position tagging (neither is touched). This is additive: no
-- table is dropped or recreated, and the 4 existing plans keep their
-- ids, so anything referencing them (user_plans, progress_logs) is
-- unaffected. Each existing plan is fixed in place with the goal that
-- actually matches its wired workout content.

create type public.training_goal as enum (
  'speed',
  'strength_power',
  'agility_lateral_quickness',
  'conditioning',
  'injury_prevention_mobility'
);

alter table public.plans add column goal public.training_goal;

-- Pitcher Arm Care & Power -> its only position-specific workout is
-- "Pitcher Shoulder & Hip Stability" (rotational throw + lateral bound +
-- RDL + push-up + plank, zero heavy lifting) -- that's mobility/arm-care
-- content, not power. Retitled to match what it actually contains.
update public.plans set
  goal = 'injury_prevention_mobility',
  name = 'Pitcher Arm Care & Mobility',
  slug = 'pitcher-arm-care-mobility'
where slug = 'pitcher-arm-care-power';

-- Point Guard Explosiveness -> wired workout is agility-ladder / cone
-- shuttle dominant -> lateral quickness.
update public.plans set goal = 'agility_lateral_quickness'
where slug = 'point-guard-explosiveness';

-- QB Off-Season Foundations -> wired workout is rotational-power/arm-care.
update public.plans set goal = 'strength_power'
where slug = 'qb-off-season-foundations';

-- Soccer Midfielder Engine Builder -> wired workout is literally named
-- "Aerobic Engine".
update public.plans set goal = 'conditioning'
where slug = 'soccer-midfielder-engine-builder';

alter table public.plans alter column goal set not null;

create index plans_position_goal_idx on public.plans (position_id, goal);
create index plans_sport_goal_idx on public.plans (sport_id, goal);
;
