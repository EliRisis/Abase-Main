-- Atomic program writes. Generating or rebuilding a program deletes not-yet-started
-- days and inserts new days + their exercises. Doing that as separate REST calls
-- could leave an athlete with a half-written week if one call failed, so it runs in
-- one function call (one transaction).
--
-- SECURITY INVOKER: every statement still runs under the caller's RLS. The explicit
-- ownership check below just makes a wrong program id fail loudly instead of silently
-- affecting zero rows. Days that already have a progress log are never deleted.
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
        sets, reps, rest_seconds, target_weight, weight_unit, rx_note
      ) values (
        new_day, auth.uid(), (e->>'exercise_id')::uuid, e->>'exercise_name', (e->>'order_index')::int,
        e->>'block', (e->>'role')::public.training_attribute, (e->>'sets')::int, e->>'reps',
        nullif(e->>'rest_seconds', '')::int, nullif(e->>'target_weight', '')::numeric,
        coalesce(nullif(e->>'weight_unit', ''), 'lb')::public.weight_unit, nullif(e->>'rx_note', '')
      );
    end loop;
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.replace_program_days(uuid, date, jsonb) from public, anon;
grant execute on function public.replace_program_days(uuid, date, jsonb) to authenticated;
