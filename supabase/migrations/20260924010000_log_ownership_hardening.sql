-- Hardening for the smart-matching upgrade. Additive only: no rows are touched.
--
-- exercise_logs / progress_logs previously only checked `auth.uid() = user_id`
-- on write, so an athlete could point a new row at ANOTHER athlete's progress
-- log, program day, program-day exercise or enrollment. They could never read
-- that row back (SELECT is own-rows-only), but they could pollute someone
-- else's history. Writes now must reference rows the athlete owns.

drop policy if exists "exercise_logs_insert_own" on public.exercise_logs;
drop policy if exists "exercise_logs_update_own" on public.exercise_logs;
create policy "exercise_logs_insert_own" on public.exercise_logs
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.progress_logs p where p.id = progress_log_id and p.user_id = auth.uid())
    and (program_day_exercise_id is null or exists (
      select 1 from public.user_program_day_exercises x where x.id = program_day_exercise_id and x.user_id = auth.uid()))
  );
create policy "exercise_logs_update_own" on public.exercise_logs
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.progress_logs p where p.id = progress_log_id and p.user_id = auth.uid())
    and (program_day_exercise_id is null or exists (
      select 1 from public.user_program_day_exercises x where x.id = program_day_exercise_id and x.user_id = auth.uid()))
  );
drop policy if exists "progress_logs_insert_own" on public.progress_logs;
drop policy if exists "progress_logs_update_own" on public.progress_logs;
create policy "progress_logs_insert_own" on public.progress_logs
  for insert with check (
    auth.uid() = user_id
    and (program_day_id is null or exists (
      select 1 from public.user_program_days d where d.id = program_day_id and d.user_id = auth.uid()))
    and (user_plan_id is null or exists (
      select 1 from public.user_plans u where u.id = user_plan_id and u.user_id = auth.uid()))
  );
create policy "progress_logs_update_own" on public.progress_logs
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (program_day_id is null or exists (
      select 1 from public.user_program_days d where d.id = program_day_id and d.user_id = auth.uid()))
    and (user_plan_id is null or exists (
      select 1 from public.user_plans u where u.id = user_plan_id and u.user_id = auth.uid()))
  );
-- Readiness reads "everything the athlete completed in the last few days".
create index if not exists progress_logs_user_completed_desc_idx
  on public.progress_logs (user_id, completed_at desc) where completed_at is not null;
-- Program-day lookups by date window during rebuilds.
create index if not exists user_program_days_user_program_idx
  on public.user_program_days (user_id, program_id);
