-- Security hardening from the 2026-10-02 audit (item 1.9). Additive and reversible: only EXECUTE grants
-- and function search_path settings change. No table data is touched.
--
-- 1. Trigger-only SECURITY DEFINER functions were callable over /rest/v1/rpc by anon and signed-in users.
--    Triggers do not check EXECUTE on the invoking role, so revoking it is safe for the triggers themselves.
-- 2. `is_admin()` is intentionally left executable: RLS policies (e.g. plans_select_published_or_admin) call it
--    on behalf of anon and authenticated callers, and it only reports whether the caller is an admin.
-- 3. Pin search_path on the two functions the linter flagged.

revoke execute on function public.check_progress_log_program_day_owner() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.mark_plan_completed_if_done() from public, anon, authenticated;
revoke execute on function public.prevent_role_self_escalation() from public, anon, authenticated;
revoke execute on function public.validate_metric_log() from public, anon, authenticated;

alter function public.set_updated_at() set search_path = public;
alter function public.is_ascending_unique_days(smallint[]) set search_path = public;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'check_progress_log_program_day_owner', 'handle_new_user', 'mark_plan_completed_if_done',
    'prevent_role_self_escalation', 'validate_metric_log'
  ] loop
    if has_function_privilege('anon', 'public.' || fn || '()', 'execute')
       or has_function_privilege('authenticated', 'public.' || fn || '()', 'execute') then
      raise exception 'security hardening failed: % is still executable by anon/authenticated', fn;
    end if;
  end loop;
  if not has_function_privilege('anon', 'public.is_admin()', 'execute') then
    raise exception 'is_admin() must stay executable (RLS policies call it)';
  end if;
  if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('set_updated_at', 'is_ascending_unique_days') and p.proconfig is not null) <> 2 then
    raise exception 'search_path not pinned on both functions';
  end if;
end $$;
