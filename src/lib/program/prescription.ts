// Set/rep prescription. Prescription belongs to the ROLE an exercise fills in a
// session, not to the exercise itself: a squat is "4 x 4-6 heavy" in a strength
// slot, "4 x 3 fast at ~65%" in a power slot and "3 x 12-15 short rest" in a
// conditioning slot. Admin-defined per-(exercise, role) rows override the defaults.
import type { ExperienceLevel, IntensityLevel, PrescriptionMode } from "../database.types";
import type { Attribute } from "./attributes";

export type Block = "warmup" | "main" | "secondary" | "accessory" | "finisher";

export interface RolePrescription {
  sets: number;
  reps: string;
  loadPct: number | null;
  tempo: string | null;
}
export interface Rx {
  sets: number;
  reps: string;
  restSeconds: number | null;
  loadPct: number | null;
  note: string | null;
}
export interface RxContext {
  intensity: IntensityLevel;
  /** 20-100. Already includes deload / taper / phase / game-day scaling. */
  volumePct: number;
  level: ExperienceLevel | null;
  block: Block;
  /** The athlete flagged an area this exercise loads: keep it, but go easy. */
  goEasy?: boolean;
  /** This role is one of the athlete's "extra focus" areas: one more set on main and secondary work. */
  focus?: boolean;
}

interface Base {
  sets: number;
  reps: string;
  rest: number | null;
  load?: number;
  cue?: string;
}

const CUE: Record<Attribute, string> = {
  strength: "Controlled reps, full rest between sets",
  power: "Explosive: move fast, stop the set if speed drops",
  speed: "Full recovery between reps so every rep is at top speed",
  agility: "Sharp, low cuts at full effort",
  coordination: "Smooth and precise; quality over speed",
  conditioning: "Keep the rest short and keep moving",
  mobility: "Slow and controlled; breathe into the end range",
};

type Table = Partial<Record<Attribute, Base>> & { _: Base };

const BASE_HIGH: Record<PrescriptionMode, Table> = {
  loaded: {
    strength: { sets: 4, reps: "4-6", rest: 150, load: 82 },
    power: { sets: 4, reps: "3", rest: 120, load: 65 },
    conditioning: { sets: 3, reps: "12-15", rest: 45, load: 45 },
    speed: { sets: 3, reps: "3-5", rest: 120, load: 60 },
    mobility: { sets: 2, reps: "8-10", rest: 30 },
    coordination: { sets: 3, reps: "5 / side", rest: 60, cue: "Slow and controlled, light weight, own every position" },
    agility: { sets: 3, reps: "6 / side", rest: 60, cue: "Controlled; build stability for cutting" },
    _: { sets: 3, reps: "8-10", rest: 75, load: 65 },
  },
  ballistic: {
    power: { sets: 4, reps: "4", rest: 90 },
    speed: { sets: 3, reps: "3", rest: 90 },
    strength: { sets: 3, reps: "5", rest: 90 },
    conditioning: { sets: 3, reps: "8", rest: 45 },
    mobility: { sets: 2, reps: "6", rest: 30 },
    _: { sets: 3, reps: "5", rest: 60 },
  },
  bodyweight: {
    strength: { sets: 3, reps: "8-12", rest: 75 },
    power: { sets: 3, reps: "6", rest: 75 },
    conditioning: { sets: 3, reps: "15", rest: 30 },
    mobility: { sets: 2, reps: "10", rest: 20 },
    _: { sets: 3, reps: "8 / side", rest: 45 },
  },
  drill: {
    speed: { sets: 5, reps: "20 yd", rest: 90 },
    agility: { sets: 5, reps: "1 rep, full speed", rest: 60 },
    conditioning: { sets: 6, reps: "30 yd", rest: 45 },
    strength: { sets: 4, reps: "20 yd", rest: 90 },
    power: { sets: 4, reps: "20 yd", rest: 90 },
    mobility: { sets: 2, reps: "30 s", rest: 20 },
    _: { sets: 3, reps: "20 yd", rest: 45 },
  },
  hold: {
    strength: { sets: 3, reps: "30 s", rest: 45 },
    mobility: { sets: 2, reps: "45 s", rest: 15 },
    _: { sets: 3, reps: "20 s / side", rest: 30 },
  },
  interval: {
    conditioning: { sets: 6, reps: "30 s on / 30 s off", rest: null },
    speed: { sets: 6, reps: "10 s max / 50 s easy", rest: null },
    _: { sets: 5, reps: "30 s on / 30 s off", rest: null },
  },
  steady: {
    conditioning: { sets: 1, reps: "20 min", rest: null, cue: "Steady, conversational pace" },
    mobility: { sets: 1, reps: "10 min", rest: null, cue: "Easy pace" },
    _: { sets: 1, reps: "15 min", rest: null, cue: "Steady, conversational pace" },
  },
  mobility: {
    mobility: { sets: 2, reps: "8-10 / side", rest: 15 },
    _: { sets: 2, reps: "8 / side", rest: 15 },
  },
};

/** Explicit moderate-intensity variants where "same thing with fewer sets" isn't the right change. */
const MODERATE_OVERRIDE: Partial<Record<PrescriptionMode, Partial<Record<Attribute, Base>>>> = {
  loaded: {
    strength: { sets: 3, reps: "8-10", rest: 90, load: 70 },
    power: { sets: 3, reps: "5", rest: 90, load: 50 },
  },
  drill: {
    speed: { sets: 4, reps: "20 yd", rest: 75, cue: "Smooth acceleration at about 90% effort" },
    agility: { sets: 4, reps: "1 rep, controlled", rest: 60, cue: "Technique first, about 85% effort" },
  },
  ballistic: {
    power: { sets: 3, reps: "5", rest: 75, cue: "Crisp, submaximal jumps: stick every landing" },
  },
};

function tempoCue(tempo: string | null): string | null {
  if (!tempo) return null;
  if (tempo === "explosive") return CUE.power;
  if (tempo === "controlled") return CUE.strength;
  if (tempo === "moderate") return "Steady tempo, no grinding reps";
  return tempo;
}

/** Sets-only scaling used for volume, level and go-easy. Never below 1 (2 for main lifts unless heavily cut). */
function scaleSets(sets: number, ctx: RxContext): number {
  let s = sets;
  if (ctx.level === "beginner" && (ctx.block === "main" || ctx.block === "secondary") && s > 2) s -= 1;
  s = Math.round((s * ctx.volumePct) / 100);
  const floor = ctx.block === "main" && ctx.volumePct >= 50 ? 2 : 1;
  s = Math.max(floor, s);
  if (ctx.focus && (ctx.block === "main" || ctx.block === "secondary") && ctx.intensity !== "low") s = Math.min(6, s + 1);
  if (ctx.goEasy) s = Math.max(1, Math.ceil(s / 2));
  return s;
}

/** Secondary and accessory lifts are not prescribed like the main lift of the day. */
function blockAdjust(base: Base, mode: PrescriptionMode, role: Attribute, block: Block): Base {
  if (block === "main" || block === "warmup") return base;
  if (mode === "loaded" && role === "strength") {
    return block === "secondary"
      ? { sets: 3, reps: "6-8", rest: 90, load: 75 }
      : { sets: 3, reps: "8-12", rest: 60, load: 65 };
  }
  if (block === "accessory" || block === "finisher") return { ...base, sets: Math.max(2, base.sets - 1) };
  return base;
}

export function prescribe(
  exercise: { mode: PrescriptionMode },
  role: Attribute,
  ctx: RxContext,
  override?: RolePrescription | null,
): Rx {
  const table = BASE_HIGH[exercise.mode];
  let base: Base = table[role] ?? table._;
  const moderate = ctx.intensity !== "high";

  if (override) {
    base = { sets: override.sets, reps: override.reps, rest: base.rest ?? null, load: override.loadPct ?? undefined, cue: tempoCue(override.tempo) ?? base.cue };
    if (moderate) base = { ...base, sets: Math.max(2, base.sets - 1), load: base.load ? Math.max(30, base.load - 10) : undefined };
  } else if (moderate) {
    const o = MODERATE_OVERRIDE[exercise.mode]?.[role];
    if (o) base = o;
    else base = { ...base, sets: Math.max(2, base.sets - 1), load: base.load ? Math.max(30, base.load - 10) : undefined };
  }

  if (!override) base = blockAdjust(base, exercise.mode, role, ctx.block);
  let sets = scaleSets(base.sets, ctx);
  if (ctx.block === "warmup") sets = Math.min(sets, 2);
  let loadPct = base.load ?? null;
  if (ctx.level === "beginner" && loadPct) loadPct = Math.max(30, loadPct - 5);
  if (ctx.goEasy && loadPct) loadPct = Math.max(30, loadPct - 15);
  if (ctx.intensity === "low" && exercise.mode !== "mobility" && exercise.mode !== "steady") sets = Math.min(sets, 2);

  const parts: string[] = [];
  parts.push(base.cue ?? CUE[role]);
  if (loadPct && exercise.mode === "loaded") parts.push(`about ${loadPct}% of your max`);
  if (ctx.goEasy) parts.push("you flagged an area this loads, so go lighter and stop well short of discomfort");
  const note = parts.join(" · ").slice(0, 200);

  return { sets, reps: base.reps, restSeconds: base.rest ?? null, loadPct, note };
}

const MINUTES_PER_SET: Record<PrescriptionMode, number> = {
  loaded: 2.5,
  ballistic: 1.6,
  bodyweight: 1.4,
  drill: 1.2,
  hold: 1.0,
  interval: 1.0,
  steady: 1.0,
  mobility: 1.8,
};

export function estimateMinutes(items: { mode: PrescriptionMode; sets: number; reps: string }[]): number {
  let total = 0;
  for (const i of items) {
    if (i.mode === "steady") {
      const m = /(\d+)\s*min/.exec(i.reps);
      total += m ? Number(m[1]) : 10;
    } else total += i.sets * MINUTES_PER_SET[i.mode];
  }
  return Math.min(120, Math.max(10, Math.round(total / 5) * 5));
}
