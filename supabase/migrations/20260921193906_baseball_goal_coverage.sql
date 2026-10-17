
with workout_defs (slug, name, position_slug, level, estimated_minutes) as (
  values
    ('pitcher-sprint-mechanics', 'Pitcher Sprint Mechanics', 'pitcher', 'intermediate', 35),
    ('pitcher-lower-half-drive-power', 'Pitcher Lower-Half Drive & Rotational Power', 'pitcher', 'intermediate', 45),
    ('pitcher-fielding-pickoff-agility', 'Pitcher Fielding & Pickoff Agility', 'pitcher', 'intermediate', 35),
    ('pitcher-bullpen-stamina', 'Pitcher Bullpen Stamina Conditioning', 'pitcher', 'beginner', 35),
    ('outfielder-route-to-ball-speed', 'Outfielder Route-to-Ball Speed', 'outfielder', 'intermediate', 40),
    ('outfielder-throwing-power', 'Outfielder Throwing Power & Lower-Body Strength', 'outfielder', 'intermediate', 50),
    ('outfielder-reactive-agility', 'Outfielder Reactive First-Step Agility', 'outfielder', 'intermediate', 35),
    ('outfielder-conditioning', 'Outfielder Game-Day Conditioning', 'outfielder', 'beginner', 35),
    ('outfielder-shoulder-hamstring-care', 'Outfielder Shoulder & Hamstring Care', 'outfielder', 'beginner', 30),
    ('infielder-first-step-burst', 'Infielder First-Step Burst', 'infielder', 'intermediate', 40),
    ('infielder-throwing-lower-power', 'Infielder Throwing & Lower-Body Power', 'infielder', 'intermediate', 50),
    ('infielder-conditioning', 'Infielder Nine-Inning Conditioning', 'infielder', 'beginner', 35),
    ('infielder-hip-shoulder-care', 'Infielder Hip & Shoulder Care', 'infielder', 'beginner', 30)
),
inserted_workouts as (
  insert into public.workouts (slug, name, sport_id, position_id, level, estimated_minutes)
  select wd.slug, wd.name, pos.sport_id, pos.id, wd.level::public.experience_level, wd.estimated_minutes
  from workout_defs wd join public.positions pos on pos.slug = wd.position_slug
  returning id, slug, name, sport_id, position_id
),
exercise_defs (workout_slug, order_index, exercise_slug, sets, reps, rest_seconds, notes) as (
  values
    ('pitcher-sprint-mechanics', 1, 'forty-yard-sprint', 5, '1 rep', 120, 'Full recovery between reps'),
    ('pitcher-sprint-mechanics', 2, 'broad-jump', 4, '3', 90, null),
    ('pitcher-sprint-mechanics', 3, 'lateral-bound', 3, '5 each side', 60, null),
    ('pitcher-sprint-mechanics', 4, 'back-squat', 3, '5', 120, 'Moderate load, speed off the floor'),
    ('pitcher-sprint-mechanics', 5, 'plank', 3, '30 sec', 45, null),

    ('pitcher-lower-half-drive-power', 1, 'back-squat', 4, '5', 150, null),
    ('pitcher-lower-half-drive-power', 2, 'med-ball-rotational-throw', 4, '6 each side', 75, null),
    ('pitcher-lower-half-drive-power', 3, 'kettlebell-swing', 3, '15', 60, null),
    ('pitcher-lower-half-drive-power', 4, 'single-leg-box-jump', 3, '4 each side', 90, null),
    ('pitcher-lower-half-drive-power', 5, 'farmers-carry', 3, '40 yards', 90, null),

    ('pitcher-fielding-pickoff-agility', 1, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('pitcher-fielding-pickoff-agility', 2, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('pitcher-fielding-pickoff-agility', 3, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('pitcher-fielding-pickoff-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('pitcher-fielding-pickoff-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('pitcher-bullpen-stamina', 1, 'jump-rope', 5, '1 min', 30, null),
    ('pitcher-bullpen-stamina', 2, 'shuttle-run', 5, '1 rep', 60, null),
    ('pitcher-bullpen-stamina', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('pitcher-bullpen-stamina', 4, 'push-up', 3, '15', 45, null),
    ('pitcher-bullpen-stamina', 5, 'plank', 3, '40 sec', 30, null),

    ('outfielder-route-to-ball-speed', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('outfielder-route-to-ball-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('outfielder-route-to-ball-speed', 3, 'box-jump', 4, '4', 90, null),
    ('outfielder-route-to-ball-speed', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('outfielder-route-to-ball-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('outfielder-throwing-power', 1, 'back-squat', 4, '6', 120, null),
    ('outfielder-throwing-power', 2, 'med-ball-rotational-throw', 4, '6 each side', 75, null),
    ('outfielder-throwing-power', 3, 'barbell-row', 3, '8', 90, null),
    ('outfielder-throwing-power', 4, 'kettlebell-swing', 3, '15', 60, null),
    ('outfielder-throwing-power', 5, 'farmers-carry', 3, '40 yards', 90, null),

    ('outfielder-reactive-agility', 1, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('outfielder-reactive-agility', 2, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('outfielder-reactive-agility', 3, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('outfielder-reactive-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('outfielder-reactive-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('outfielder-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('outfielder-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('outfielder-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('outfielder-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('outfielder-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('outfielder-shoulder-hamstring-care', 1, 'band-external-rotation', 3, '15', 45, null),
    ('outfielder-shoulder-hamstring-care', 2, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('outfielder-shoulder-hamstring-care', 3, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('outfielder-shoulder-hamstring-care', 4, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('outfielder-shoulder-hamstring-care', 5, 'plank', 3, '30 sec', 45, null),

    ('infielder-first-step-burst', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('infielder-first-step-burst', 2, 'broad-jump', 4, '3', 90, null),
    ('infielder-first-step-burst', 3, 'box-jump', 4, '4', 90, null),
    ('infielder-first-step-burst', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('infielder-first-step-burst', 5, 'plank', 3, '30 sec', 45, null),

    ('infielder-throwing-lower-power', 1, 'back-squat', 4, '6', 120, null),
    ('infielder-throwing-lower-power', 2, 'med-ball-rotational-throw', 4, '6 each side', 75, null),
    ('infielder-throwing-lower-power', 3, 'barbell-row', 3, '8', 90, null),
    ('infielder-throwing-lower-power', 4, 'kettlebell-swing', 3, '15', 60, null),
    ('infielder-throwing-lower-power', 5, 'single-leg-box-jump', 3, '4 each side', 90, null),

    ('infielder-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('infielder-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('infielder-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('infielder-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('infielder-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('infielder-hip-shoulder-care', 1, 'band-external-rotation', 3, '15', 45, null),
    ('infielder-hip-shoulder-care', 2, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('infielder-hip-shoulder-care', 3, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('infielder-hip-shoulder-care', 4, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('infielder-hip-shoulder-care', 5, 'plank', 3, '30 sec', 45, null)
),
inserted_exercises as (
  insert into public.workout_exercises (workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w.id, e.id, ed.order_index, ed.sets, ed.reps, ed.rest_seconds, ed.notes
  from exercise_defs ed
  join inserted_workouts w on w.slug = ed.workout_slug
  join public.exercises e on e.slug = ed.exercise_slug
  returning 1
),
plan_defs (plan_slug, plan_name, description, workout_slug, level, goal) as (
  values
    ('pitcher-baserunning-speed', 'Pitcher Baserunning Speed', 'Sprint mechanics and acceleration for pitchers.', 'pitcher-sprint-mechanics', 'intermediate', 'speed'),
    ('pitcher-lower-half-drive-power', 'Pitcher Lower-Half Drive & Rotational Power', 'Leg-drive power and rotational strength for pitchers.', 'pitcher-lower-half-drive-power', 'intermediate', 'strength_power'),
    ('pitcher-fielding-pickoff-agility', 'Pitcher Fielding & Pickoff Agility', 'Reactive quickness for fielding and holding runners.', 'pitcher-fielding-pickoff-agility', 'intermediate', 'agility_lateral_quickness'),
    ('pitcher-bullpen-stamina', 'Pitcher Bullpen Stamina Conditioning', 'Between-innings and bullpen conditioning for pitchers.', 'pitcher-bullpen-stamina', 'beginner', 'conditioning'),

    ('outfielder-route-to-ball-speed', 'Outfielder Route-to-Ball Speed', 'Top-end sprint speed for tracking down fly balls.', 'outfielder-route-to-ball-speed', 'intermediate', 'speed'),
    ('outfielder-throwing-power', 'Outfielder Throwing Power & Lower-Body Strength', 'Long, accurate throws and lower-body strength for outfielders.', 'outfielder-throwing-power', 'intermediate', 'strength_power'),
    ('outfielder-reactive-agility', 'Outfielder Reactive First-Step Agility', 'Reactive first-step quickness for reading the ball off the bat.', 'outfielder-reactive-agility', 'intermediate', 'agility_lateral_quickness'),
    ('outfielder-conditioning', 'Outfielder Game-Day Conditioning', 'Full-game conditioning for outfielders.', 'outfielder-conditioning', 'beginner', 'conditioning'),
    ('outfielder-shoulder-hamstring-care', 'Outfielder Shoulder & Hamstring Care', 'Throwing-shoulder and hamstring injury prevention for outfielders.', 'outfielder-shoulder-hamstring-care', 'beginner', 'injury_prevention_mobility'),

    ('infielder-first-step-burst', 'Infielder First-Step Burst', 'Explosive first-step speed to close on ground balls.', 'infielder-first-step-burst', 'intermediate', 'speed'),
    ('infielder-throwing-lower-power', 'Infielder Throwing & Lower-Body Power', 'Across-the-diamond throwing power and lower-body strength.', 'infielder-throwing-lower-power', 'intermediate', 'strength_power'),
    ('infielder-nine-inning-conditioning', 'Infielder Nine-Inning Conditioning', 'Full-game conditioning for infielders.', 'infielder-conditioning', 'beginner', 'conditioning'),
    ('infielder-hip-shoulder-care', 'Infielder Hip & Shoulder Care', 'Throwing-shoulder and hip injury prevention for infielders.', 'infielder-hip-shoulder-care', 'beginner', 'injury_prevention_mobility')
),
admin_user as (
  select id from public.profiles where role = 'admin' limit 1
),
inserted_plans as (
  insert into public.plans (name, slug, description, sport_id, position_id, level, weeks, days_per_week, published, goal, created_by)
  select pd.plan_name, pd.plan_slug, pd.description, w.sport_id, w.position_id, pd.level::public.experience_level, 4, 3, true, pd.goal::public.training_goal, admin_user.id
  from plan_defs pd
  join inserted_workouts w on w.slug = pd.workout_slug
  cross join admin_user
  returning id, slug
),
mapping as (
  select ip.id as plan_id, w.id as workout_id, w.name as workout_name
  from inserted_plans ip
  join plan_defs pd on pd.plan_slug = ip.slug
  join inserted_workouts w on w.slug = pd.workout_slug
),
conditioning as (
  select id from public.workouts where slug = 'full-body-conditioning-circuit'
)
insert into public.plan_workouts (plan_id, workout_id, week_number, day_number, title)
select
  m.plan_id,
  case when d.day_number = 3 then conditioning.id else m.workout_id end,
  wk.week_number,
  d.day_number,
  case when d.day_number = 3 then 'Full-Body Conditioning' else m.workout_name end
from mapping m
cross join conditioning
cross join generate_series(1,4) as wk(week_number)
cross join (values (1),(3),(5)) as d(day_number);
;
