-- Content library tables: sports, positions, exercises, workouts, plans.
-- All readable by anyone; writable only by admins (see RLS migration).

create table public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (sport_id, slug)
);
create index positions_sport_id_idx on public.positions(sport_id);
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  video_url text,
  image_url text,
  muscle_groups text[] not null default '{}',
  equipment text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sport_id uuid references public.sports(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  level public.experience_level,
  estimated_minutes int,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workouts_sport_id_idx on public.workouts(sport_id);
create index workouts_position_id_idx on public.workouts(position_id);
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  order_index int not null,
  sets int not null check (sets > 0),
  reps text not null,
  rest_seconds int check (rest_seconds is null or rest_seconds >= 0),
  notes text,
  unique (workout_id, order_index)
);
create index workout_exercises_workout_id_idx on public.workout_exercises(workout_id);
create index workout_exercises_exercise_id_idx on public.workout_exercises(exercise_id);
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sport_id uuid references public.sports(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  level public.experience_level,
  weeks int not null check (weeks > 0),
  days_per_week int not null check (days_per_week > 0 and days_per_week <= 7),
  cover_image_url text,
  published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plans_sport_id_idx on public.plans(sport_id);
create index plans_position_id_idx on public.plans(position_id);
create index plans_published_idx on public.plans(published);
create table public.plan_workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete restrict,
  week_number int not null check (week_number > 0),
  day_number int not null check (day_number between 1 and 7),
  title text,
  unique (plan_id, week_number, day_number)
);
create index plan_workouts_plan_id_idx on public.plan_workouts(plan_id);
create index plan_workouts_workout_id_idx on public.plan_workouts(workout_id);
