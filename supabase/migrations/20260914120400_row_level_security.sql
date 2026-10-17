-- Enable RLS everywhere.
alter table public.sports enable row level security;
alter table public.positions enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.plans enable row level security;
alter table public.plan_workouts enable row level security;
alter table public.profiles enable row level security;
alter table public.user_plans enable row level security;
alter table public.progress_logs enable row level security;
alter table public.exercise_logs enable row level security;
-- ---------------------------------------------------------------------------
-- Content library: publicly readable, admin-only writes.
-- ---------------------------------------------------------------------------

create policy "sports_select_all" on public.sports for select using (true);
create policy "sports_admin_insert" on public.sports for insert with check (public.is_admin());
create policy "sports_admin_update" on public.sports for update using (public.is_admin()) with check (public.is_admin());
create policy "sports_admin_delete" on public.sports for delete using (public.is_admin());
create policy "positions_select_all" on public.positions for select using (true);
create policy "positions_admin_insert" on public.positions for insert with check (public.is_admin());
create policy "positions_admin_update" on public.positions for update using (public.is_admin()) with check (public.is_admin());
create policy "positions_admin_delete" on public.positions for delete using (public.is_admin());
create policy "exercises_select_all" on public.exercises for select using (true);
create policy "exercises_admin_insert" on public.exercises for insert with check (public.is_admin());
create policy "exercises_admin_update" on public.exercises for update using (public.is_admin()) with check (public.is_admin());
create policy "exercises_admin_delete" on public.exercises for delete using (public.is_admin());
create policy "workouts_select_all" on public.workouts for select using (true);
create policy "workouts_admin_insert" on public.workouts for insert with check (public.is_admin());
create policy "workouts_admin_update" on public.workouts for update using (public.is_admin()) with check (public.is_admin());
create policy "workouts_admin_delete" on public.workouts for delete using (public.is_admin());
create policy "workout_exercises_select_all" on public.workout_exercises for select using (true);
create policy "workout_exercises_admin_insert" on public.workout_exercises for insert with check (public.is_admin());
create policy "workout_exercises_admin_update" on public.workout_exercises for update using (public.is_admin()) with check (public.is_admin());
create policy "workout_exercises_admin_delete" on public.workout_exercises for delete using (public.is_admin());
-- Plans: published plans are public; drafts are admin-only.
create policy "plans_select_published_or_admin" on public.plans
  for select using (published = true or public.is_admin());
create policy "plans_admin_insert" on public.plans for insert with check (public.is_admin());
create policy "plans_admin_update" on public.plans for update using (public.is_admin()) with check (public.is_admin());
create policy "plans_admin_delete" on public.plans for delete using (public.is_admin());
create policy "plan_workouts_select_all" on public.plan_workouts for select using (true);
create policy "plan_workouts_admin_insert" on public.plan_workouts for insert with check (public.is_admin());
create policy "plan_workouts_admin_update" on public.plan_workouts for update using (public.is_admin()) with check (public.is_admin());
create policy "plan_workouts_admin_delete" on public.plan_workouts for delete using (public.is_admin());
-- ---------------------------------------------------------------------------
-- User data: an athlete can only read/write their own rows.
-- ---------------------------------------------------------------------------

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "user_plans_select_own" on public.user_plans
  for select using (auth.uid() = user_id);
create policy "user_plans_insert_own" on public.user_plans
  for insert with check (auth.uid() = user_id);
create policy "user_plans_update_own" on public.user_plans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_plans_delete_own" on public.user_plans
  for delete using (auth.uid() = user_id);
create policy "progress_logs_select_own" on public.progress_logs
  for select using (auth.uid() = user_id);
create policy "progress_logs_insert_own" on public.progress_logs
  for insert with check (auth.uid() = user_id);
create policy "progress_logs_update_own" on public.progress_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_logs_delete_own" on public.progress_logs
  for delete using (auth.uid() = user_id);
create policy "exercise_logs_select_own" on public.exercise_logs
  for select using (auth.uid() = user_id);
create policy "exercise_logs_insert_own" on public.exercise_logs
  for insert with check (auth.uid() = user_id);
create policy "exercise_logs_update_own" on public.exercise_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exercise_logs_delete_own" on public.exercise_logs
  for delete using (auth.uid() = user_id);
