-- Seed data: sports, positions, a shared exercise library, position-tagged
-- workouts, and one sample multi-week plan per sport. Safe to re-run
-- (idempotent via ON CONFLICT on unique slugs/names).

-- ---------------------------------------------------------------------------
-- Sports
-- ---------------------------------------------------------------------------
insert into public.sports (name, slug, icon) values
  ('Football', 'football', '🏈'),
  ('Basketball', 'basketball', '🏀'),
  ('Soccer', 'soccer', '⚽'),
  ('Baseball', 'baseball', '⚾')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Positions
-- ---------------------------------------------------------------------------
insert into public.positions (sport_id, name, slug, description)
select s.id, p.name, p.slug, p.description
from (values
  ('football', 'Quarterback', 'quarterback', 'Runs the offense; needs rotational power, arm care, and pocket agility.'),
  ('football', 'Wide Receiver', 'wide-receiver', 'Route runner and deep threat; top-end speed and acceleration are king.'),
  ('football', 'Offensive Lineman', 'offensive-lineman', 'Trench player; raw strength, leg drive, and short-area power.'),
  ('football', 'Linebacker', 'linebacker', 'Sideline-to-sideline defender; blends strength with change-of-direction speed.'),
  ('basketball', 'Point Guard', 'point-guard', 'Primary ball-handler; needs first-step quickness and change of direction.'),
  ('basketball', 'Shooting Guard', 'shooting-guard', 'Perimeter scorer; footwork and repeat explosiveness off the catch.'),
  ('basketball', 'Center', 'center', 'Interior presence; vertical power, post strength, and rebounding position.'),
  ('soccer', 'Forward', 'forward', 'Finisher; explosive first steps and repeated sprint power.'),
  ('soccer', 'Midfielder', 'midfielder', 'Engine of the team; aerobic capacity and repeat-sprint endurance.'),
  ('soccer', 'Defender', 'defender', 'Last line; strength in duels plus recovery speed.'),
  ('soccer', 'Goalkeeper', 'goalkeeper', 'Shot-stopper; reactive power and lateral explosiveness.'),
  ('baseball', 'Pitcher', 'pitcher', 'Arm care, hip-shoulder separation, and rotational power are essential.'),
  ('baseball', 'Infielder', 'infielder', 'Quick hands and feet; lateral quickness and reactive agility.'),
  ('baseball', 'Outfielder', 'outfielder', 'Covers ground; top-end speed and first-step reaction.')
) as p(sport_slug, name, slug, description)
join public.sports s on s.slug = p.sport_slug
on conflict (sport_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- Exercises (shared pool)
-- ---------------------------------------------------------------------------
insert into public.exercises (name, slug, description, muscle_groups, equipment) values
  ('Back Squat', 'back-squat', 'Barbell on the back, squat to depth, drive through the floor.', array['Quads','Glutes'], 'Barbell'),
  ('Barbell Bench Press', 'barbell-bench-press', 'Flat bench press for upper body pressing strength.', array['Chest','Triceps','Shoulders'], 'Barbell'),
  ('Conventional Deadlift', 'conventional-deadlift', 'Hip-hinge pull from the floor; total-body posterior chain strength.', array['Hamstrings','Glutes','Back'], 'Barbell'),
  ('Pull-Up', 'pull-up', 'Dead-hang to chin over the bar; upper body pulling strength.', array['Lats','Biceps'], 'Pull-Up Bar'),
  ('Push-Up', 'push-up', 'Bodyweight horizontal press with a rigid plank line.', array['Chest','Triceps','Core'], 'Bodyweight'),
  ('Dumbbell Romanian Deadlift', 'dumbbell-romanian-deadlift', 'Hip-hinge with dumbbells to build posterior chain and hamstring control.', array['Hamstrings','Glutes'], 'Dumbbells'),
  ('Barbell Row', 'barbell-row', 'Bent-over row for upper back thickness and pulling strength.', array['Back','Lats','Biceps'], 'Barbell'),
  ('Overhead Press', 'overhead-press', 'Standing barbell press for shoulder and core strength.', array['Shoulders','Triceps'], 'Barbell'),
  ('Kettlebell Swing', 'kettlebell-swing', 'Ballistic hip-hinge for posterior chain power and conditioning.', array['Glutes','Hamstrings','Core'], 'Kettlebell'),
  ('Box Jump', 'box-jump', 'Explosive double-leg jump onto a box; vertical power development.', array['Quads','Glutes','Calves'], 'Plyo Box'),
  ('Broad Jump', 'broad-jump', 'Max-distance horizontal jump; explosive lower body power.', array['Quads','Glutes'], 'Bodyweight'),
  ('Lateral Bound', 'lateral-bound', 'Side-to-side bound and stick; frontal-plane power and stability.', array['Glutes','Adductors'], 'Bodyweight'),
  ('Medicine Ball Rotational Throw', 'med-ball-rotational-throw', 'Rotational throw against a wall; transfers hip power through the core.', array['Core','Obliques'], 'Medicine Ball'),
  ('40-Yard Sprint', 'forty-yard-sprint', 'Max-effort linear sprint for top-end speed.', array['Quads','Hamstrings','Calves'], 'None'),
  ('Agility Ladder Icky Shuffle', 'agility-ladder-icky-shuffle', 'Fast-feet ladder drill for coordination and foot speed.', array['Calves','Hip Flexors'], 'Agility Ladder'),
  ('Cone Shuttle (5-10-5)', 'cone-shuttle-5-10-5', 'Change-of-direction shuttle drill under time.', array['Quads','Hamstrings','Core'], 'Cones'),
  ('Plank', 'plank', 'Isometric front-plank hold for core and trunk stability.', array['Core'], 'Bodyweight'),
  ('Farmer''s Carry', 'farmers-carry', 'Loaded carry for grip, trap, and core stability under load.', array['Forearms','Traps','Core'], 'Dumbbells')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Workouts (tagged to sport + position where relevant)
-- ---------------------------------------------------------------------------
insert into public.workouts (name, slug, description, sport_id, position_id, level, estimated_minutes)
select w.name, w.slug, w.description, s.id, pos.id, w.level::public.experience_level, w.minutes
from (values
  ('QB Arm Care & Rotational Power', 'qb-arm-care-rotational-power', 'Builds hip-shoulder separation and protects the throwing arm.', 'football', 'quarterback', 'beginner', 45),
  ('WR Speed & Acceleration', 'wr-speed-acceleration', 'Top-end speed, acceleration mechanics, and explosive first steps.', 'football', 'wide-receiver', 'intermediate', 50),
  ('Lineman Strength Foundations', 'ol-strength-foundations', 'Raw total-body strength for trench-player power.', 'football', 'offensive-lineman', 'beginner', 55),
  ('PG Quickness & Explosiveness', 'pg-explosiveness-quickness', 'First-step quickness and multi-directional power for guards.', 'basketball', 'point-guard', 'intermediate', 45),
  ('Center Post Strength & Vertical Power', 'center-post-power', 'Vertical explosiveness and interior strength for post players.', 'basketball', 'center', 'beginner', 50),
  ('Forward Explosive Finishing', 'forward-explosive-finishing', 'Repeated explosive efforts for attacking finishers.', 'soccer', 'forward', 'intermediate', 45),
  ('Midfielder Aerobic Engine', 'midfielder-aerobic-engine', 'Builds the strength base that supports a big work rate.', 'soccer', 'midfielder', 'beginner', 50),
  ('Pitcher Shoulder & Hip Stability', 'pitcher-shoulder-hip-stability', 'Arm care and rotational power for pitchers.', 'baseball', 'pitcher', 'beginner', 40),
  ('Infielder Lateral Quickness', 'infielder-lateral-quickness', 'Reactive lateral quickness and hands-ready athleticism.', 'baseball', 'infielder', 'intermediate', 45),
  ('Full-Body Conditioning Circuit', 'full-body-conditioning-circuit', 'Sport-agnostic strength and conditioning base builder.', null, null, 'beginner', 40)
) as w(name, slug, description, sport_slug, position_slug, level, minutes)
left join public.sports s on s.slug = w.sport_slug
left join public.positions pos on pos.slug = w.position_slug and pos.sport_id = s.id
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Workout exercises
-- ---------------------------------------------------------------------------
insert into public.workout_exercises (workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
select wo.id, ex.id, we.order_index, we.sets, we.reps, we.rest_seconds, we.notes
from (values
  ('qb-arm-care-rotational-power', 'med-ball-rotational-throw', 1, 4, '6 each side', 60, 'Full hip rotation, throw for speed'),
  ('qb-arm-care-rotational-power', 'plank', 2, 3, '30 sec', 45, null),
  ('qb-arm-care-rotational-power', 'dumbbell-romanian-deadlift', 3, 3, '10', 75, null),
  ('qb-arm-care-rotational-power', 'push-up', 4, 3, '12', 60, null),
  ('qb-arm-care-rotational-power', 'lateral-bound', 5, 3, '5 each side', 60, 'Stick each landing'),

  ('wr-speed-acceleration', 'forty-yard-sprint', 1, 5, '1 rep', 120, 'Full recovery between reps'),
  ('wr-speed-acceleration', 'broad-jump', 2, 4, '3', 90, null),
  ('wr-speed-acceleration', 'lateral-bound', 3, 3, '5 each side', 60, null),
  ('wr-speed-acceleration', 'back-squat', 4, 3, '5', 120, 'Moderate load, focus on speed off the floor'),
  ('wr-speed-acceleration', 'plank', 5, 3, '30 sec', 45, null),

  ('ol-strength-foundations', 'back-squat', 1, 5, '5', 150, null),
  ('ol-strength-foundations', 'conventional-deadlift', 2, 4, '5', 150, null),
  ('ol-strength-foundations', 'barbell-bench-press', 3, 4, '6', 120, null),
  ('ol-strength-foundations', 'barbell-row', 4, 4, '8', 90, null),
  ('ol-strength-foundations', 'farmers-carry', 5, 3, '40 yards', 90, null),

  ('pg-explosiveness-quickness', 'agility-ladder-icky-shuffle', 1, 4, '20 sec', 45, null),
  ('pg-explosiveness-quickness', 'cone-shuttle-5-10-5', 2, 4, '1 rep', 90, 'Max effort'),
  ('pg-explosiveness-quickness', 'box-jump', 3, 4, '4', 90, null),
  ('pg-explosiveness-quickness', 'kettlebell-swing', 4, 3, '15', 60, null),
  ('pg-explosiveness-quickness', 'plank', 5, 3, '30 sec', 45, null),

  ('center-post-power', 'box-jump', 1, 5, '3', 90, 'Focus on max height'),
  ('center-post-power', 'back-squat', 2, 4, '6', 120, null),
  ('center-post-power', 'overhead-press', 3, 4, '8', 90, null),
  ('center-post-power', 'pull-up', 4, 3, '8', 90, null),
  ('center-post-power', 'farmers-carry', 5, 3, '40 yards', 90, null),

  ('forward-explosive-finishing', 'broad-jump', 1, 4, '3', 90, null),
  ('forward-explosive-finishing', 'forty-yard-sprint', 2, 5, '1 rep', 120, null),
  ('forward-explosive-finishing', 'lateral-bound', 3, 3, '5 each side', 60, null),
  ('forward-explosive-finishing', 'kettlebell-swing', 4, 3, '15', 60, null),
  ('forward-explosive-finishing', 'plank', 5, 3, '30 sec', 45, null),

  ('midfielder-aerobic-engine', 'back-squat', 1, 4, '8', 90, null),
  ('midfielder-aerobic-engine', 'dumbbell-romanian-deadlift', 2, 3, '10', 75, null),
  ('midfielder-aerobic-engine', 'push-up', 3, 3, '15', 60, null),
  ('midfielder-aerobic-engine', 'kettlebell-swing', 4, 4, '20', 60, null),
  ('midfielder-aerobic-engine', 'plank', 5, 3, '40 sec', 45, null),

  ('pitcher-shoulder-hip-stability', 'med-ball-rotational-throw', 1, 4, '6 each side', 60, null),
  ('pitcher-shoulder-hip-stability', 'lateral-bound', 2, 3, '5 each side', 60, null),
  ('pitcher-shoulder-hip-stability', 'dumbbell-romanian-deadlift', 3, 3, '10', 75, null),
  ('pitcher-shoulder-hip-stability', 'push-up', 4, 3, '12', 60, null),
  ('pitcher-shoulder-hip-stability', 'plank', 5, 3, '30 sec', 45, null),

  ('infielder-lateral-quickness', 'agility-ladder-icky-shuffle', 1, 4, '20 sec', 45, null),
  ('infielder-lateral-quickness', 'lateral-bound', 2, 4, '5 each side', 60, null),
  ('infielder-lateral-quickness', 'cone-shuttle-5-10-5', 3, 4, '1 rep', 90, null),
  ('infielder-lateral-quickness', 'back-squat', 4, 3, '6', 120, null),
  ('infielder-lateral-quickness', 'plank', 5, 3, '30 sec', 45, null),

  ('full-body-conditioning-circuit', 'back-squat', 1, 3, '10', 75, null),
  ('full-body-conditioning-circuit', 'push-up', 2, 3, '15', 60, null),
  ('full-body-conditioning-circuit', 'barbell-row', 3, 3, '10', 75, null),
  ('full-body-conditioning-circuit', 'kettlebell-swing', 4, 3, '20', 60, null),
  ('full-body-conditioning-circuit', 'plank', 5, 3, '30 sec', 45, null)
) as we(workout_slug, exercise_slug, order_index, sets, reps, rest_seconds, notes)
join public.workouts wo on wo.slug = we.workout_slug
join public.exercises ex on ex.slug = we.exercise_slug
on conflict (workout_id, order_index) do nothing;

-- ---------------------------------------------------------------------------
-- Plans: one 4-week, 3-day/week sample plan per sport.
-- ---------------------------------------------------------------------------
insert into public.plans (name, slug, description, sport_id, position_id, level, weeks, days_per_week, published)
select p.name, p.slug, p.description, s.id, pos.id, p.level::public.experience_level, p.weeks, p.days_per_week, true
from (values
  ('QB Off-Season Foundations', 'qb-off-season-foundations', 'A 4-week base-building block for quarterbacks: arm care, rotational power, and core stability.', 'football', 'quarterback', 'beginner', 4, 3),
  ('Point Guard Explosiveness', 'point-guard-explosiveness', 'A 4-week block for guards to build first-step quickness and multi-directional power.', 'basketball', 'point-guard', 'intermediate', 4, 3),
  ('Soccer Midfielder Engine Builder', 'soccer-midfielder-engine-builder', 'A 4-week strength base to support a big work rate for box-to-box midfielders.', 'soccer', 'midfielder', 'beginner', 4, 3),
  ('Pitcher Arm Care & Power', 'pitcher-arm-care-power', 'A 4-week block focused on shoulder health, hip-shoulder separation, and rotational power.', 'baseball', 'pitcher', 'beginner', 4, 3)
) as p(name, slug, description, sport_slug, position_slug, level, weeks, days_per_week)
join public.sports s on s.slug = p.sport_slug
join public.positions pos on pos.slug = p.position_slug and pos.sport_id = s.id
on conflict (slug) do nothing;

-- Each plan repeats a small rotation of workouts across its 4 weeks.
insert into public.plan_workouts (plan_id, workout_id, week_number, day_number, title)
select pl.id, wo.id, pw.week_number, pw.day_number, pw.title
from (values
  -- QB Off-Season Foundations
  ('qb-off-season-foundations', 'qb-arm-care-rotational-power', 1, 1, 'Arm Care & Rotational Power'),
  ('qb-off-season-foundations', 'full-body-conditioning-circuit', 1, 3, 'Full-Body Conditioning'),
  ('qb-off-season-foundations', 'qb-arm-care-rotational-power', 1, 5, 'Arm Care & Rotational Power'),
  ('qb-off-season-foundations', 'qb-arm-care-rotational-power', 2, 1, 'Arm Care & Rotational Power'),
  ('qb-off-season-foundations', 'full-body-conditioning-circuit', 2, 3, 'Full-Body Conditioning'),
  ('qb-off-season-foundations', 'qb-arm-care-rotational-power', 2, 5, 'Arm Care & Rotational Power'),
  ('qb-off-season-foundations', 'qb-arm-care-rotational-power', 3, 1, 'Arm Care & Rotational Power'),
  ('qb-off-season-foundations', 'full-body-conditioning-circuit', 3, 3, 'Full-Body Conditioning'),
  ('qb-off-season-foundations', 'qb-arm-care-rotational-power', 3, 5, 'Arm Care & Rotational Power'),
  ('qb-off-season-foundations', 'qb-arm-care-rotational-power', 4, 1, 'Arm Care & Rotational Power'),
  ('qb-off-season-foundations', 'full-body-conditioning-circuit', 4, 3, 'Full-Body Conditioning'),
  ('qb-off-season-foundations', 'qb-arm-care-rotational-power', 4, 5, 'Arm Care & Rotational Power'),

  -- Point Guard Explosiveness
  ('point-guard-explosiveness', 'pg-explosiveness-quickness', 1, 1, 'Quickness & Explosiveness'),
  ('point-guard-explosiveness', 'full-body-conditioning-circuit', 1, 3, 'Full-Body Conditioning'),
  ('point-guard-explosiveness', 'pg-explosiveness-quickness', 1, 5, 'Quickness & Explosiveness'),
  ('point-guard-explosiveness', 'pg-explosiveness-quickness', 2, 1, 'Quickness & Explosiveness'),
  ('point-guard-explosiveness', 'full-body-conditioning-circuit', 2, 3, 'Full-Body Conditioning'),
  ('point-guard-explosiveness', 'pg-explosiveness-quickness', 2, 5, 'Quickness & Explosiveness'),
  ('point-guard-explosiveness', 'pg-explosiveness-quickness', 3, 1, 'Quickness & Explosiveness'),
  ('point-guard-explosiveness', 'full-body-conditioning-circuit', 3, 3, 'Full-Body Conditioning'),
  ('point-guard-explosiveness', 'pg-explosiveness-quickness', 3, 5, 'Quickness & Explosiveness'),
  ('point-guard-explosiveness', 'pg-explosiveness-quickness', 4, 1, 'Quickness & Explosiveness'),
  ('point-guard-explosiveness', 'full-body-conditioning-circuit', 4, 3, 'Full-Body Conditioning'),
  ('point-guard-explosiveness', 'pg-explosiveness-quickness', 4, 5, 'Quickness & Explosiveness'),

  -- Soccer Midfielder Engine Builder
  ('soccer-midfielder-engine-builder', 'midfielder-aerobic-engine', 1, 1, 'Aerobic Engine'),
  ('soccer-midfielder-engine-builder', 'full-body-conditioning-circuit', 1, 3, 'Full-Body Conditioning'),
  ('soccer-midfielder-engine-builder', 'midfielder-aerobic-engine', 1, 5, 'Aerobic Engine'),
  ('soccer-midfielder-engine-builder', 'midfielder-aerobic-engine', 2, 1, 'Aerobic Engine'),
  ('soccer-midfielder-engine-builder', 'full-body-conditioning-circuit', 2, 3, 'Full-Body Conditioning'),
  ('soccer-midfielder-engine-builder', 'midfielder-aerobic-engine', 2, 5, 'Aerobic Engine'),
  ('soccer-midfielder-engine-builder', 'midfielder-aerobic-engine', 3, 1, 'Aerobic Engine'),
  ('soccer-midfielder-engine-builder', 'full-body-conditioning-circuit', 3, 3, 'Full-Body Conditioning'),
  ('soccer-midfielder-engine-builder', 'midfielder-aerobic-engine', 3, 5, 'Aerobic Engine'),
  ('soccer-midfielder-engine-builder', 'midfielder-aerobic-engine', 4, 1, 'Aerobic Engine'),
  ('soccer-midfielder-engine-builder', 'full-body-conditioning-circuit', 4, 3, 'Full-Body Conditioning'),
  ('soccer-midfielder-engine-builder', 'midfielder-aerobic-engine', 4, 5, 'Aerobic Engine'),

  -- Pitcher Arm Care & Power
  ('pitcher-arm-care-power', 'pitcher-shoulder-hip-stability', 1, 1, 'Shoulder & Hip Stability'),
  ('pitcher-arm-care-power', 'full-body-conditioning-circuit', 1, 3, 'Full-Body Conditioning'),
  ('pitcher-arm-care-power', 'pitcher-shoulder-hip-stability', 1, 5, 'Shoulder & Hip Stability'),
  ('pitcher-arm-care-power', 'pitcher-shoulder-hip-stability', 2, 1, 'Shoulder & Hip Stability'),
  ('pitcher-arm-care-power', 'full-body-conditioning-circuit', 2, 3, 'Full-Body Conditioning'),
  ('pitcher-arm-care-power', 'pitcher-shoulder-hip-stability', 2, 5, 'Shoulder & Hip Stability'),
  ('pitcher-arm-care-power', 'pitcher-shoulder-hip-stability', 3, 1, 'Shoulder & Hip Stability'),
  ('pitcher-arm-care-power', 'full-body-conditioning-circuit', 3, 3, 'Full-Body Conditioning'),
  ('pitcher-arm-care-power', 'pitcher-shoulder-hip-stability', 3, 5, 'Shoulder & Hip Stability'),
  ('pitcher-arm-care-power', 'pitcher-shoulder-hip-stability', 4, 1, 'Shoulder & Hip Stability'),
  ('pitcher-arm-care-power', 'full-body-conditioning-circuit', 4, 3, 'Full-Body Conditioning'),
  ('pitcher-arm-care-power', 'pitcher-shoulder-hip-stability', 4, 5, 'Shoulder & Hip Stability')
) as pw(plan_slug, workout_slug, week_number, day_number, title)
join public.plans pl on pl.slug = pw.plan_slug
join public.workouts wo on wo.slug = pw.workout_slug
on conflict (plan_id, week_number, day_number) do nothing;
