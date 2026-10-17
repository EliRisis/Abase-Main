
-- Additional exercises needed to cover the new goal-specific workouts
-- below (sled work, arm-care, injury-prevention staples, reactive
-- agility, conditioning tools) that aren't in the existing 18-exercise
-- library. Reuses the existing library everywhere else.

insert into public.exercises (name, slug, muscle_groups, equipment) values
  ('Sled Push', 'sled-push', array['Quads','Glutes','Calves'], 'Sled'),
  ('Band External Rotation', 'band-external-rotation', array['Rotator Cuff','Shoulders'], 'Resistance Band'),
  ('Nordic Hamstring Curl', 'nordic-hamstring-curl', array['Hamstrings'], 'Partner/Anchor'),
  ('Copenhagen Plank', 'copenhagen-plank', array['Adductors','Core'], 'Bench'),
  ('Single-Leg Romanian Deadlift', 'single-leg-romanian-deadlift', array['Hamstrings','Glutes'], 'Dumbbells'),
  ('Depth Jump', 'depth-jump', array['Quads','Glutes','Calves'], 'Plyo Box'),
  ('Single-Leg Box Jump', 'single-leg-box-jump', array['Quads','Glutes'], 'Plyo Box'),
  ('Shuttle Run', 'shuttle-run', array['Quads','Hamstrings','Calves'], 'Cones'),
  ('Jump Rope', 'jump-rope', array['Calves','Shoulders'], 'Jump Rope'),
  ('Reactive Cone Sprint', 'reactive-cone-sprint', array['Quads','Hamstrings'], 'Cones');
;
