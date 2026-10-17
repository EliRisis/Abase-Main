-- A recovery / mobility day is neither a weight-room nor a field session. Its own kind, so it can
-- be labelled and laid out on its own. (Separate migration: a new enum value cannot be used in
-- the transaction that adds it.)
alter type public.training_setting add value if not exists 'recovery';
