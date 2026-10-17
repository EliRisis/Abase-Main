-- The original prevent_role_self_escalation() blocked ANY role change where
-- is_admin() was false — but is_admin() depends on auth.uid(), which is NULL
-- both for direct Postgres access (SQL Editor, migrations) and for requests
-- made with the service_role key. That silently reverted the exact "promote
-- a user to admin via SQL" workflow documented in the README.
--
-- Fix: only enforce the block when there's an actual authenticated end-user
-- JWT context (auth.uid() is not null) — i.e. a signed-in athlete trying to
-- self-escalate via the client SDK. Direct database access (SQL Editor,
-- migrations) and the service_role key are already a fully trusted context
-- by definition, so they're exempt.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;
