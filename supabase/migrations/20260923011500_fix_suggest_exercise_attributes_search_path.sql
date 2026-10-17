-- Pin search_path on the new function (matches the flagged pre-existing pattern
-- on set_updated_at, addressed here since this migration touches the function anyway).
alter function public.suggest_exercise_attributes(text, text[]) set search_path = public;
