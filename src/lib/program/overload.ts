// Progressive overload: turns an athlete's logged sets into the next target
// weight for an exercise (double progression). Pure: callers load the history.
import type { SessionFeedback, WeightUnit } from "../database.types";

export interface LoggedSet {
  reps: number | null;
  weight: number | null;
  completed: boolean;
}
export interface SessionHistory {
  /** ISO date (YYYY-MM-DD) of the session. */
  date: string;
  unit: WeightUnit;
  sets: LoggedSet[];
  /** How the athlete rated that session afterwards. */
  feedback?: SessionFeedback | null;
}
export interface RepRange {
  min: number;
  max: number;
}
export type LoadAction = "start" | "increase" | "hold" | "reduce" | "return";
export interface LoadSuggestion {
  weight: number | null;
  unit: WeightUnit;
  action: LoadAction;
  reason: string;
  last?: { date: string; weight: number; reps: number[] };
}

/** "4-6" -> {4,6}; "8" -> {8,8}; "6-8 per leg" -> {6,8}; "30 s" / "20 yd" -> null (not a rep target). */
export function parseRepRange(reps: string): RepRange | null {
  const s = reps.trim().toLowerCase();
  if (/\b(s|sec|min|yd|yds|m)\b/.test(s) && !/per|each|side|leg|arm/.test(s)) return null;
  const m = /^(\d+)\s*(?:-|to|–)\s*(\d+)/.exec(s) ?? /^(\d+)/.exec(s);
  if (!m) return null;
  const min = Number(m[1]);
  const max = m[2] ? Number(m[2]) : min;
  return min > 0 && max >= min ? { min, max } : null;
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export function estimateOneRepMax(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

export interface SuggestArgs {
  /** Most recent session first. Sessions with no completed weighted set are ignored. */
  history: SessionHistory[];
  prescribedReps: string;
  prescribedSets: number;
  lowerBody: boolean;
  unit?: WeightUnit;
  /** ISO date "today"; injectable for tests. */
  today: string;
  /** A tested max to seed the first prescription when there is no history. */
  seed?: { oneRepMax: number; loadPct: number } | null;
}

export function suggestNextLoad(args: SuggestArgs): LoadSuggestion {
  const unit = args.unit ?? args.history[0]?.unit ?? "lb";
  const usable = args.history
    .map((h) => ({ ...h, sets: h.sets.filter((s) => s.completed && s.weight != null && s.weight > 0) }))
    .filter((h) => h.sets.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (usable.length === 0) {
    if (args.seed && args.seed.oneRepMax > 0) {
      const w = roundTo((args.seed.oneRepMax * args.seed.loadPct) / 100, 2.5);
      return { weight: w, unit, action: "start", reason: `Starting from your logged max (about ${args.seed.loadPct}% of it). Adjust to feel.` };
    }
    return { weight: null, unit, action: "start", reason: "No history yet. Pick a weight where the last rep is hard but clean, and log it." };
  }

  const last = usable[0];
  const top = Math.max(...last.sets.map((s) => s.weight as number));
  const atTop = last.sets.filter((s) => (s.weight as number) >= top - 0.01);
  const reps = atTop.map((s) => s.reps ?? 0);
  const range = parseRepRange(args.prescribedReps);
  const lastInfo = { date: last.date, weight: top, reps };
  const daysSince = daysBetween(last.date, args.today);
  const smallStep = unit === "kg" ? 2.5 : 5;
  const bigStep = unit === "kg" ? 5 : 10;

  if (daysSince > 21) {
    const w = roundTo(top * 0.9, 2.5);
    return { weight: w, unit, action: "return", reason: `It's been ${daysSince} days: ease back in at about 90% of ${top} ${unit}.`, last: lastInfo };
  }
  if (!range) return { weight: top, unit, action: "hold", reason: `Last time: ${top} ${unit}.`, last: lastInfo };

  const needed = Math.max(1, args.prescribedSets - 1);
  const hitTop = atTop.length >= needed && reps.every((r) => r >= range.max);
  const fb = last.feedback ?? null;
  const missed = !reps.every((r) => r >= range.min);
  if (fb === "too_hard" && missed) {
    return { weight: roundTo(top * 0.95, 2.5), unit, action: "reduce", reason: `Backing off about 5% to ${roundTo(top * 0.95, 2.5)} ${unit}: that session felt too hard and reps fell short.`, last: lastInfo };
  }
  if (fb === "too_hard") {
    return { weight: top, unit, action: "hold", reason: `Staying at ${top} ${unit}${hitTop ? " even though you hit your reps" : ""}: you said the last session felt too hard.`, last: lastInfo };
  }
  if (fb === "too_easy" && !missed) {
    const step = args.lowerBody ? bigStep : smallStep;
    return { weight: roundTo(top + step, 2.5), unit, action: "increase", reason: `Increased to ${roundTo(top + step, 2.5)} ${unit}: your last session felt too easy.`, last: lastInfo };
  }
  if (hitTop) {
    const overshoot = Math.min(...reps) - range.max;
    const step = args.lowerBody ? bigStep : smallStep;
    let next = top + step * (overshoot >= 3 ? 2 : 1);
    next = Math.min(next, roundTo(top * 1.15, 2.5));
    return { weight: roundTo(next, 2.5), unit, action: "increase", reason: `You hit ${range.max} reps on every set at ${top} ${unit}: time to go up.`, last: lastInfo };
  }
  const allInRange = reps.every((r) => r >= range.min);
  if (allInRange) {
    return { weight: top, unit, action: "hold", reason: `Stay at ${top} ${unit} and work toward ${range.max} reps on every set.`, last: lastInfo };
  }
  const prev = usable[1];
  if (prev) {
    const prevTop = Math.max(...prev.sets.map((s) => s.weight as number));
    const prevMissed = prev.sets.filter((s) => (s.weight as number) >= prevTop - 0.01).some((s) => (s.reps ?? 0) < range.min);
    if (prevTop >= top - 0.01 && prevMissed) {
      return { weight: roundTo(top * 0.95, 2.5), unit, action: "reduce", reason: `Reps fell short two sessions running at ${top} ${unit}: back off about 5% and rebuild.`, last: lastInfo };
    }
  }
  return { weight: top, unit, action: "hold", reason: `Repeat ${top} ${unit}: aim for at least ${range.min} reps on every set.`, last: lastInfo };
}

/** Exercises whose first-session weight can be seeded from a tested max, and how much of it. */
export const MAX_SEEDS: Record<string, { metric: string; factor: number }> = {
  "back-squat": { metric: "back-squat-max", factor: 1 },
  "front-squat": { metric: "back-squat-max", factor: 0.8 },
  "barbell-hip-thrust": { metric: "back-squat-max", factor: 0.9 },
  "barbell-bench-press": { metric: "bench-press-max", factor: 1 },
  "overhead-press": { metric: "bench-press-max", factor: 0.6 },
  "barbell-row": { metric: "bench-press-max", factor: 0.75 },
  "trap-bar-deadlift": { metric: "trap-bar-deadlift-max", factor: 1 },
  "trap-bar-jump": { metric: "trap-bar-deadlift-max", factor: 0.35 },
  "conventional-deadlift": { metric: "trap-bar-deadlift-max", factor: 0.95 },
  "hang-power-clean": { metric: "power-clean-max", factor: 1 },
};

export const LOWER_BODY_PATTERNS = new Set(["squat", "hinge", "single_leg", "plyometric"]);

/** Group flat exercise_logs rows (one per set) into per-session history. */
export function groupHistory(
  rows: { progress_log_id: string; date: string; reps_completed: number | null; weight: number | null; completed: boolean; weight_unit: WeightUnit; feedback?: SessionFeedback | null }[],
): SessionHistory[] {
  const byLog = new Map<string, SessionHistory>();
  for (const r of rows) {
    let h = byLog.get(r.progress_log_id);
    if (!h) {
      h = { date: r.date, unit: r.weight_unit, sets: [], feedback: r.feedback ?? null };
      byLog.set(r.progress_log_id, h);
    }
    h.sets.push({ reps: r.reps_completed, weight: r.weight, completed: r.completed });
  }
  return [...byLog.values()].sort((a, b) => b.date.localeCompare(a.date));
}
