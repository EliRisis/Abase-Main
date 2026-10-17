
-- Five workouts already existed with matching sport/position but no
-- plan wrapping them (they were never wired into plan_workouts). Wrap
-- each into a new 4-week plan reusing that same workout content -- no
-- duplicate workout/exercise data created.

with admin_user as (
  select id from public.profiles where role = 'admin' limit 1
),
new_plans as (
  insert into public.plans (name, slug, description, sport_id, position_id, level, weeks, days_per_week, published, goal, created_by)
  select v.name, v.slug, v.description, w.sport_id, w.position_id, w.level, 4, 3, true, v.goal::public.training_goal, admin_user.id
  from (values
    ('Center Post Strength & Power', 'center-post-strength-power', 'Post-play leverage and vertical power for centers.', 'center-post-power', 'strength_power'),
    ('Forward Explosive Finishing', 'forward-explosive-finishing-plan', 'Explosive finishing speed and power for forwards.', 'forward-explosive-finishing', 'speed'),
    ('Infielder Lateral Quickness', 'infielder-lateral-quickness-plan', 'Change-of-direction and lateral quickness for infielders.', 'infielder-lateral-quickness', 'agility_lateral_quickness'),
    ('OL Strength Foundations', 'ol-strength-foundations-plan', 'Max strength and leverage foundations for offensive linemen.', 'ol-strength-foundations', 'strength_power'),
    ('WR Speed & Acceleration', 'wr-speed-acceleration-plan', 'Acceleration and top-end speed for wide receivers.', 'wr-speed-acceleration', 'speed')
  ) as v(name, slug, description, workout_slug, goal)
  join public.workouts w on w.slug = v.workout_slug
  cross join admin_user
  returning id, slug
),
mapping as (
  select np.id as plan_id, w.id as workout_id, w.name as workout_name
  from new_plans np
  join public.workouts w on w.slug = (
    case np.slug
      when 'center-post-strength-power' then 'center-post-power'
      when 'forward-explosive-finishing-plan' then 'forward-explosive-finishing'
      when 'infielder-lateral-quickness-plan' then 'infielder-lateral-quickness'
      when 'ol-strength-foundations-plan' then 'ol-strength-foundations'
      when 'wr-speed-acceleration-plan' then 'wr-speed-acceleration'
    end
  )
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
