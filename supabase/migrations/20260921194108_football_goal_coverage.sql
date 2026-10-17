
with workout_defs (slug, name, position_slug, level, estimated_minutes) as (
  values
    ('qb-escape-scramble-speed', 'QB Escape & Scramble Speed', 'quarterback', 'intermediate', 35),
    ('qb-pocket-footwork-agility', 'QB Pocket Footwork & Agility', 'quarterback', 'intermediate', 35),
    ('qb-game-speed-conditioning', 'QB Game-Speed Conditioning', 'quarterback', 'beginner', 35),
    ('qb-shoulder-hip-care', 'QB Shoulder & Hip Care', 'quarterback', 'beginner', 30),
    ('wr-release-power-strength', 'WR Release Power & Functional Strength', 'wide-receiver', 'intermediate', 45),
    ('wr-route-break-agility', 'WR Route-Break Agility', 'wide-receiver', 'intermediate', 35),
    ('wr-route-tree-conditioning', 'WR Route-Tree Conditioning', 'wide-receiver', 'beginner', 35),
    ('wr-hamstring-ankle-care', 'WR Hamstring & Ankle Care', 'wide-receiver', 'beginner', 30),
    ('ol-first-step-acceleration', 'OL First-Step Acceleration', 'offensive-lineman', 'intermediate', 40),
    ('ol-pass-set-redirect-agility', 'OL Pass-Set & Redirect Agility', 'offensive-lineman', 'intermediate', 35),
    ('ol-drive-phase-conditioning', 'OL Drive-Phase Conditioning', 'offensive-lineman', 'beginner', 40),
    ('ol-hip-knee-shoulder-care', 'OL Hip, Knee & Shoulder Care', 'offensive-lineman', 'beginner', 30),
    ('lb-sideline-sideline-speed', 'LB Sideline-to-Sideline Speed', 'linebacker', 'intermediate', 35),
    ('lb-closing-strength-power', 'LB Closing Strength & Tackling Power', 'linebacker', 'intermediate', 45),
    ('lb-read-react-agility', 'LB Read-and-React Agility', 'linebacker', 'intermediate', 35),
    ('lb-full-field-conditioning', 'LB Full-Field Conditioning', 'linebacker', 'beginner', 40),
    ('lb-hip-shoulder-care', 'LB Hip & Shoulder Care', 'linebacker', 'beginner', 30)
),
inserted_workouts as (
  insert into public.workouts (slug, name, sport_id, position_id, level, estimated_minutes)
  select wd.slug, wd.name, pos.sport_id, pos.id, wd.level::public.experience_level, wd.estimated_minutes
  from workout_defs wd join public.positions pos on pos.slug = wd.position_slug
  returning id, slug, name, sport_id, position_id
),
exercise_defs (workout_slug, order_index, exercise_slug, sets, reps, rest_seconds, notes) as (
  values
    ('qb-escape-scramble-speed', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('qb-escape-scramble-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('qb-escape-scramble-speed', 3, 'lateral-bound', 3, '5 each side', 60, null),
    ('qb-escape-scramble-speed', 4, 'box-jump', 4, '4', 90, null),
    ('qb-escape-scramble-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('qb-pocket-footwork-agility', 1, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('qb-pocket-footwork-agility', 2, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('qb-pocket-footwork-agility', 3, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('qb-pocket-footwork-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('qb-pocket-footwork-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('qb-game-speed-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('qb-game-speed-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('qb-game-speed-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('qb-game-speed-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('qb-game-speed-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('qb-shoulder-hip-care', 1, 'band-external-rotation', 3, '15', 45, null),
    ('qb-shoulder-hip-care', 2, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('qb-shoulder-hip-care', 3, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('qb-shoulder-hip-care', 4, 'plank', 3, '30 sec', 45, null),
    ('qb-shoulder-hip-care', 5, 'copenhagen-plank', 3, '20 sec each side', 45, null),

    ('wr-release-power-strength', 1, 'back-squat', 4, '6', 120, null),
    ('wr-release-power-strength', 2, 'med-ball-rotational-throw', 4, '6 each side', 75, null),
    ('wr-release-power-strength', 3, 'barbell-row', 3, '8', 90, null),
    ('wr-release-power-strength', 4, 'single-leg-box-jump', 3, '4 each side', 90, null),
    ('wr-release-power-strength', 5, 'plank', 3, '30 sec', 45, null),

    ('wr-route-break-agility', 1, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('wr-route-break-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('wr-route-break-agility', 3, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('wr-route-break-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('wr-route-break-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('wr-route-tree-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('wr-route-tree-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('wr-route-tree-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('wr-route-tree-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('wr-route-tree-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('wr-hamstring-ankle-care', 1, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('wr-hamstring-ankle-care', 2, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('wr-hamstring-ankle-care', 3, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('wr-hamstring-ankle-care', 4, 'plank', 3, '30 sec', 45, null),
    ('wr-hamstring-ankle-care', 5, 'band-external-rotation', 3, '15', 45, null),

    ('ol-first-step-acceleration', 1, 'sled-push', 6, '10 yards', 90, null),
    ('ol-first-step-acceleration', 2, 'forty-yard-sprint', 5, '1 rep', 120, 'Focus on the first 10 yards'),
    ('ol-first-step-acceleration', 3, 'kettlebell-swing', 4, '10', 60, null),
    ('ol-first-step-acceleration', 4, 'broad-jump', 4, '3', 90, null),
    ('ol-first-step-acceleration', 5, 'plank', 3, '30 sec', 45, null),

    ('ol-pass-set-redirect-agility', 1, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('ol-pass-set-redirect-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('ol-pass-set-redirect-agility', 3, 'lateral-bound', 3, '5 each side', 60, null),
    ('ol-pass-set-redirect-agility', 4, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('ol-pass-set-redirect-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('ol-drive-phase-conditioning', 1, 'sled-push', 6, '15 yards', 90, null),
    ('ol-drive-phase-conditioning', 2, 'shuttle-run', 5, '1 rep', 60, null),
    ('ol-drive-phase-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('ol-drive-phase-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('ol-drive-phase-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('ol-hip-knee-shoulder-care', 1, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('ol-hip-knee-shoulder-care', 2, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('ol-hip-knee-shoulder-care', 3, 'band-external-rotation', 3, '15', 45, null),
    ('ol-hip-knee-shoulder-care', 4, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('ol-hip-knee-shoulder-care', 5, 'plank', 3, '30 sec', 45, null),

    ('lb-sideline-sideline-speed', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('lb-sideline-sideline-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('lb-sideline-sideline-speed', 3, 'sled-push', 5, '15 yards', 90, null),
    ('lb-sideline-sideline-speed', 4, 'box-jump', 4, '4', 90, null),
    ('lb-sideline-sideline-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('lb-closing-strength-power', 1, 'back-squat', 4, '6', 120, null),
    ('lb-closing-strength-power', 2, 'med-ball-rotational-throw', 4, '6 each side', 75, null),
    ('lb-closing-strength-power', 3, 'sled-push', 5, '15 yards', 90, null),
    ('lb-closing-strength-power', 4, 'kettlebell-swing', 3, '15', 60, null),
    ('lb-closing-strength-power', 5, 'farmers-carry', 3, '40 yards', 90, null),

    ('lb-read-react-agility', 1, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('lb-read-react-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('lb-read-react-agility', 3, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('lb-read-react-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('lb-read-react-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('lb-full-field-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('lb-full-field-conditioning', 2, 'sled-push', 5, '15 yards', 75, null),
    ('lb-full-field-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('lb-full-field-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('lb-full-field-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('lb-hip-shoulder-care', 1, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('lb-hip-shoulder-care', 2, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('lb-hip-shoulder-care', 3, 'band-external-rotation', 3, '15', 45, null),
    ('lb-hip-shoulder-care', 4, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('lb-hip-shoulder-care', 5, 'plank', 3, '30 sec', 45, null)
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
    ('qb-escape-scramble-speed', 'QB Escape & Scramble Speed', 'Acceleration and top-end speed for extending plays and scrambling.', 'qb-escape-scramble-speed', 'intermediate', 'speed'),
    ('qb-pocket-footwork-agility', 'QB Pocket Footwork & Agility', 'Drop-step precision, pocket movement, and reactive footwork under pressure.', 'qb-pocket-footwork-agility', 'intermediate', 'agility_lateral_quickness'),
    ('qb-game-speed-conditioning', 'QB Game-Speed Conditioning', 'Play-length conditioning that mirrors dropback and rollout demands.', 'qb-game-speed-conditioning', 'beginner', 'conditioning'),
    ('qb-shoulder-hip-care', 'QB Shoulder & Hip Care', 'Throwing-shoulder and hip mobility work to stay durable through a season.', 'qb-shoulder-hip-care', 'beginner', 'injury_prevention_mobility'),

    ('wr-release-power-strength', 'WR Release Power & Functional Strength', 'Upper-body and rotational strength for releasing off the line and finishing catches.', 'wr-release-power-strength', 'intermediate', 'strength_power'),
    ('wr-route-break-agility', 'WR Route-Break Agility', 'Sharp cuts and route-break quickness for separating from coverage.', 'wr-route-break-agility', 'intermediate', 'agility_lateral_quickness'),
    ('wr-route-tree-conditioning', 'WR Route-Tree Conditioning', 'Repeat-route conditioning to stay sharp deep into games.', 'wr-route-tree-conditioning', 'beginner', 'conditioning'),
    ('wr-hamstring-ankle-care', 'WR Hamstring & Ankle Care', 'Injury-prevention work for the hamstrings and ankles that take the load on cuts and sprints.', 'wr-hamstring-ankle-care', 'beginner', 'injury_prevention_mobility'),

    ('ol-first-step-acceleration', 'OL First-Step Acceleration', 'Get-off quickness from the stance for run blocking and pass sets.', 'ol-first-step-acceleration', 'intermediate', 'speed'),
    ('ol-pass-set-redirect-agility', 'OL Pass-Set & Redirect Agility', 'Kick-slide footwork and redirect quickness for pass protection.', 'ol-pass-set-redirect-agility', 'intermediate', 'agility_lateral_quickness'),
    ('ol-drive-phase-conditioning', 'OL Drive-Phase Conditioning', 'Repeat-effort conditioning for sustaining drive blocks over a full game.', 'ol-drive-phase-conditioning', 'beginner', 'conditioning'),
    ('ol-hip-knee-shoulder-care', 'OL Hip, Knee & Shoulder Care', 'Joint-resilience work for the wear-and-tear of line play.', 'ol-hip-knee-shoulder-care', 'beginner', 'injury_prevention_mobility'),

    ('lb-sideline-sideline-speed', 'LB Sideline-to-Sideline Speed', 'Downhill and lateral speed for run fits and pursuit.', 'lb-sideline-sideline-speed', 'intermediate', 'speed'),
    ('lb-closing-strength-power', 'LB Closing Strength & Tackling Power', 'Tackling power and explosive strength for linebackers.', 'lb-closing-strength-power', 'intermediate', 'strength_power'),
    ('lb-read-react-agility', 'LB Read-and-React Agility', 'Diagnose-and-close agility for reading plays and triggering downhill.', 'lb-read-react-agility', 'intermediate', 'agility_lateral_quickness'),
    ('lb-full-field-conditioning', 'LB Full-Field Conditioning', 'Sideline-to-sideline repeat conditioning.', 'lb-full-field-conditioning', 'beginner', 'conditioning'),
    ('lb-hip-shoulder-care', 'LB Hip & Shoulder Care', 'Mobility and tissue-resilience work for a high-collision position.', 'lb-hip-shoulder-care', 'beginner', 'injury_prevention_mobility')
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
