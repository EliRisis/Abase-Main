-- Weight Room vs Field/Conditioning. Every exercise gets the setting it is done in; an
-- assembled day is stored as (up to) two separate sessions, and every logged session records
-- which one it was. Additive: new columns + backfill of those new columns only.

create type public.training_setting as enum ('weight_room', 'field', 'either');
comment on type public.training_setting is 'weight_room = gym floor with equipment; field = field/track/turf and conditioning; either = mobility/core that goes with whichever session it is in.';
-- 1. exercises -----------------------------------------------------------------------
alter table public.exercises add column setting public.training_setting not null default 'field';
update public.exercises set setting = case
  when movement_pattern = 'mobility' then 'either'::public.training_setting
  when prescription_mode = 'loaded' then 'weight_room'::public.training_setting
  when equipment in ('Barbell','Dumbbell','Dumbbells','Light Dumbbell','Light Dumbbells','Kettlebell','Cable','Cable/Band',
                     'Trap Bar','Landmine','Pull-Up Bar','Dip Bars','Bench','Ab Wheel','Plyo Box','Medicine Ball',
                     'Sliders','Partner/Anchor','Resistance Band') then 'weight_room'::public.training_setting
  when movement_pattern in ('upper_push','upper_pull','squat','hinge','single_leg','carry') then 'weight_room'::public.training_setting
  when movement_pattern = 'core' and prescription_mode in ('hold','bodyweight') then 'either'::public.training_setting
  when movement_pattern is null then 'either'::public.training_setting
  else 'field'::public.training_setting
end;
do $$
declare w int; f int; e int;
begin
  select count(*) filter (where setting='weight_room'), count(*) filter (where setting='field'), count(*) filter (where setting='either')
    into w, f, e from public.exercises;
  if w < 40 or f < 35 or e < 10 then raise exception 'setting backfill looks wrong: weight_room % field % either %', w, f, e; end if;
end $$;
-- 2. scheduled exercises carry the session they belong to ---------------------------------
alter table public.user_program_day_exercises add column setting public.training_setting;
-- Existing rows: resolve 'either' to the day's weight-room session when it has one, else field.
update public.user_program_day_exercises x set setting = case
  when e.setting <> 'either' then e.setting
  when exists (
    select 1 from public.user_program_day_exercises y join public.exercises ey on ey.id = y.exercise_id
    where y.program_day_id = x.program_day_id and ey.setting = 'weight_room'
  ) and x.block <> 'warmup' then 'weight_room'::public.training_setting
  else 'field'::public.training_setting
end
from public.exercises e
where e.id = x.exercise_id;
update public.user_program_day_exercises set setting = 'field' where setting is null;
alter table public.user_program_day_exercises
  alter column setting set not null,
  add constraint user_program_day_exercises_setting_resolved check (setting <> 'either');
-- 3. a logged session records which session it was (null = the whole workout, legacy) ----
alter table public.progress_logs
  add column setting public.training_setting check (setting is null or setting <> 'either');
-- 4. blocks: when they were archived (they stay visible in history) ---------------------
alter table public.user_programs add column archived_at timestamptz;
update public.user_programs set archived_at = created_at where status = 'archived' and archived_at is null;
-- 5. program writes carry the setting ------------------------------------------------------
create or replace function public.replace_program_days(p_program_id uuid, p_from_date date, p_days jsonb)
returns int
language plpgsql
security invoker
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
  if jsonb_array_length(p_days) > 100 then
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
      template, focus, attribute_profile, patterns, why_note, note, est_minutes, deload
    ) values (
      p_program_id, auth.uid(), (d->>'week_number')::int, (d->>'day_number')::int,
      (d->>'category')::public.module_category, (d->>'intensity')::public.intensity_level,
      (d->>'volume_pct')::int, d->>'title', d->>'template',
      (d->>'focus')::public.training_attribute, d->'attribute_profile',
      coalesce(array(select jsonb_array_elements_text(coalesce(d->'patterns', '[]'::jsonb)))::public.movement_pattern[], '{}'),
      nullif(d->>'why_note', ''), nullif(d->>'note', ''), nullif(d->>'est_minutes', '')::int,
      coalesce((d->>'deload')::boolean, false)
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
        coalesce(nullif(e->>'setting', ''), 'field')::public.training_setting
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
security invoker
set search_path = public
as $$
declare
  e jsonb;
begin
  if not exists (select 1 from public.user_program_days where id = p_day_id and user_id = auth.uid()) then
    raise exception 'Program day not found';
  end if;
  if exists (select 1 from public.progress_logs where program_day_id = p_day_id) then
    raise exception 'This session has already been started';
  end if;
  if p_day is null or jsonb_typeof(p_day) <> 'object' then
    raise exception 'p_day must be a JSON object';
  end if;

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
      coalesce(nullif(e->>'setting', ''), 'field')::public.training_setting
    );
  end loop;
end;
$$;
revoke all on function public.replace_program_days(uuid, date, jsonb) from public, anon;
grant execute on function public.replace_program_days(uuid, date, jsonb) to authenticated;
revoke all on function public.replace_program_day(uuid, jsonb) from public, anon;
grant execute on function public.replace_program_day(uuid, jsonb) to authenticated;
