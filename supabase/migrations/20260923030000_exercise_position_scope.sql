-- Position-specific drills: an exercise with rows here is only eligible for
-- those positions in the assembler; an exercise with no rows is universal.
create table public.exercise_positions (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  primary key (exercise_id, position_id)
);
create index exercise_positions_position_idx on public.exercise_positions (position_id);
alter table public.exercise_positions enable row level security;
create policy "exercise_positions_select_all" on public.exercise_positions for select using (true);
create policy "exercise_positions_admin_insert" on public.exercise_positions for insert with check (public.is_admin());
create policy "exercise_positions_admin_update" on public.exercise_positions for update using (public.is_admin()) with check (public.is_admin());
create policy "exercise_positions_admin_delete" on public.exercise_positions for delete using (public.is_admin());
insert into public.exercise_positions (exercise_id, position_id)
select e.id, p.id
from (values
  ('diving-save-progression', 'soccer', 'goalkeeper'),
  ('high-ball-jump-catch', 'soccer', 'goalkeeper'),
  ('high-ball-jump-catch', 'soccer', 'defender'),
  ('high-ball-jump-catch', 'football', 'wide-receiver'),
  ('five-step-drop-footwork', 'football', 'quarterback'),
  ('three-step-drop-footwork', 'football', 'quarterback'),
  ('pocket-slide-drill', 'football', 'quarterback'),
  ('drop-step-route-run', 'football', 'wide-receiver'),
  ('drop-step-drill', 'football', 'linebacker'),
  ('drop-step-drill', 'soccer', 'defender'),
  ('backpedal-break', 'football', 'linebacker'),
  ('backpedal-break', 'soccer', 'defender'),
  ('ground-ball-shuffle', 'baseball', 'infielder'),
  ('first-step-steal-start', 'baseball', 'infielder'),
  ('first-step-steal-start', 'baseball', 'outfielder'),
  ('closeout-drill', 'basketball', 'center'),
  ('closeout-drill', 'basketball', 'point-guard'),
  ('closeout-drill', 'basketball', 'shooting-guard'),
  ('defensive-slide-drill', 'basketball', 'center'),
  ('defensive-slide-drill', 'basketball', 'point-guard'),
  ('defensive-slide-drill', 'basketball', 'shooting-guard'),
  ('defensive-slide-drill', 'soccer', 'defender'),
  ('suicide-sprints', 'basketball', 'center'),
  ('suicide-sprints', 'basketball', 'point-guard'),
  ('suicide-sprints', 'basketball', 'shooting-guard'),
  ('three-point-start', 'football', 'offensive-lineman'),
  ('three-point-start', 'football', 'linebacker'),
  ('band-shoulder-warmup', 'baseball', 'pitcher'),
  ('band-shoulder-warmup', 'baseball', 'infielder'),
  ('band-shoulder-warmup', 'baseball', 'outfielder'),
  ('band-shoulder-warmup', 'football', 'quarterback'),
  ('sleeper-stretch', 'baseball', 'pitcher'),
  ('sleeper-stretch', 'baseball', 'infielder'),
  ('sleeper-stretch', 'baseball', 'outfielder'),
  ('sleeper-stretch', 'football', 'quarterback')
) as v(exercise_slug, sport_slug, position_slug)
join public.exercises e on e.slug = v.exercise_slug
join public.sports s on s.slug = v.sport_slug
join public.positions p on p.sport_id = s.id and p.slug = v.position_slug;
do $$
declare n int;
begin
  select count(*) into n from public.exercise_positions;
  if n <> 35 then raise exception 'expected 35 exercise/position scope rows, got %', n; end if;
end $$;
