-- Gym and Field are two separate tracks. A program day is now ONE session in ONE environment:
--   user_program_days.setting = 'weight_room' | 'field', unique per (program, week, day, setting),
-- so one date can hold a Gym session and a separate Field session.
-- Existing days that mixed both environments are split into two rows; nothing is deleted.

-- 1. All plyometrics live in the Field track.
update public.exercises set setting = 'field' where movement_pattern = 'plyometric' and setting = 'weight_room';
-- days already written from those exercises follow them; recovery-day rows resolve to the field track
update public.user_program_day_exercises pde
   set setting = 'field'
  from public.exercises e
 where e.id = pde.exercise_id and e.movement_pattern = 'plyometric' and pde.setting <> 'field';
update public.user_program_day_exercises set setting = 'field' where setting = 'recovery';

-- 2. Schema
alter table public.user_program_days drop constraint user_program_days_program_id_week_number_day_number_key;
alter table public.user_program_days add column setting public.training_setting;

-- 3. Backfill (counts are asserted at the end)
do $$
declare
  d record;
  n_gym int;
  n_field int;
  native public.training_setting;
  other public.training_setting;
  new_id uuid;
  base text;
  gym_row uuid;
  before_days int;
  before_ex int;
  before_logs int;
begin
  select count(*) into before_days from public.user_program_days;
  select count(*) into before_ex from public.user_program_day_exercises;
  select count(*) into before_logs from public.progress_logs;

  for d in select * from public.user_program_days order by week_number, day_number, id loop
    select count(*) filter (where setting = 'weight_room'), count(*) filter (where setting = 'field')
      into n_gym, n_field from public.user_program_day_exercises where program_day_id = d.id;
    base := regexp_replace(coalesce(d.title, ''), '^(Gym|Field): ', '');

    native := case
      when d.template in ('lower_strength', 'upper_strength', 'full_strength') then 'weight_room'::public.training_setting
      when d.template is null and d.category = 'strength' then 'weight_room'::public.training_setting
      else 'field'::public.training_setting
    end;

    if n_gym > 0 and n_field > 0 then
      -- a mixed day becomes two rows on the same week/day; the original row keeps the day's native track
      other := case native when 'field' then 'weight_room'::public.training_setting else 'field'::public.training_setting end;
      update public.user_program_days
         set setting = native,
             title = (case native when 'field' then 'Field: ' else 'Gym: ' end) || coalesce(nullif(base, ''), 'Session'),
             est_minutes = greatest(5, round(coalesce(est_minutes, 60) * (case native when 'weight_room' then n_gym else n_field end)::numeric / (n_gym + n_field))::int)
       where id = d.id;

      insert into public.user_program_days (
        program_id, user_id, week_number, day_number, plan_id, workout_id, category, intensity, volume_pct,
        title, deload, template, focus, attribute_profile, patterns, why_note, note, est_minutes, setting
      ) values (
        d.program_id, d.user_id, d.week_number, d.day_number, d.plan_id, d.workout_id, d.category, d.intensity, d.volume_pct,
        case
          when d.template = 'power' then 'Gym: Power'
          when other = 'field' then 'Field: Finisher'
          else 'Gym: Finisher'
        end,
        d.deload,
        case
          when d.template = 'power' then 'gym_power'
          when other = 'field' then 'conditioning'
          else 'full_strength'
        end,
        d.focus, d.attribute_profile, '{}', null, d.note,
        greatest(5, round(coalesce(d.est_minutes, 60) * (case other when 'weight_room' then n_gym else n_field end)::numeric / (n_gym + n_field))::int),
        other
      ) returning id into new_id;

      -- move the other environment's exercises over and renumber both rows from 0
      update public.user_program_day_exercises set program_day_id = new_id where program_day_id = d.id and setting = other;
      update public.user_program_day_exercises x set order_index = 1000 + r.rn
        from (select id, row_number() over (order by order_index, id) as rn from public.user_program_day_exercises where program_day_id in (d.id, new_id)) r
       where x.id = r.id;
      update public.user_program_day_exercises x set order_index = r.rn
        from (select id, row_number() over (partition by program_day_id order by order_index, id) - 1 as rn from public.user_program_day_exercises where program_day_id in (d.id, new_id)) r
       where x.id = r.id;
      update public.user_program_days set patterns = coalesce((
          select array_agg(distinct e.movement_pattern) from public.user_program_day_exercises x join public.exercises e on e.id = x.exercise_id
           where x.program_day_id = d.id and e.movement_pattern is not null), '{}') where id = d.id;
      update public.user_program_days set patterns = coalesce((
          select array_agg(distinct e.movement_pattern) from public.user_program_day_exercises x join public.exercises e on e.id = x.exercise_id
           where x.program_day_id = new_id and e.movement_pattern is not null), '{}') where id = new_id;

      -- logs follow their session; a log with no setting stays on the gym row
      gym_row := case native when 'weight_room' then d.id else new_id end;
      update public.progress_logs set program_day_id = new_id where program_day_id = d.id and setting = other;
      update public.progress_logs set program_day_id = gym_row where program_day_id = d.id and setting is null;
    else
      update public.user_program_days
         set setting = case when n_gym > 0 then 'weight_room'::public.training_setting when n_field > 0 then 'field'::public.training_setting else native end,
             title = (case when n_gym > 0 then 'Gym: ' when n_field > 0 then 'Field: ' when native = 'weight_room' then 'Gym: ' else 'Field: ' end) || coalesce(nullif(base, ''), 'Session')
       where id = d.id;
    end if;
  end loop;

  -- logs written for a recovery session now belong to the field track they were moved to
  update public.progress_logs set setting = 'field' where setting = 'recovery';

  if (select count(*) from public.user_program_day_exercises) <> before_ex then raise exception 'exercise rows changed during the split'; end if;
  if (select count(*) from public.progress_logs) <> before_logs then raise exception 'log rows changed during the split'; end if;
  if (select count(*) from public.user_program_days) < before_days then raise exception 'days were lost during the split'; end if;
end $$;

alter table public.user_program_days alter column setting set not null;
alter table public.user_program_days add constraint user_program_days_setting_track check (setting in ('weight_room', 'field'));
alter table public.user_program_days add constraint user_program_days_program_week_day_setting_key unique (program_id, week_number, day_number, setting);

-- a session holds only its own environment's exercises, enforced at the database
alter table public.user_program_day_exercises drop constraint if exists user_program_day_exercises_setting_resolved;
alter table public.user_program_day_exercises add constraint user_program_day_exercises_setting_track check (setting in ('weight_room', 'field'));

create or replace function public.check_day_exercise_setting() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.setting is distinct from (select setting from public.user_program_days where id = new.program_day_id) then
    raise exception 'A % session cannot hold % work', (select setting from public.user_program_days where id = new.program_day_id), new.setting;
  end if;
  return new;
end $$;

create constraint trigger user_program_day_exercises_track_match
  after insert or update of setting, program_day_id on public.user_program_day_exercises
  deferrable initially deferred
  for each row execute function public.check_day_exercise_setting();

do $$
begin
  if exists (select 1 from public.user_program_day_exercises x join public.user_program_days d on d.id = x.program_day_id where x.setting <> d.setting) then
    raise exception 'a day still mixes gym and field exercises';
  end if;
  if exists (select 1 from public.user_program_day_exercises x join public.exercises e on e.id = x.exercise_id where e.movement_pattern = 'plyometric' and x.setting <> 'field') then
    raise exception 'a plyometric is still in a gym session';
  end if;
end $$;

-- 5. Atomic writers now carry the day's setting (security-invoker, fixed search_path)
create or replace function public.replace_program_days(p_program_id uuid, p_from_date date, p_days jsonb)
returns integer
language plpgsql
set search_path = public
as $$
declare
  prog public.user_programs%rowtype;
  d jsonb;
  e jsonb;
  new_day uuid;
  n int := 0;
begin
  select * into prog from public.user_programs where id = p_program_id and user_id = auth.uid();
  if not found then
    raise exception 'Program not found';
  end if;
  if p_days is null or jsonb_typeof(p_days) <> 'array' then
    raise exception 'p_days must be a JSON array';
  end if;
  if jsonb_array_length(p_days) > 200 then
    raise exception 'Too many days in one program write';
  end if;

  delete from public.user_program_days x
  where x.program_id = p_program_id
    and x.user_id = auth.uid()
    and (prog.started_on + ((x.week_number - 1) * 7)
         + ((x.day_number - extract(isodow from prog.started_on)::int + 7) % 7)) >= p_from_date
    and not exists (select 1 from public.progress_logs l where l.program_day_id = x.id);

  for d in select * from jsonb_array_elements(p_days) loop
    insert into public.user_program_days (
      program_id, user_id, week_number, day_number, category, intensity, volume_pct, title,
      template, focus, attribute_profile, patterns, why_note, note, est_minutes, deload, setting
    ) values (
      p_program_id, auth.uid(), (d->>'week_number')::int, (d->>'day_number')::int,
      (d->>'category')::public.module_category, (d->>'intensity')::public.intensity_level,
      (d->>'volume_pct')::int, d->>'title', d->>'template',
      (d->>'focus')::public.training_attribute, d->'attribute_profile',
      coalesce(array(select jsonb_array_elements_text(coalesce(d->'patterns', '[]'::jsonb)))::public.movement_pattern[], '{}'),
      nullif(d->>'why_note', ''), nullif(d->>'note', ''), nullif(d->>'est_minutes', '')::int,
      coalesce((d->>'deload')::boolean, false),
      (d->>'setting')::public.training_setting
    ) returning id into new_day;

    for e in select * from jsonb_array_elements(coalesce(d->'exercises', '[]'::jsonb)) loop
      insert into public.user_program_day_exercises (
        program_day_id, user_id, exercise_id, exercise_name, order_index, block, role,
        sets, reps, rest_seconds, target_weight, weight_unit, rx_note, setting
      ) values (
        new_day, auth.uid(), (e->>'exercise_id')::uuid, e->>'exercise_name', (e->>'order_index')::int,
        e->>'block', (e->>'role')::public.training_attribute, (e->>'sets')::int, e->>'reps',
        nullif(e->>'rest_seconds', '')::int, nullif(e->>'target_weight', '')::numeric,
        coalesce(nullif(e->>'weight_unit', ''), 'lb')::public.weight_unit, nullif(e->>'rx_note', ''),
        (d->>'setting')::public.training_setting
      );
    end loop;
    n := n + 1;
  end loop;
  return n;
end;
$$;

create or replace function public.replace_program_day(p_day_id uuid, p_day jsonb)
returns void
language plpgsql
set search_path = public
as $$
declare
  e jsonb;
  day_setting public.training_setting;
begin
  select setting into day_setting from public.user_program_days where id = p_day_id and user_id = auth.uid();
  if not found then
    raise exception 'Program day not found';
  end if;
  if exists (select 1 from public.progress_logs where program_day_id = p_day_id) then
    raise exception 'This session has already been started';
  end if;
  if p_day is null or jsonb_typeof(p_day) <> 'object' then
    raise exception 'p_day must be a JSON object';
  end if;

  -- the session keeps its track; only its content changes
  update public.user_program_days set
    category = (p_day->>'category')::public.module_category,
    intensity = (p_day->>'intensity')::public.intensity_level,
    volume_pct = (p_day->>'volume_pct')::int,
    title = p_day->>'title',
    template = p_day->>'template',
    focus = (p_day->>'focus')::public.training_attribute,
    attribute_profile = p_day->'attribute_profile',
    patterns = coalesce(array(select jsonb_array_elements_text(coalesce(p_day->'patterns', '[]'::jsonb)))::public.movement_pattern[], '{}'),
    why_note = nullif(p_day->>'why_note', ''),
    note = nullif(p_day->>'note', ''),
    est_minutes = nullif(p_day->>'est_minutes', '')::int,
    deload = coalesce((p_day->>'deload')::boolean, false)
  where id = p_day_id and user_id = auth.uid();

  delete from public.user_program_day_exercises where program_day_id = p_day_id and user_id = auth.uid();

  for e in select * from jsonb_array_elements(coalesce(p_day->'exercises', '[]'::jsonb)) loop
    insert into public.user_program_day_exercises (
      program_day_id, user_id, exercise_id, exercise_name, order_index, block, role,
      sets, reps, rest_seconds, target_weight, weight_unit, rx_note, setting
    ) values (
      p_day_id, auth.uid(), (e->>'exercise_id')::uuid, e->>'exercise_name', (e->>'order_index')::int,
      e->>'block', (e->>'role')::public.training_attribute, (e->>'sets')::int, e->>'reps',
      nullif(e->>'rest_seconds', '')::int, nullif(e->>'target_weight', '')::numeric,
      coalesce(nullif(e->>'weight_unit', ''), 'lb')::public.weight_unit, nullif(e->>'rx_note', ''),
      day_setting
    );
  end loop;
end;
$$;
