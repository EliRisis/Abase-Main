-- profiles: 1:1 extension of auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'athlete',
  sport_id uuid references public.sports(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  level public.experience_level,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
-- user_plans: an athlete's enrollment in a plan
create table public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  status public.enrollment_status not null default 'active',
  current_week int not null default 1 check (current_week > 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, plan_id)
);
create index user_plans_user_id_idx on public.user_plans(user_id);
-- Only one active plan per athlete at a time.
create unique index user_plans_one_active_per_user
  on public.user_plans(user_id)
  where (status = 'active');
-- progress_logs: one row per (athlete, scheduled workout) attempt/completion
create table public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_plan_id uuid references public.user_plans(id) on delete cascade,
  plan_workout_id uuid references public.plan_workouts(id) on delete set null,
  workout_id uuid references public.workouts(id) on delete set null,
  week_number int,
  day_number int,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index progress_logs_user_id_idx on public.progress_logs(user_id);
create index progress_logs_user_plan_id_idx on public.progress_logs(user_plan_id);
create index progress_logs_completed_at_idx on public.progress_logs(user_id, completed_at);
-- exercise_logs: actual weight/reps logged per set within a progress_log
create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  progress_log_id uuid not null references public.progress_logs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_exercise_id uuid references public.workout_exercises(id) on delete set null,
  exercise_id uuid references public.exercises(id) on delete set null,
  set_number int not null check (set_number > 0),
  reps_completed int check (reps_completed is null or reps_completed >= 0),
  weight numeric(6, 1) check (weight is null or weight >= 0),
  weight_unit public.weight_unit not null default 'lb',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (progress_log_id, workout_exercise_id, set_number)
);
create index exercise_logs_progress_log_id_idx on public.exercise_logs(progress_log_id);
create index exercise_logs_user_id_idx on public.exercise_logs(user_id);
