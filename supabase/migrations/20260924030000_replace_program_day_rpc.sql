-- Atomically swap ONE program day's session (e.g. the athlete accepted a lighter swap
-- from the readiness notice). SECURITY INVOKER: RLS applies to every statement. A day
-- that already has a progress log is never modified.
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
      sets, reps, rest_seconds, target_weight, weight_unit, rx_note
    ) values (
      p_day_id, auth.uid(), (e->>'exercise_id')::uuid, e->>'exercise_name', (e->>'order_index')::int,
      e->>'block', (e->>'role')::public.training_attribute, (e->>'sets')::int, e->>'reps',
      nullif(e->>'rest_seconds', '')::int, nullif(e->>'target_weight', '')::numeric,
      coalesce(nullif(e->>'weight_unit', ''), 'lb')::public.weight_unit, nullif(e->>'rx_note', '')
    );
  end loop;
end;
$$;
revoke all on function public.replace_program_day(uuid, jsonb) from public, anon;
grant execute on function public.replace_program_day(uuid, jsonb) to authenticated;
