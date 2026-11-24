-- The app draws each sport from its slug (public/icons/sports/<slug>.png) and nothing reads `sports.icon`
-- for display. The column held emoji from the original seed. Clear the values, keep the column.
update public.sports set icon = null where icon is not null;

do $$
begin
  if exists (select 1 from public.sports where icon is not null) then
    raise exception 'sports.icon was not cleared';
  end if;
  if (select count(*) from public.sports) <> 4 then
    raise exception 'unexpected sports row count: the migration must not add or remove sports';
  end if;
end $$;
