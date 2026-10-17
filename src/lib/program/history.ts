// Exercise history -> next-load suggestions (progressive overload). Reads go through the
// caller's client, so RLS limits everything to the athlete's own logs.
import type { MovementPattern, PrescriptionMode, SessionFeedback } from "../database.types";
import type { Client } from "./data";
import { groupHistory, LOWER_BODY_PATTERNS, MAX_SEEDS, suggestNextLoad, type LoadSuggestion, type SessionHistory } from "./overload";

export async function loadExerciseHistory(supabase: Client, userId: string, exerciseIds: string[]): Promise<Map<string, SessionHistory[]>> {
  const out = new Map<string, SessionHistory[]>();
  if (exerciseIds.length === 0) return out;
  const { data } = await supabase
    .from("exercise_logs")
    .select("progress_log_id, exercise_id, reps_completed, weight, weight_unit, completed, created_at, log:progress_logs(feedback)")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds)
    .eq("completed", true)
    .not("weight", "is", null)
    .order("created_at", { ascending: false })
    .limit(3000);
  const byExercise = new Map<string, NonNullable<typeof data>>();
  for (const r of data ?? []) {
    if (!r.exercise_id) continue;
    const list = byExercise.get(r.exercise_id) ?? [];
    list.push(r);
    byExercise.set(r.exercise_id, list);
  }
  for (const [id, rows] of byExercise) {
    out.set(
      id,
      groupHistory(
        rows.map((r) => ({
          progress_log_id: r.progress_log_id,
          date: r.created_at.slice(0, 10),
          reps_completed: r.reps_completed,
          weight: r.weight,
          completed: r.completed,
          weight_unit: r.weight_unit,
          feedback: (r.log as unknown as { feedback: SessionFeedback | null } | null)?.feedback ?? null,
        })),
      ),
    );
  }
  return out;
}

/** Best tested value per higher-is-better metric slug (used to seed a first prescription). */
export async function loadTestedMaxes(supabase: Client, userId: string): Promise<Map<string, number>> {
  const [{ data: defs }, { data: logs }] = await Promise.all([
    supabase.from("metric_definitions").select("id, slug, direction").eq("direction", "higher_is_better"),
    supabase.from("metric_logs").select("metric_id, value").eq("user_id", userId).limit(2000),
  ]);
  const slugById = new Map((defs ?? []).map((d) => [d.id, d.slug]));
  const out = new Map<string, number>();
  for (const l of logs ?? []) {
    const slug = slugById.get(l.metric_id);
    if (slug) out.set(slug, Math.max(out.get(slug) ?? 0, Number(l.value)));
  }
  return out;
}

export interface LoadRow {
  exerciseId: string;
  slug: string;
  mode: PrescriptionMode;
  pattern: MovementPattern | null;
  sets: number;
  reps: string;
  loadPct: number | null;
}

/** Suggested weight for every loaded exercise in `rows`. Non-loaded movements have no weight target. */
export async function resolveLoads(supabase: Client, userId: string, rows: LoadRow[], today: string): Promise<Map<string, LoadSuggestion>> {
  const loaded = rows.filter((r) => r.mode === "loaded");
  const out = new Map<string, LoadSuggestion>();
  if (loaded.length === 0) return out;
  const [history, maxes] = await Promise.all([
    loadExerciseHistory(supabase, userId, loaded.map((r) => r.exerciseId)),
    loadTestedMaxes(supabase, userId),
  ]);
  for (const r of loaded) {
    const seedDef = MAX_SEEDS[r.slug];
    const max = seedDef ? maxes.get(seedDef.metric) : undefined;
    out.set(
      r.exerciseId,
      suggestNextLoad({
        history: history.get(r.exerciseId) ?? [],
        prescribedReps: r.reps,
        prescribedSets: r.sets,
        lowerBody: !!r.pattern && LOWER_BODY_PATTERNS.has(r.pattern),
        today,
        seed: max && seedDef && r.loadPct ? { oneRepMax: max * seedDef.factor, loadPct: r.loadPct } : null,
      }),
    );
  }
  return out;
}
