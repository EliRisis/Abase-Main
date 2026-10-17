-- Narrow advanced-only exercises to the genuinely high-skill / high-impact ones. Deadlifts,
-- push press, trap-bar jumps etc. are normal intermediate lifts; gating them left
-- intermediate athletes (the default) with too little heavy strength and power work.
update public.exercises set min_level = 'intermediate'
where slug in ('conventional-deadlift','push-press','trap-bar-jump','turkish-get-up','single-leg-bound','ab-wheel-rollout');
do $$
declare n int;
begin
  select count(*) into n from public.exercises where min_level = 'advanced';
  if n <> 4 then raise exception 'expected 4 advanced-only exercises, got %', n; end if;
end $$;
