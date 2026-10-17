
with workout_defs (slug, name, position_slug, level, estimated_minutes) as (
  values
    ('midfielder-box-to-box-speed', 'Midfielder Box-to-Box Speed', 'midfielder', 'intermediate', 35),
    ('midfielder-functional-strength-power', 'Midfielder Functional Strength & Power', 'midfielder', 'intermediate', 45),
    ('midfielder-change-of-direction-agility', 'Midfielder Change-of-Direction Agility', 'midfielder', 'intermediate', 35),
    ('midfielder-hamstring-groin-care', 'Midfielder Hamstring & Groin Care', 'midfielder', 'beginner', 30),
    ('forward-finishing-power', 'Forward Finishing Power', 'forward', 'intermediate', 45),
    ('forward-box-movement-agility', 'Forward Box Movement Agility', 'forward', 'intermediate', 35),
    ('forward-match-day-conditioning', 'Forward Match-Day Conditioning', 'forward', 'beginner', 35),
    ('forward-hamstring-groin-care', 'Forward Hamstring & Groin Care', 'forward', 'beginner', 30),
    ('defender-recovery-speed', 'Defender Recovery Speed', 'defender', 'intermediate', 35),
    ('defender-aerial-tackling-strength', 'Defender Aerial & Tackling Strength', 'defender', 'intermediate', 45),
    ('defender-jockey-recovery-agility', 'Defender Jockey & Recovery Agility', 'defender', 'intermediate', 35),
    ('defender-ninety-minute-conditioning', 'Defender Ninety-Minute Conditioning', 'defender', 'beginner', 35),
    ('defender-hamstring-groin-care', 'Defender Hamstring & Groin Care', 'defender', 'beginner', 30),
    ('goalkeeper-reaction-speed', 'Goalkeeper Reaction Speed', 'goalkeeper', 'intermediate', 35),
    ('goalkeeper-diving-catching-power', 'Goalkeeper Diving & Catching Power', 'goalkeeper', 'intermediate', 45),
    ('goalkeeper-lateral-dive-agility', 'Goalkeeper Lateral Dive Agility', 'goalkeeper', 'intermediate', 35),
    ('goalkeeper-match-sharpness-conditioning', 'Goalkeeper Match Sharpness Conditioning', 'goalkeeper', 'beginner', 35),
    ('goalkeeper-shoulder-wrist-care', 'Goalkeeper Shoulder & Wrist Care', 'goalkeeper', 'beginner', 30)
),
inserted_workouts as (
  insert into public.workouts (slug, name, sport_id, position_id, level, estimated_minutes)
  select wd.slug, wd.name, pos.sport_id, pos.id, wd.level::public.experience_level, wd.estimated_minutes
  from workout_defs wd join public.positions pos on pos.slug = wd.position_slug
  returning id, slug, name, sport_id, position_id
),
exercise_defs (workout_slug, order_index, exercise_slug, sets, reps, rest_seconds, notes) as (
  values
    ('midfielder-box-to-box-speed', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('midfielder-box-to-box-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('midfielder-box-to-box-speed', 3, 'box-jump', 4, '4', 90, null),
    ('midfielder-box-to-box-speed', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('midfielder-box-to-box-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('midfielder-functional-strength-power', 1, 'back-squat', 4, '6', 120, null),
    ('midfielder-functional-strength-power', 2, 'med-ball-rotational-throw', 4, '6 each side', 75, null),
    ('midfielder-functional-strength-power', 3, 'barbell-row', 3, '8', 90, null),
    ('midfielder-functional-strength-power', 4, 'single-leg-box-jump', 3, '4 each side', 90, null),
    ('midfielder-functional-strength-power', 5, 'farmers-carry', 3, '40 yards', 90, null),

    ('midfielder-change-of-direction-agility', 1, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('midfielder-change-of-direction-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('midfielder-change-of-direction-agility', 3, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('midfielder-change-of-direction-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('midfielder-change-of-direction-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('midfielder-hamstring-groin-care', 1, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('midfielder-hamstring-groin-care', 2, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('midfielder-hamstring-groin-care', 3, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('midfielder-hamstring-groin-care', 4, 'plank', 3, '30 sec', 45, null),
    ('midfielder-hamstring-groin-care', 5, 'lateral-bound', 3, '5 each side', 60, 'Controlled range, groin-friendly'),

    ('forward-finishing-power', 1, 'back-squat', 4, '6', 120, null),
    ('forward-finishing-power', 2, 'depth-jump', 4, '3', 120, null),
    ('forward-finishing-power', 3, 'kettlebell-swing', 3, '15', 60, null),
    ('forward-finishing-power', 4, 'single-leg-box-jump', 3, '4 each side', 90, null),
    ('forward-finishing-power', 5, 'plank', 3, '30 sec', 45, null),

    ('forward-box-movement-agility', 1, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('forward-box-movement-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('forward-box-movement-agility', 3, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('forward-box-movement-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('forward-box-movement-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('forward-match-day-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('forward-match-day-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('forward-match-day-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('forward-match-day-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('forward-match-day-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('forward-hamstring-groin-care', 1, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('forward-hamstring-groin-care', 2, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('forward-hamstring-groin-care', 3, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('forward-hamstring-groin-care', 4, 'plank', 3, '30 sec', 45, null),
    ('forward-hamstring-groin-care', 5, 'lateral-bound', 3, '5 each side', 60, null),

    ('defender-recovery-speed', 1, 'forty-yard-sprint', 5, '1 rep', 120, null),
    ('defender-recovery-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('defender-recovery-speed', 3, 'lateral-bound', 3, '5 each side', 60, null),
    ('defender-recovery-speed', 4, 'box-jump', 4, '4', 90, null),
    ('defender-recovery-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('defender-aerial-tackling-strength', 1, 'back-squat', 4, '6', 120, null),
    ('defender-aerial-tackling-strength', 2, 'overhead-press', 3, '8', 90, null),
    ('defender-aerial-tackling-strength', 3, 'barbell-row', 3, '8', 90, null),
    ('defender-aerial-tackling-strength', 4, 'kettlebell-swing', 3, '15', 60, null),
    ('defender-aerial-tackling-strength', 5, 'farmers-carry', 3, '40 yards', 90, null),

    ('defender-jockey-recovery-agility', 1, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('defender-jockey-recovery-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('defender-jockey-recovery-agility', 3, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('defender-jockey-recovery-agility', 4, 'lateral-bound', 3, '5 each side', 60, null),
    ('defender-jockey-recovery-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('defender-ninety-minute-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('defender-ninety-minute-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('defender-ninety-minute-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('defender-ninety-minute-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('defender-ninety-minute-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('defender-hamstring-groin-care', 1, 'nordic-hamstring-curl', 3, '6', 60, null),
    ('defender-hamstring-groin-care', 2, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('defender-hamstring-groin-care', 3, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('defender-hamstring-groin-care', 4, 'plank', 3, '30 sec', 45, null),
    ('defender-hamstring-groin-care', 5, 'band-external-rotation', 3, '15', 45, 'Aerial-duel shoulder safety'),

    ('goalkeeper-reaction-speed', 1, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('goalkeeper-reaction-speed', 2, 'broad-jump', 4, '3', 90, null),
    ('goalkeeper-reaction-speed', 3, 'lateral-bound', 3, '5 each side', 60, null),
    ('goalkeeper-reaction-speed', 4, 'box-jump', 4, '4', 90, null),
    ('goalkeeper-reaction-speed', 5, 'plank', 3, '30 sec', 45, null),

    ('goalkeeper-diving-catching-power', 1, 'depth-jump', 4, '3', 120, null),
    ('goalkeeper-diving-catching-power', 2, 'overhead-press', 3, '8', 90, null),
    ('goalkeeper-diving-catching-power', 3, 'med-ball-rotational-throw', 4, '6 each side', 75, null),
    ('goalkeeper-diving-catching-power', 4, 'pull-up', 3, '8', 90, null),
    ('goalkeeper-diving-catching-power', 5, 'plank', 3, '30 sec', 45, null),

    ('goalkeeper-lateral-dive-agility', 1, 'lateral-bound', 4, '5 each side', 60, null),
    ('goalkeeper-lateral-dive-agility', 2, 'agility-ladder-icky-shuffle', 4, '20 sec', 45, null),
    ('goalkeeper-lateral-dive-agility', 3, 'cone-shuttle-5-10-5', 4, '1 rep', 90, null),
    ('goalkeeper-lateral-dive-agility', 4, 'reactive-cone-sprint', 5, '1 rep', 60, null),
    ('goalkeeper-lateral-dive-agility', 5, 'plank', 3, '30 sec', 45, null),

    ('goalkeeper-match-sharpness-conditioning', 1, 'shuttle-run', 5, '1 rep', 60, null),
    ('goalkeeper-match-sharpness-conditioning', 2, 'jump-rope', 5, '1 min', 30, null),
    ('goalkeeper-match-sharpness-conditioning', 3, 'kettlebell-swing', 4, '20', 45, null),
    ('goalkeeper-match-sharpness-conditioning', 4, 'push-up', 3, '15', 45, null),
    ('goalkeeper-match-sharpness-conditioning', 5, 'plank', 3, '40 sec', 30, null),

    ('goalkeeper-shoulder-wrist-care', 1, 'band-external-rotation', 3, '15', 45, null),
    ('goalkeeper-shoulder-wrist-care', 2, 'copenhagen-plank', 3, '20 sec each side', 45, null),
    ('goalkeeper-shoulder-wrist-care', 3, 'single-leg-romanian-deadlift', 3, '8 each side', 60, null),
    ('goalkeeper-shoulder-wrist-care', 4, 'plank', 3, '30 sec', 45, null),
    ('goalkeeper-shoulder-wrist-care', 5, 'push-up', 3, '12', 45, 'Controlled tempo, wrist loading')
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
    ('midfielder-box-to-box-speed', 'Midfielder Box-to-Box Speed', 'End-to-end sprint speed for covering the full length of the pitch.', 'midfielder-box-to-box-speed', 'intermediate', 'speed'),
    ('midfielder-functional-strength-power', 'Midfielder Functional Strength & Power', 'Duel strength and rotational power for midfielders.', 'midfielder-functional-strength-power', 'intermediate', 'strength_power'),
    ('midfielder-change-of-direction-agility', 'Midfielder Change-of-Direction Agility', 'Quick direction changes for tight spaces in midfield.', 'midfielder-change-of-direction-agility', 'intermediate', 'agility_lateral_quickness'),
    ('midfielder-hamstring-groin-care', 'Midfielder Hamstring & Groin Care', 'Injury prevention for the highest-mileage position on the pitch.', 'midfielder-hamstring-groin-care', 'beginner', 'injury_prevention_mobility'),

    ('forward-finishing-power', 'Forward Finishing Power', 'Explosive power for beating defenders and finishing chances.', 'forward-finishing-power', 'intermediate', 'strength_power'),
    ('forward-box-movement-agility', 'Forward Box Movement Agility', 'Quick movement in the box to lose markers and create space.', 'forward-box-movement-agility', 'intermediate', 'agility_lateral_quickness'),
    ('forward-match-day-conditioning', 'Forward Match-Day Conditioning', 'Repeat-sprint conditioning for a 90-minute match.', 'forward-match-day-conditioning', 'beginner', 'conditioning'),
    ('forward-hamstring-groin-care', 'Forward Hamstring & Groin Care', 'Injury prevention for explosive sprinting and cutting.', 'forward-hamstring-groin-care', 'beginner', 'injury_prevention_mobility'),

    ('defender-recovery-speed', 'Defender Recovery Speed', 'Recovery sprint speed for tracking back after an attack breaks down.', 'defender-recovery-speed', 'intermediate', 'speed'),
    ('defender-aerial-tackling-strength', 'Defender Aerial & Tackling Strength', 'Strength for aerial duels and physical tackling.', 'defender-aerial-tackling-strength', 'intermediate', 'strength_power'),
    ('defender-jockey-recovery-agility', 'Defender Jockey & Recovery Agility', 'Jockeying footwork and change-of-direction for 1v1 defending.', 'defender-jockey-recovery-agility', 'intermediate', 'agility_lateral_quickness'),
    ('defender-ninety-minute-conditioning', 'Defender Ninety-Minute Conditioning', 'Full-match repeat-effort conditioning for defenders.', 'defender-ninety-minute-conditioning', 'beginner', 'conditioning'),
    ('defender-hamstring-groin-care', 'Defender Hamstring & Groin Care', 'Injury prevention for a position built on recovery sprints and duels.', 'defender-hamstring-groin-care', 'beginner', 'injury_prevention_mobility'),

    ('goalkeeper-reaction-speed', 'Goalkeeper Reaction Speed', 'Explosive first-movement speed off a stationary start.', 'goalkeeper-reaction-speed', 'intermediate', 'speed'),
    ('goalkeeper-diving-catching-power', 'Goalkeeper Diving & Catching Power', 'Explosive diving power and upper-body catching strength.', 'goalkeeper-diving-catching-power', 'intermediate', 'strength_power'),
    ('goalkeeper-lateral-dive-agility', 'Goalkeeper Lateral Dive Agility', 'Lateral quickness for covering the width of the goal.', 'goalkeeper-lateral-dive-agility', 'intermediate', 'agility_lateral_quickness'),
    ('goalkeeper-match-sharpness-conditioning', 'Goalkeeper Match Sharpness Conditioning', 'Conditioning that keeps reaction quality high for 90 minutes.', 'goalkeeper-match-sharpness-conditioning', 'beginner', 'conditioning'),
    ('goalkeeper-shoulder-wrist-care', 'Goalkeeper Shoulder & Wrist Care', 'Shoulder and wrist durability for repeated diving and catching.', 'goalkeeper-shoulder-wrist-care', 'beginner', 'injury_prevention_mobility')
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
