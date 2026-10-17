-- Rotational power (med-ball throws, chops, arm care) is only relevant to positions
-- that throw or swing; it is an opt-in flag on the position's needs profile so admins
-- can enable it for any position, not a hard-coded list.
alter table public.position_needs_profiles
  add column rotational boolean not null default false;
update public.position_needs_profiles n set rotational = true
from public.positions p join public.sports s on s.id = p.sport_id
where n.position_id = p.id
  and (s.slug, p.slug) in (
    ('baseball', 'pitcher'), ('baseball', 'infielder'), ('baseball', 'outfielder'), ('football', 'quarterback')
  );
