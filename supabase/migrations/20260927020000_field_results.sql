-- Field work is scored by time. Additive: one nullable column, no existing rows touched.
alter table public.exercise_logs
  add column if not exists result_seconds numeric(7,2) check (result_seconds is null or result_seconds > 0);
