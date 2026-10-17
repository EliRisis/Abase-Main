
with workout_defs (slug, name, position_slug, level, estimated_minutes) as (
  values
    ('pg-transition-speed', 'Point Guard Transition Speed', 'point-guard', 'intermediate', 35),
    ('pg-finishing-strength', 'Point Guard Explosive Finishing Strength', 'point-guard', 'intermediate', 45),
    ('pg-conditioning', 'Point Guard Full-Court Conditioning', 'point-guard', 'beginner', 35),
    ('pg-ankle-knee-care', 'Point Guard Ankle & Knee Care', 'point-guard', 'beginner', 30),
    ('sg-closeout-speed', 'Shooting Guard Closeout Speed', 'shooting-guard', 'intermediate', 35),
    ('sg-vertical-finishing-power', 'Shooting Guard Vertical & Finishing Power', 'shooting-guard', 'intermediate', 45),
    ('sg-cut-closeout-agility', 'Shooting Guard Cut & Closeout Agility', 'shooting-guard', 'intermediate', 35),
    ('sg-conditioning', 'Shooting Guard Full-Court Conditioning', 'shooting-guard', 'beginner', 35),
    ('sg-ankle-knee-care', 'Shooting Guard Ankle & Knee Care', 'shooting-guard', 'beginner', 30),
    ('center-rim-to-rim-speed', 'Center Rim-to-Rim Speed', 'center', 'intermediate', 35),
    ('center-post-footwork-agility', 'Center Post Footwork Agility', 'center', 'intermediate', 35),
    ('center-rebounding-conditioning', 'Center Rebounding Conditioning', 'center', 'beginner', 40),
    ('center-knee-shoulder-care', 'Center Knee & Shoulder Care', 'center', 'beginner', 30)
),
inserted_workouts as (
  insert into public.workouts (slug, name, sport_id, position_id, level, estimated_minutes)
  select wd.slug, wd.name, pos.sport_id, pos.id, wd.level::public.experience_level, wd.estimated_minutes
  from workout_defs wd join public.positions pos on pos.slug = wd.position_slug
  returning id, slug, name, sport_id, position_id
),
exercise_defs (workout_slug, order_index, exercise_slug, sets, reps, rest_seconds, notes) as (
  values
    ('pg-transition-speed', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('pg-transition-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('pg-transition-speed', 3, 'box-jump', 4, '4', 90, null),
    ('pg-transition-speed', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('pg-transition-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('pg-finishing-strength', 1, 'back-squat', 4, '6', 120, null),
    ('pg-finishing-strength', 2, 'depth-jump', 4, '3', 120, null),
    ('pg-finishing-strength', 3, 'pull-up', 3, '8', 90, null),
    ('pg-finishing-strength', 4, 'kettlebell-swing', 3, '15', 60, null),
    ('pg-finishing-strength', 5, 'farmers-carry', 3, '40 yards', 90, null),

    ('pg-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('pg-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('pg-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('pg-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('pg-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('pg-ankle-knee-care', 1, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('pg-ankle-knee-care', 2, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('pg-ankle-knee-care', 3, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('pg-ankle-knee-care', 4, 'plank', 3, '30 sec', 45, null),
    ('pg-ankle-knee-care', 5, 'lateral-bound', 3, '5 each side', 60, 'Controlled landing, ankle stability focus'),

    ('sg-closeout-speed', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('sg-closeout-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('sg-closeout-speed', 3, 'lateral-bound', 3, '5 each side', 60, null),
    ('sg-closeout-speed', 4, 'box-jump', 4, '4', 90, null),
    ('sg-closeout-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('sg-vertical-finishing-power', 1, 'back-squat', 4, '6', 120, null),
    ('sg-vertical-finishing-power', 2, 'depth-jump', 4, '3', 120, null),
    ('sg-vertical-finishing-power', 3, 'overhead-press', 3, '8', 90, null),
    ('sg-vertical-finishing-power', 4, 'pull-up', 3, '8', 90, null),
    ('sg-vertical-finishing-power', 5, 'kettlebell-swing', 3, '15', 60, null),

    ('sg-cut-closeout-agility', 1, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('sg-cut-closeout-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('sg-cut-closeout-agility', 3, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('sg-cut-closeout-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('sg-cut-closeout-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('sg-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('sg-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('sg-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('sg-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('sg-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('sg-ankle-knee-care', 1, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('sg-ankle-knee-care', 2, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('sg-ankle-knee-care', 3, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('sg-ankle-knee-care', 4, 'plank', 3, '30 sec', 45, null),
    ('sg-ankle-knee-care', 5, 'band-external-rotation', 3, '15', 45, 'Shoulder care for shooting volume'),

    ('center-rim-to-rim-speed', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('center-rim-to-rim-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('center-rim-to-rim-speed', 3, 'box-jump', 4, '4', 90, null),
    ('center-rim-to-rim-speed', 4, 'sled-push', 5, '15 yards', 90, null),
    ('center-rim-to-rim-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('center-post-footwork-agility', 1, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('center-post-footwork-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('center-post-footwork-agility', 3, 'lateral-bound', 3, '5 each side', 60, null),
    ('center-post-footwork-agility', 4, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('center-post-footwork-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('center-rebounding-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('center-rebounding-conditioning', 2, 'sled-push', 5, '15 yards', 75, null),
    ('center-rebounding-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('center-rebounding-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('center-rebounding-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('center-knee-shoulder-care', 1, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('center-knee-shoulder-care', 2, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('center-knee-shoulder-care', 3, 'band-external-rotation', 3, '15', 45, null),
    ('center-knee-shoulder-care', 4, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('center-knee-shoulder-care', 5, 'plank', 3, '30 sec', 45, null)
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
    ('pg-transition-speed', 'Point Guard Transition Speed', 'Coast-to-coast transition speed for point guards.', 'pg-transition-speed', 'intermediate', 'speed'),
    ('pg-finishing-strength', 'Point Guard Explosive Finishing Strength', 'Explosive strength for finishing through contact at the rim.', 'pg-finishing-strength', 'intermediate', 'strength_power'),
    ('pg-full-court-conditioning', 'Point Guard Full-Court Conditioning', 'Full-court repeat-sprint conditioning for point guards.', 'pg-conditioning', 'beginner', 'conditioning'),
    ('pg-ankle-knee-care', 'Point Guard Ankle & Knee Care', 'Ankle and knee injury prevention for a high-cut position.', 'pg-ankle-knee-care', 'beginner', 'injury_prevention_mobility'),

    ('sg-closeout-speed', 'Shooting Guard Closeout Speed', 'Sprint speed for closing out and running the floor.', 'sg-closeout-speed', 'intermediate', 'speed'),
    ('sg-vertical-finishing-power', 'Shooting Guard Vertical & Finishing Power', 'Vertical explosiveness and finishing strength.', 'sg-vertical-finishing-power', 'intermediate', 'strength_power'),
    ('sg-cut-closeout-agility', 'Shooting Guard Cut & Closeout Agility', 'Cutting off screens and closing out on shooters.', 'sg-cut-closeout-agility', 'intermediate', 'agility_lateral_quickness'),
    ('sg-full-court-conditioning', 'Shooting Guard Full-Court Conditioning', 'Full-court repeat-sprint conditioning for shooting guards.', 'sg-conditioning', 'beginner', 'conditioning'),
    ('sg-ankle-knee-care', 'Shooting Guard Ankle & Knee Care', 'Ankle, knee, and shooting-shoulder care.', 'sg-ankle-knee-care', 'beginner', 'injury_prevention_mobility'),

    ('center-rim-to-rim-speed', 'Center Rim-to-Rim Speed', 'Short-area acceleration for running the floor and beating rotations.', 'center-rim-to-rim-speed', 'intermediate', 'speed'),
    ('center-post-footwork-agility', 'Center Post Footwork Agility', 'Drop-step and post-move footwork for scoring and defending on the block.', 'center-post-footwork-agility', 'intermediate', 'agility_lateral_quickness'),
    ('center-rebounding-conditioning', 'Center Rebounding Conditioning', 'Repeat box-out and rebounding conditioning.', 'center-rebounding-conditioning', 'beginner', 'conditioning'),
    ('center-knee-shoulder-care', 'Center Knee & Shoulder Care', 'Joint-resilience work for a position under constant contact.', 'center-knee-shoulder-care', 'beginner', 'injury_prevention_mobility')
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
