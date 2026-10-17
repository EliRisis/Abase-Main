-- is_admin(): used inside RLS policies to grant admins write access to the
-- content library. SECURITY DEFINER so it can read `profiles` regardless of
-- the caller's own RLS visibility (avoids recursive policy evaluation).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
-- Generic updated_at maintenance.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workouts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
-- Prevent an athlete from granting themselves the admin role via a profile
-- update. Only an existing admin can change `role`.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();
-- Keep user_plans.status/completed_at in sync and stamp progress_logs.
create or replace function public.mark_plan_completed_if_done()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.completed_at is not null and old.completed_at is null then
    update public.user_plans
    set current_week = greatest(current_week, coalesce(new.week_number, current_week))
    where id = new.user_plan_id;
  end if;
  return new;
end;
$$;
create trigger progress_logs_advance_week
  after update on public.progress_logs
  for each row execute function public.mark_plan_completed_if_done();
