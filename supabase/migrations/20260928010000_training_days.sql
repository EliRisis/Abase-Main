-- Which weekdays an athlete trains on. `days_per_week` used to be the only stored signal, so the
-- generator picked the weekdays itself and the pattern drifted week to week. `training_days` is the
-- explicit ISO-weekday set (1=Mon..7=Sun), unique and ascending; `days_per_week` stays in sync as its
-- count so nothing that reads it breaks. Stored on `profiles` (the standing preference) and on
-- `user_programs` (a snapshot of what that block was built with, same idea as `days_per_week` today).

alter table public.profiles add column if not exists training_days smallint[];
alter table public.user_programs add column if not exists training_days smallint[];

-- A plain CHECK can't run a subquery, so "sorted and unique" is a tiny loop instead: strictly
-- ascending implies both at once.
create or replace function public.is_ascending_unique_days(days smallint[]) returns boolean
language plpgsql immutable as $$
declare
  i integer;
begin
  if days is null then return true; end if;
  for i in 1 .. coalesce(array_length(days, 1), 0) - 1 loop
    if days[i] >= days[i + 1] then return false; end if;
  end loop;
  return true;
end;
$$;

alter table public.profiles
  add constraint profiles_training_days_shape check (
    training_days is null or (
      cardinality(training_days) between 1 and 7
      and training_days <@ array[1,2,3,4,5,6,7]::smallint[]
      and public.is_ascending_unique_days(training_days)
    )
  );
alter table public.user_programs
  add constraint user_programs_training_days_shape check (
    training_days is null or (
      cardinality(training_days) between 1 and 7
      and training_days <@ array[1,2,3,4,5,6,7]::smallint[]
      and public.is_ascending_unique_days(training_days)
    )
  );

-- Backfill from the same preselected spread the app now shows for each day count, so existing
-- profiles and the active program keep training on a sensible, immediately-consistent pattern.
create or replace function pg_temp.default_training_days(n integer) returns smallint[]
language sql immutable as $$
  select case greatest(2, least(6, n))
    when 2 then array[2,5]::smallint[]
    when 3 then array[1,3,5]::smallint[]
    when 4 then array[1,2,4,5]::smallint[]
    when 5 then array[1,2,3,5,6]::smallint[]
    else array[1,2,3,4,5,6]::smallint[]
  end;
$$;

update public.profiles
  set training_days = pg_temp.default_training_days(days_per_week)
  where training_days is null and days_per_week is not null;

update public.user_programs
  set training_days = pg_temp.default_training_days(days_per_week)
  where training_days is null and days_per_week is not null;

-- Reassigning several sessions' day_number in one week can transiently reuse a weekday another
-- movable row hasn't vacated yet; deferring the check to commit (set_training_days below turns this
-- on for its own transaction only) lets the whole week's reshuffle land atomically.
alter table public.user_program_days drop constraint user_program_days_program_week_day_setting_key;
alter table public.user_program_days
  add constraint user_program_days_program_week_day_setting_key
  unique (program_id, week_number, day_number, setting) deferrable initially immediate;

-- ---------------------------------------------------------------------------------------------
-- Edit days: reschedule the active program's still-upcoming sessions onto a new weekday pattern.
-- Content and order are kept; only `day_number` (and, when a track now has fewer days than it did,
-- whether the row survives at all) changes. Sessions that are done, started, or already in the past
-- are never touched. `p_today` is the athlete's calendar date (their timezone), computed the same way
-- as everywhere else in the app, since SQL has no notion of the athlete's timezone.
create or replace function public.set_training_days(p_training_days smallint[], p_today date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_days smallint[];
  v_prog record;
  v_pair record;
  v_locked smallint[];
  v_available smallint[];
  v_moving uuid[];
  v_new smallint[];
  v_take integer;
  i integer;
begin
  v_days := array(select distinct unnest(p_training_days) order by 1);
  if v_days is null or cardinality(v_days) < 1 or cardinality(v_days) > 7 or not (v_days <@ array[1,2,3,4,5,6,7]::smallint[]) then
    raise exception 'Pick between 1 and 7 valid training days';
  end if;

  set constraints public.user_program_days_program_week_day_setting_key deferred;
  update public.profiles set training_days = v_days where id = auth.uid();

  select * into v_prog from public.user_programs where user_id = auth.uid() and status = 'active';
  if not found then
    return; -- no running program: the preference is saved for next time it's built
  end if;
  update public.user_programs set training_days = v_days where id = v_prog.id;

  for v_pair in
    select distinct d.week_number, d.setting
    from public.user_program_days d
    where d.program_id = v_prog.id
      and (v_prog.started_on + ((d.week_number - 1) * 7) + ((d.day_number - extract(isodow from v_prog.started_on)::int + 7) % 7)) >= p_today
      and not exists (select 1 from public.progress_logs l where l.program_day_id = d.id)
  loop
    -- days this week+track that are locked (past or logged) keep their slot; movable ones fill the rest
    select coalesce(array_agg(d.day_number), array[]::smallint[]) into v_locked
      from public.user_program_days d
      where d.program_id = v_prog.id and d.week_number = v_pair.week_number and d.setting = v_pair.setting
        and ((v_prog.started_on + ((d.week_number - 1) * 7) + ((d.day_number - extract(isodow from v_prog.started_on)::int + 7) % 7)) < p_today
             or exists (select 1 from public.progress_logs l where l.program_day_id = d.id));

    select coalesce(array_agg(d.id order by d.day_number), array[]::uuid[]) into v_moving
      from public.user_program_days d
      where d.program_id = v_prog.id and d.week_number = v_pair.week_number and d.setting = v_pair.setting
        and (v_prog.started_on + ((d.week_number - 1) * 7) + ((d.day_number - extract(isodow from v_prog.started_on)::int + 7) % 7)) >= p_today
        and not exists (select 1 from public.progress_logs l where l.program_day_id = d.id);

    select array(select x from unnest(v_days) x where x <> all (v_locked)) into v_available;

    v_take := least(cardinality(v_moving), cardinality(v_available));
    if v_take > 0 then
      v_new := v_available[1:v_take];
      -- reassign day_number highest-first so a moved value never collides with one not yet moved
      for i in reverse v_take..1 loop
        update public.user_program_days set day_number = v_new[i] where id = v_moving[i];
      end loop;
    end if;
    if cardinality(v_moving) > v_take then
      delete from public.user_program_days where id = any (v_moving[v_take + 1 : cardinality(v_moving)]);
    end if;
  end loop;
end;
$$;
