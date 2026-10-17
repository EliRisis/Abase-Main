// Smart program assembler. Pure and deterministic: no I/O, no clock, no randomness.
//
// Pipeline for every week of the block:
//   1. effective needs   = position base -> phase modifier -> emphasis boost (+ target-date shift, plateau boost)
//   2. session allocation = split the week's N sessions across day templates in proportion to those needs,
//                           with hard floors (a recovery day, a strength split, baseline coverage)
//   3. arrangement        = choose the training days and order the templates so hard sessions are spaced,
//                           the same regions are not loaded on consecutive days and games/practices are respected
//   4. exercise selection = fill every slot from the exercise library by score (needs fit + position fit),
//                           rotating among the top few so weeks differ, never repeating inside a week and
//                           avoiding same-pattern overload on adjacent days and anything the athlete flagged
//   5. prescription       = sets/reps flex by the ROLE the exercise fills (see prescription.ts)
import type {
  EquipmentAccess,
  ExperienceLevel,
  IntensityLevel,
  LimitationBodyArea,
  LimitationSide,
  ModuleCategory,
  MovementPattern,
  PrescriptionMode,
  TrainingPhase,
} from "../database.types";
import {
  ATTRIBUTES,
  aggregateProfile,
  computeEffectiveProfile,
  emptyVector,
  fitScore,
  normalize,
  type Attribute,
  type AttributeVector,
  type EffectiveProfile,
} from "./attributes";
import {
  addDays,
  adjustForEvents,
  dayNumberOf,
  IN_SEASON_EVENT_BASE_VOLUME,
  offsetOf,
  planWeeks,
  programLength,
  type CalendarEvent,
  type DayAdjust,
  type WeekPlan,
} from "./periodization";
import { estimateMinutes, prescribe, type Block, type RolePrescription } from "./prescription";
import { defaultTrainingDays, normalizeTrainingDays } from "./schedule";

export type Intensity = IntensityLevel;
export type Phase = TrainingPhase;

// ------------------------------------------------------------------ inputs
export interface ExerciseInput {
  id: string;
  name: string;
  slug: string;
  attrs: AttributeVector;
  pattern: MovementPattern | null;
  mode: PrescriptionMode;
  loadedAreas: LimitationBodyArea[];
  /** Position ids this drill is limited to. Empty = universal. */
  positionScope: string[];
  rolePrescriptions: Partial<Record<Attribute, RolePrescription>>;
  /** Where it is done: weight room, field, or "either" (mobility and core holds fit any session). */
  setting: "weight_room" | "field" | "either";
  /** Lowest equipment access that can do it. */
  tier: EquipmentAccess;
  /** Lowest training level it suits. */
  minLevel: ExperienceLevel;
}
export interface PhaseConfig {
  sessionsPerWeek: number;
  volumePct: number;
  maxHighIntensity: number;
  maxSessionIntensity: Intensity;
  deloadEvery: number;
}
export interface FixedDay {
  week: number;
  dayNumber: number;
  /** The track this session belongs to (defaults to the template's track). */
  setting?: Track;
  template: TemplateId;
  intensity: Intensity;
  exerciseIds: string[];
  heavyPatterns: MovementPattern[];
  loadedAreas: LimitationBodyArea[];
}
export interface AssembleInput {
  positionId: string;
  /** A second position the athlete plays: its drills are eligible too (needs are blended by the caller). */
  secondaryPositionId?: string | null;
  rotational: boolean;
  phase: Phase;
  level: ExperienceLevel | null;
  base: AttributeVector;
  phaseModifiers: Partial<AttributeVector>;
  emphasis: Attribute[];
  plateau: Attribute[];
  config: PhaseConfig;
  exercises: ExerciseInput[];
  limitations: { area: LimitationBodyArea; side: LimitationSide }[];
  events: CalendarEvent[];
  /** One-line "why this matters for your position" per attribute. */
  notes: Partial<Record<Attribute, string>>;
  /** Date of week 1 / offset 0. */
  startDate: string;
  /** Rebuilds: only emit days on or after this date. */
  fromDate?: string;
  target: { date: string; event?: string | null } | null;
  weeks?: number;
  sessionsPerWeek?: number;
  deloadCarry?: number;
  /** Bumped to force different rotation picks (e.g. after a plateau). */
  variation?: number;
  fixed?: FixedDay[];
  /** Unused: the weekly pattern is now fixed regardless of which day the block starts on. Kept so old callers compile. */
  newProgram?: boolean;
  /** What gear the athlete has. null = full gym. */
  equipmentAccess?: EquipmentAccess | null;
  /** Days per week the athlete can train. Sessions never exceed it. */
  maxSessions?: number | null;
  /** Which weekdays the athlete trains (ISO weekdays, 1=Mon..7=Sun): the same days every week. Falls
   * back to a default spread sized to `maxSessions` when not given (e.g. an older stored program). */
  trainingDays?: number[] | null;
  /** Typical session length; sessions are trimmed (accessory and finisher work first) to fit. */
  sessionMinutes?: number | null;
  /** Feedback-driven lightening of the coming days, with the plain-language reason. */
  lighten?: { mul: number; until: string; reason: string } | null;
}

const TIER_RANK: Record<EquipmentAccess, number> = { bodyweight: 0, home: 1, full_gym: 2 };
const LEVEL_RANK: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Position, rotational-power, equipment and level eligibility. */
export function eligiblePool(input: AssembleInput): ExerciseInput[] {
  const access = TIER_RANK[input.equipmentAccess ?? "full_gym"];
  const level = LEVEL_RANK[input.level ?? "intermediate"];
  const positions = [input.positionId, input.secondaryPositionId].filter((x): x is string => !!x);
  return input.exercises.filter(
    (e) =>
      (e.positionScope.length === 0 || e.positionScope.some((p) => positions.includes(p))) &&
      (e.pattern !== "rotational" || input.rotational) &&
      TIER_RANK[e.tier] <= access &&
      LEVEL_RANK[e.minLevel] <= level,
  );
}

// --------------------------------------------------------------- templates
export type TemplateId =
  | "lower_strength"
  | "upper_strength"
  | "full_strength"
  | "gym_power"
  | "power"
  | "speed"
  | "agility"
  | "skill"
  | "conditioning"
  | "aerobic"
  | "recovery";

/** A day is made of one or two separate sessions; recovery days are their own kind. */
export type SessionSetting = "weight_room" | "field" | "recovery";

/** The two tracks a program is made of. Every session belongs to exactly one. */
export type Track = "weight_room" | "field";
/** Field / court sessions per week (fewer in a deload week). Change the field schedule here. */
export const FIELD_SESSIONS_PER_WEEK = 3;
export const FIELD_SESSIONS_DELOAD_WEEK = 2;

interface SlotDef {
  block: Block;
  role: Attribute;
  patterns?: MovementPattern[];
  min: number;
  modes?: PrescriptionMode[];
  /** Warm-up safe: not a max-effort or heavy movement. */
  light?: boolean;
}
interface TemplateDef {
  id: TemplateId;
  label: string;
  focus: Attribute;
  intensity: Intensity;
  contrib: Partial<AttributeVector>;
  load: { lower: number; upper: number; cns: number };
  slots: SlotDef[];
}

const TEMPLATE_TRACK: Record<TemplateId, Track> = {
  lower_strength: "weight_room",
  upper_strength: "weight_room",
  full_strength: "weight_room",
  gym_power: "weight_room",
  power: "field",
  speed: "field",
  agility: "field",
  skill: "field",
  conditioning: "field",
  aerobic: "field",
  recovery: "field",
};
const trackOfFixed = (f: FixedDay): Track => f.setting ?? TEMPLATE_TRACK[f.template];
/**
 * Can this exercise be done in that track? Weight-room work is gym only; field work and EVERY plyometric are field;
 * mobility and core holds ("either") ride along with whichever track the session is in.
 */
const fitsTrack = (e: ExerciseInput, track: Track): boolean => (e.pattern === "plyometric" ? track === "field" : e.setting === "either" || e.setting === track);

const WARM_MOB: SlotDef = { block: "warmup", role: "mobility", patterns: ["mobility"], min: 6, light: true };
const WARM_ACT: SlotDef = { block: "warmup", role: "coordination", patterns: ["locomotion", "core"], min: 5, modes: ["drill", "bodyweight", "hold"], light: true };

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  lower_strength: {
    id: "lower_strength", label: "Lower-Body Strength", focus: "strength", intensity: "high",
    contrib: { strength: 0.7, power: 0.15, mobility: 0.05, coordination: 0.05, conditioning: 0.05 },
    load: { lower: 3, upper: 0, cns: 2 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "strength", patterns: ["squat"], min: 6 },
      { block: "main", role: "strength", patterns: ["hinge"], min: 6 },
      { block: "secondary", role: "strength", patterns: ["single_leg"], min: 4 },
      { block: "accessory", role: "strength", patterns: ["hinge", "single_leg", "carry"], min: 3 },
      { block: "accessory", role: "strength", patterns: ["core", "carry"], min: 3 },
      { block: "finisher", role: "conditioning", min: 4 },
    ],
  },
  upper_strength: {
    id: "upper_strength", label: "Upper-Body Strength", focus: "strength", intensity: "high",
    contrib: { strength: 0.8, coordination: 0.1, mobility: 0.1 },
    load: { lower: 0, upper: 3, cns: 1.5 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "strength", patterns: ["upper_push"], min: 6 },
      { block: "main", role: "strength", patterns: ["upper_pull"], min: 6 },
      { block: "secondary", role: "strength", patterns: ["upper_push"], min: 4 },
      { block: "secondary", role: "strength", patterns: ["upper_pull"], min: 4 },
      { block: "accessory", role: "strength", patterns: ["core", "carry"], min: 3 },
      { block: "accessory", role: "mobility", patterns: ["upper_pull", "upper_push"], min: 3 },
      { block: "finisher", role: "conditioning", min: 4 },
    ],
  },
  full_strength: {
    id: "full_strength", label: "Full-Body Strength", focus: "strength", intensity: "high",
    contrib: { strength: 0.75, power: 0.1, coordination: 0.05, mobility: 0.1 },
    load: { lower: 2, upper: 2, cns: 2.5 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "strength", patterns: ["squat", "hinge"], min: 6 },
      { block: "main", role: "strength", patterns: ["upper_push"], min: 6 },
      { block: "main", role: "strength", patterns: ["upper_pull"], min: 6 },
      { block: "secondary", role: "strength", patterns: ["single_leg", "hinge"], min: 4 },
      { block: "accessory", role: "strength", patterns: ["core"], min: 3 },
      { block: "finisher", role: "conditioning", min: 4 },
    ],
  },
  gym_power: {
    id: "gym_power", label: "Power", focus: "power", intensity: "high",
    contrib: { power: 0.6, speed: 0.2, strength: 0.1, coordination: 0.1 },
    load: { lower: 2.5, upper: 1, cns: 3 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "power", patterns: ["hinge", "squat"], min: 5 },
      { block: "secondary", role: "power", patterns: ["upper_push", "core", "rotational"], min: 6 },
      { block: "accessory", role: "strength", patterns: ["hinge", "single_leg"], min: 4 },
      { block: "accessory", role: "coordination", patterns: ["core"], min: 4 },
      { block: "finisher", role: "conditioning", min: 4 },
    ],
  },
  power: {
    id: "power", label: "Power & Plyos", focus: "power", intensity: "high",
    contrib: { power: 0.6, speed: 0.2, strength: 0.1, coordination: 0.1 },
    load: { lower: 2.5, upper: 1, cns: 3 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "power", patterns: ["plyometric"], min: 7 },
      { block: "secondary", role: "power", patterns: ["plyometric"], min: 5 },
      { block: "secondary", role: "power", patterns: ["locomotion", "rotational", "core"], min: 5 },
      { block: "accessory", role: "coordination", patterns: ["core"], min: 4 },
      { block: "finisher", role: "conditioning", min: 4 },
    ],
  },
  speed: {
    id: "speed", label: "Speed & Acceleration", focus: "speed", intensity: "high",
    contrib: { speed: 0.65, power: 0.15, coordination: 0.1, agility: 0.1 },
    load: { lower: 3, upper: 0, cns: 3 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "speed", patterns: ["locomotion"], min: 7 },
      { block: "main", role: "speed", patterns: ["locomotion"], min: 6 },
      { block: "secondary", role: "power", patterns: ["plyometric"], min: 6 },
      { block: "accessory", role: "coordination", patterns: ["core"], min: 4 },
      { block: "finisher", role: "conditioning", min: 4 },
    ],
  },
  agility: {
    id: "agility", label: "Agility & Change of Direction", focus: "agility", intensity: "high",
    contrib: { agility: 0.55, coordination: 0.3, speed: 0.1, conditioning: 0.05 },
    load: { lower: 2.5, upper: 0, cns: 2.5 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "agility", patterns: ["locomotion"], min: 7 },
      { block: "main", role: "agility", patterns: ["locomotion"], min: 6 },
      { block: "secondary", role: "coordination", patterns: ["locomotion", "plyometric"], min: 7 },
      { block: "secondary", role: "agility", patterns: ["plyometric", "single_leg"], min: 4 },
      { block: "accessory", role: "strength", patterns: ["single_leg", "core"], min: 3 },
      { block: "finisher", role: "conditioning", min: 4 },
    ],
  },
  skill: {
    id: "skill", label: "Position Skills & Coordination", focus: "coordination", intensity: "moderate",
    contrib: { coordination: 0.6, agility: 0.15, power: 0.15, mobility: 0.1 },
    load: { lower: 1, upper: 1, cns: 1.5 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "coordination", patterns: ["locomotion", "plyometric", "core"], min: 7 },
      { block: "main", role: "coordination", min: 6 },
      { block: "secondary", role: "power", patterns: ["rotational", "plyometric", "core"], min: 5 },
      { block: "accessory", role: "agility", min: 4 },
      { block: "accessory", role: "mobility", patterns: ["mobility"], min: 6 },
      { block: "finisher", role: "conditioning", min: 4 },
    ],
  },
  conditioning: {
    id: "conditioning", label: "Conditioning", focus: "conditioning", intensity: "moderate",
    contrib: { conditioning: 0.8, speed: 0.1, agility: 0.05, strength: 0.05 },
    load: { lower: 2, upper: 0.5, cns: 1 },
    slots: [
      WARM_MOB, WARM_ACT,
      { block: "main", role: "conditioning", patterns: ["locomotion", "plyometric", "core"], min: 7 },
      { block: "main", role: "conditioning", min: 7 },
      { block: "secondary", role: "conditioning", min: 6 },
      { block: "finisher", role: "strength", patterns: ["core", "carry"], min: 3 },
    ],
  },
  aerobic: {
    id: "aerobic", label: "Easy Aerobic & Mobility", focus: "conditioning", intensity: "low",
    contrib: { conditioning: 0.7, mobility: 0.2, coordination: 0.1 },
    load: { lower: 0.5, upper: 0, cns: 0.2 },
    slots: [
      { block: "warmup", role: "mobility", patterns: ["mobility"], min: 6, light: true },
      { block: "main", role: "conditioning", patterns: ["locomotion"], min: 6, modes: ["steady", "interval"] },
      { block: "secondary", role: "mobility", patterns: ["mobility"], min: 6 },
      { block: "secondary", role: "mobility", patterns: ["mobility"], min: 6 },
    ],
  },
  recovery: {
    id: "recovery", label: "Recovery & Mobility", focus: "mobility", intensity: "low",
    contrib: { mobility: 0.75, coordination: 0.15, conditioning: 0.1 },
    load: { lower: 0, upper: 0, cns: 0.1 },
    slots: [
      { block: "main", role: "mobility", patterns: ["mobility"], min: 7 },
      { block: "main", role: "mobility", patterns: ["mobility"], min: 7 },
      { block: "main", role: "mobility", patterns: ["mobility"], min: 7 },
      { block: "secondary", role: "mobility", patterns: ["mobility"], min: 6 },
      { block: "secondary", role: "mobility", patterns: ["mobility"], min: 6 },
      { block: "secondary", role: "mobility", patterns: ["mobility"], min: 5 },
      { block: "accessory", role: "coordination", patterns: ["core"], min: 4, light: true },
      { block: "accessory", role: "coordination", patterns: ["core"], min: 4, light: true },
    ],
  },
};

const RANK: Record<Intensity, number> = { low: 1, moderate: 2, high: 3 };
const minIntensity = (a: Intensity, b: Intensity | null): Intensity => (b === null ? a : RANK[a] <= RANK[b] ? a : b);

export function legacyCategory(focus: Attribute): ModuleCategory {
  const map: Record<Attribute, ModuleCategory> = {
    speed: "speed_acceleration",
    strength: "strength",
    power: "strength",
    agility: "agility_cod",
    coordination: "position_skill",
    conditioning: "conditioning",
    mobility: "mobility_injury_prevention",
  };
  return map[focus];
}

// ------------------------------------------------------------------ outputs
export interface AssembledExercise {
  exerciseId: string;
  name: string;
  block: Block;
  role: Attribute;
  order: number;
  sets: number;
  reps: string;
  restSeconds: number | null;
  loadPct: number | null;
  rxNote: string | null;
  mode: PrescriptionMode;
  pattern: MovementPattern | null;
  goEasy: boolean;
  /** The track this exercise is done in (always its session's track). */
  setting: Track;
}
export interface AssembledDay {
  weekNumber: number;
  dayNumber: number;
  date: string;
  /** Gym or field: a day is one session in one track. */
  setting: Track;
  template: TemplateId;
  title: string;
  focus: Attribute;
  intensity: Intensity;
  volumePct: number;
  deload: boolean;
  weekMode: WeekPlan["mode"];
  category: ModuleCategory;
  patterns: MovementPattern[];
  attributeProfile: AttributeVector;
  why: string | null;
  estMinutes: number;
  note: string | null;
  exercises: AssembledExercise[];
}
export interface WeekSummary {
  week: number;
  plan: WeekPlan;
  sessions: number;
  templates: TemplateId[];
  profile: EffectiveProfile;
  notes: string[];
}
export interface AssembleResult {
  days: AssembledDay[];
  weeks: number;
  sessionsPerWeek: number;
  summaries: WeekSummary[];
  notes: string[];
}

// ------------------------------------------------------------------ helpers
const LOWER = new Set<MovementPattern>(["squat", "hinge", "single_leg", "plyometric"]);
const OVERLOAD_PATTERNS = new Set<MovementPattern>(["squat", "hinge", "single_leg", "upper_push", "upper_pull", "plyometric"]);

function isHeavy(e: ExerciseInput): boolean {
  return (e.mode === "loaded" && e.attrs.strength >= 6) || (e.mode === "ballistic" && e.attrs.power >= 7) || (e.pattern === "locomotion" && (e.attrs.speed >= 8 || e.attrs.agility >= 8));
}
function isLight(e: ExerciseInput): boolean {
  return e.attrs.power <= 6 && e.attrs.speed <= 7 && e.attrs.conditioning <= 5 && e.mode !== "loaded" && e.mode !== "ballistic";
}
function isLowOk(e: ExerciseInput): boolean {
  return e.attrs.power <= 5 && e.attrs.speed <= 5 && e.attrs.agility <= 6 && e.mode !== "loaded" && e.mode !== "ballistic";
}
function isMaxEffort(e: ExerciseInput): boolean {
  return (e.mode === "ballistic" || e.mode === "loaded") && e.attrs.power >= 9;
}

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

function permutations(items: TemplateId[]): TemplateId[][] {
  const counts = new Map<TemplateId, number>();
  for (const t of items) counts.set(t, (counts.get(t) ?? 0) + 1);
  const keys = [...counts.keys()];
  const out: TemplateId[][] = [];
  const cur: TemplateId[] = [];
  const rec = () => {
    if (cur.length === items.length) { out.push([...cur]); return; }
    for (const k of keys) {
      const left = counts.get(k)!;
      if (!left) continue;
      counts.set(k, left - 1); cur.push(k);
      rec();
      cur.pop(); counts.set(k, left);
    }
  };
  rec();
  return out;
}
function combinations(xs: number[], k: number): number[][] {
  const out: number[][] = [];
  const rec = (start: number, cur: number[]) => {
    if (cur.length === k) { out.push([...cur]); return; }
    for (let i = start; i < xs.length; i++) { cur.push(xs[i]); rec(i + 1, cur); cur.pop(); }
  };
  rec(0, []);
  return out;
}

// --------------------------------------------------------------- allocation
type AllocKey = "strength_day" | "gym_power" | "power" | "speed" | "agility" | "skill" | "conditioning" | "aerobic" | "recovery";
const ALLOC_KEYS: AllocKey[] = ["strength_day", "gym_power", "power", "speed", "agility", "skill", "conditioning", "aerobic", "recovery"];
const ALLOC_CAP: Record<AllocKey, number> = { strength_day: 4, gym_power: 2, power: 2, speed: 2, agility: 2, skill: 2, conditioning: 2, aerobic: 2, recovery: 2 };

function allocContrib(k: AllocKey): Partial<AttributeVector> {
  if (k === "strength_day") {
    const ids: TemplateId[] = ["lower_strength", "upper_strength", "full_strength"];
    const out: Partial<AttributeVector> = {};
    for (const id of ids) for (const a of ATTRIBUTES) out[a] = (out[a] ?? 0) + (TEMPLATES[id].contrib[a] ?? 0) / ids.length;
    return out;
  }
  return TEMPLATES[k as TemplateId].contrib;
}
const CONTRIB = Object.fromEntries(ALLOC_KEYS.map((k) => [k, allocContrib(k)])) as Record<AllocKey, Partial<AttributeVector>>;
type FocusMap = Partial<Record<Attribute, AllocKey>>;
/** Which session type an emphasised area buys, per track (an area the track doesn't train buys nothing there). */
const FOCUS_KEY_BY_TRACK: Record<Track, FocusMap> = {
  weight_room: { strength: "strength_day", power: "gym_power" },
  field: { power: "power", speed: "speed", agility: "agility", coordination: "skill", conditioning: "conditioning" },
};
/** Session types each track may schedule. Post-season (low-intensity only) is easy aerobic work and recovery. */
const TRACK_ALLOWED: Record<Track, (lowOnly: boolean, sessions: number) => AllocKey[]> = {
  // a gym week of 6-7 sessions needs mobility days between the lifting days
  weight_room: (lowOnly, sessions) => (lowOnly ? ["recovery"] : sessions >= 6 ? ["strength_day", "gym_power", "recovery"] : ["strength_day", "gym_power"]),
  field: (lowOnly) => (lowOnly ? ["aerobic", "recovery"] : ["power", "speed", "agility", "skill", "conditioning", "recovery"]),
};
/** Meaningful exposures per week an emphasised area should get (everything else needs 1). */
const EMPHASIS_EXPOSURES = 4;

function allocate(
  N: number,
  demand: AttributeVector,
  opts: { allowed: Set<AllocKey>; fixed: AllocKey[]; minRecovery: number; emphasis: Attribute[]; strong: Set<AllocKey>; focusKey: FocusMap },
): Record<AllocKey, number> {
  const counts = Object.fromEntries(ALLOC_KEYS.map((k) => [k, 0])) as Record<AllocKey, number>;
  for (const f of opts.fixed) counts[f]++;
  const target = emptyVector();
  const powered = ATTRIBUTES.map((a) => Math.pow(demand[a], 1.6));
  const total = powered.reduce((s, v) => s + v, 0);
  ATTRIBUTES.forEach((a, i) => (target[a] = powered[i] / total));

  let placed = opts.fixed.length;
  while (counts.recovery < opts.minRecovery && placed < N && opts.allowed.has("recovery")) {
    counts.recovery++; placed++;
  }
  const errorWith = (k: AllocKey) => {
    counts[k]++;
    let err = 0;
    const n = placed + 1;
    for (const a of ATTRIBUTES) {
      let got = 0;
      for (const j of ALLOC_KEYS) got += counts[j] * (CONTRIB[j][a] ?? 0);
      err += Math.pow(got / n - target[a], 2);
    }
    // a small nudge against stacking the same session type over and over
    err += 0.004 * (counts[k] - 1);
    counts[k]--;
    return err;
  };
  while (placed < N) {
    let best: AllocKey | null = null;
    let bestErr = Infinity;
    for (const k of ALLOC_KEYS) {
      if (!opts.allowed.has(k) || counts[k] >= ALLOC_CAP[k]) continue;
      const e = errorWith(k);
      if (e < bestErr - 1e-12) { best = k; bestErr = e; }
    }
    if (!best) {
      // every allowed type is at its cap: relax the cap on the cheapest one
      best = ALLOC_KEYS.filter((k) => opts.allowed.has(k)).sort((a, b) => errorWith(a) - errorWith(b))[0];
      if (!best) break;
    }
    counts[best]++; placed++;
  }

  // Extra focus buys real training time: an emphasised area gets one more dedicated session
  // (two more in a 6-7 day week), funded by whichever un-emphasised session matches the athlete's
  // needs least. Recovery is never the donor, and a strong position need (>= 7 before any focus)
  // never loses its last dedicated session: focus nudges the week, it doesn't break its balance.
  let extra = N >= 6 ? 2 : N >= 4 ? 1 : 0;
  const emphKeys = new Set(opts.emphasis.map((a) => opts.focusKey[a]).filter((k): k is AllocKey => !!k));
  const alignment = (k: AllocKey) => ATTRIBUTES.reduce((sum, a) => sum + target[a] * (CONTRIB[k][a] ?? 0), 0);
  const fixedCount = (k: AllocKey) => opts.fixed.filter((f) => f === k).length;
  for (const a of [...opts.emphasis].sort((x, y) => demand[y] - demand[x])) {
    if (extra <= 0) break;
    const key = opts.focusKey[a];
    if (!key || !opts.allowed.has(key) || key === "recovery" || counts[key] >= ALLOC_CAP[key]) continue;
    const donor = ALLOC_KEYS.filter((k) => k !== key && k !== "recovery" && !emphKeys.has(k) && opts.allowed.has(k) && counts[k] - fixedCount(k) > 0 && (!opts.strong.has(k) || counts[k] > 1))
      .sort((x, y) => alignment(x) - alignment(y))[0];
    if (!donor) continue;
    counts[donor]--; counts[key]++; extra--;
  }
  return counts;
}

/** Expand the abstract strength_day count into concrete templates, honouring already-fixed names. */
function expandStrength(k: number, alreadyNamed: TemplateId[]): TemplateId[] {
  const wanted: TemplateId[] = k <= 1 ? ["full_strength"] : k === 2 ? ["lower_strength", "upper_strength"] : k === 3 ? ["lower_strength", "upper_strength", "full_strength"] : ["lower_strength", "upper_strength", "full_strength", "lower_strength"];
  const remaining = [...wanted];
  for (const n of alreadyNamed) {
    const i = remaining.indexOf(n);
    if (i >= 0) remaining.splice(i, 1);
  }
  return remaining;
}

// --------------------------------------------------------------- arrangement
interface Placed { off: number; t: TemplateId; i: Intensity }
const INTENSITY_FACTOR: Record<Intensity, number> = { low: 0.1, moderate: 0.6, high: 1 };

function pairCost(a: Placed, b: Placed): number {
  const A = TEMPLATES[a.t].load, B = TEMPLATES[b.t].load;
  const f = INTENSITY_FACTOR[a.i] * INTENSITY_FACTOR[b.i];
  return (A.lower * B.lower * 0.7 + A.upper * B.upper * 0.7 + A.cns * B.cns * 0.5) * f;
}

function arrangementCost(
  placed: Placed[],
  adjust: (off: number) => DayAdjust,
  tail: { t: TemplateId; i: Intensity; dist: number } | null,
  preferFirst: boolean,
): number {
  const p = [...placed].sort((x, y) => x.off - y.off);
  let cost = 0;
  if (tail && p.length > 0) {
    const gap = tail.dist + p[0].off;
    if (gap === 1) cost += pairCost({ off: 0, t: tail.t, i: tail.i }, p[0]);
  }
  if (preferFirst && (p.length === 0 || p[0].off !== 0)) cost += 1.5;
  if (p.length > 1) {
    // weeks repeat, so the last day of this week sits next to the first day of the next one
    const last = p[p.length - 1], first = p[0];
    if (7 - last.off + first.off === 1) cost += 0.8 * pairCost(last, first);
  }
  for (let idx = 0; idx < p.length; idx++) {
    const d = p[idx];
    const def = TEMPLATES[d.t];
    const hard = def.intensity === "high";
    if (hard) cost += adjust(d.off).hardPenalty * INTENSITY_FACTOR[d.i];
    else if (def.intensity === "moderate") cost += adjust(d.off).hardPenalty * 0.3;
    if (preferFirst && d.off === 0 && def.intensity === "low") cost += 3;
    const prev = p[idx - 1];
    if (prev) {
      const gap = d.off - prev.off;
      if (gap === 1) {
        cost += pairCost(prev, d);
        if ((d.t === "speed" || d.t === "power") && prev.i !== "low") cost += 3; // fast work wants fresh legs
        if (TEMPLATES[prev.t].intensity === "high" && def.intensity === "low") cost -= 2; // recovery after a hard day is good
        const before = p[idx - 2];
        if (before && prev.off - before.off === 1 && d.i !== "low" && prev.i !== "low") cost += 4; // three in a row
      } else if (gap === 2) {
        cost += TEMPLATES[prev.t].load.cns * def.load.cns * 0.15 * INTENSITY_FACTOR[prev.i] * INTENSITY_FACTOR[d.i];
      }
    }
  }
  return cost;
}

const arrangeCache = new Map<string, Map<number, TemplateId>>();

function arrange(args: {
  offsets: number[];
  free: TemplateId[];
  fixed: Placed[];
  adjust: (off: number) => DayAdjust;
  adjustSig: string;
  tail: { t: TemplateId; i: Intensity; dist: number } | null;
  preferFirst: boolean;
}): Map<number, TemplateId> {
  const key = JSON.stringify([args.offsets, [...args.free].sort(), args.fixed.map((f) => [f.off, f.t, f.i]), args.adjustSig, args.tail, args.preferFirst]);
  const hit = arrangeCache.get(key);
  if (hit) return new Map(hit);

  const freeOffsets = args.offsets.filter((o) => !args.fixed.some((f) => f.off === o));
  const k = args.free.length;
  let best: Placed[] | null = null;
  let bestCost = Infinity;
  const perms = permutations(args.free);
  for (const subset of combinations(freeOffsets, k)) {
    for (const perm of perms) {
      const placed: Placed[] = [...args.fixed, ...subset.map((off, i) => ({ off, t: perm[i], i: TEMPLATES[perm[i]].intensity }))];
      const c = arrangementCost(placed, args.adjust, args.tail, args.preferFirst);
      if (c < bestCost - 1e-9) { bestCost = c; best = placed; }
    }
  }
  const out = new Map<number, TemplateId>();
  for (const p of best ?? args.fixed) out.set(p.off, p.t);
  if (arrangeCache.size > 4000) arrangeCache.clear();
  arrangeCache.set(key, new Map(out));
  return out;
}

// ---------------------------------------------------------- exercise picking
interface DayItem { e: ExerciseInput; block: Block }
interface LastTrained { date: string; items: { pattern: MovementPattern | null; heavy: boolean; areas: LimitationBodyArea[] }[] }

interface WeekCtx {
  week: number;
  variation: number;
  profile: EffectiveProfile;
  needsShare: AttributeVector;
  limited: Set<LimitationBodyArea>;
  used: Set<string>;
  usedLastWeek: Map<TemplateId, Set<string>>;
  exposure: Record<Attribute, number>;
  daysLeft: number;
  totalDays: number;
  /** The main lift chosen for each (track, template, occurrence, slot) in week 1: reused every later week so load can progress. */
  locks: Map<string, ExerciseInput>;
  /** Ids of every locked main lift so far; other slots steer away from them. */
  lockedIds: Set<string>;
  /** How many times each template has been filled so far this week (so two sessions of one template lock different lifts). */
  tplSeen: Map<TemplateId, number>;
}

/** Same heavy movement pattern as yesterday's main/secondary work: recovery spacing says no. */
function wouldOverload(e: ExerciseInput, last: LastTrained | null, date: string): boolean {
  if (!last || !isHeavy(e) || !e.pattern || !OVERLOAD_PATTERNS.has(e.pattern)) return false;
  const gap = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${last.date}T00:00:00Z`)) / 86_400_000);
  return gap <= 1 && last.items.some((it) => it.heavy && it.pattern === e.pattern);
}

const MIN_SCORE_GAP = 10;
const TOP_K = 3;

function scoreCandidate(
  e: ExerciseInput,
  slot: SlotDef,
  slotIdx: number,
  tpl: TemplateDef,
  ctx: WeekCtx,
  last: LastTrained | null,
  date: string,
  input: AssembleInput,
): number {
  const want = emptyVector();
  for (const a of ATTRIBUTES) want[a] = (a === slot.role ? 0.6 : 0) + 0.4 * ctx.needsShare[a];
  let score = fitScore(e.attrs, want) * 10;
  if (e.positionScope.some((p) => p === input.positionId || p === input.secondaryPositionId)) score += 6;
  for (const a of input.emphasis.slice(0, 2)) score += (e.attrs[a] / 10) * 5; // extra focus tilts every pick a little

  if (ctx.lockedIds.has(e.id)) score -= 40;
  const prevWeek = ctx.usedLastWeek.get(tpl.id);
  if (prevWeek?.has(e.id) && slot.block !== "warmup") score -= 14;

  if (slot.block !== "warmup" && slot.block !== "main") {
    const progress = ctx.totalDays <= 1 ? 1 : 1 - ctx.daysLeft / ctx.totalDays;
    const scale = 0.3 + 0.7 * progress;
    for (const a of ATTRIBUTES) if (ctx.exposure[a] === 0 && e.attrs[a] >= 5) score += 12 * scale;
  }
  if (slot.block === "warmup") {
    // spread warm-ups around instead of repeating the same two every day
    if (ctx.used.has(`w:${e.id}`)) score -= 8;
  }

  if (last && slot.block !== "warmup" && (slot.block === "main" || slot.block === "secondary")) {
    const gap = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${last.date}T00:00:00Z`)) / 86_400_000);
    if (gap <= 1 && isHeavy(e)) {
      for (const it of last.items) {
        if (!it.heavy) continue;
        if (e.pattern && it.pattern === e.pattern && OVERLOAD_PATTERNS.has(e.pattern)) score -= 70;
        else if (e.pattern && it.pattern && LOWER.has(e.pattern) && LOWER.has(it.pattern)) score -= 25;
        if (e.loadedAreas.some((a) => it.areas.includes(a))) score -= 12;
      }
    }
  }
  return score;
}

function pickForSlot(
  slot: SlotDef,
  slotIdx: number,
  tpl: TemplateDef,
  intensity: Intensity,
  pool: ExerciseInput[],
  dayUsed: Set<string>,
  ctx: WeekCtx,
  last: LastTrained | null,
  date: string,
  input: AssembleInput,
  session: Track,
  /** Locked main lift: only the clean passes (recovery spacing respected) may use it, else the slot picks freely this week. */
  strictOnly = false,
): { e: ExerciseInput; goEasy: boolean } | null {
  const isWarm = slot.block === "warmup";
  // Try the cleanest option first and relax step by step. Repeating an exercise inside a week is only
  // acceptable for the main lift of a day, warm-ups and low-intensity days; a secondary/accessory slot is
  // skipped rather than duplicated. Exercises that load a flagged area are a last resort, main/secondary
  // slots only, and are prescribed lighter.
  const canReuse = isWarm || slot.block === "main" || intensity === "low";
  const canUseLimited = slot.block === "main" || slot.block === "secondary";
  type Pass = { reuse: boolean; patterns: boolean; limited: boolean; minDrop: number; noOverload?: boolean };
  const passes: Pass[] = [
    { reuse: false, patterns: true, limited: false, minDrop: 0, noOverload: true },
    { reuse: false, patterns: false, limited: false, minDrop: 2, noOverload: true },
    ...(canReuse ? [{ reuse: true, patterns: true, limited: false, minDrop: 0 }, { reuse: true, patterns: false, limited: false, minDrop: 2 }] : []),
    ...(canUseLimited ? [{ reuse: false, patterns: true, limited: true, minDrop: 0 }] : []),
    ...(canUseLimited && canReuse ? [{ reuse: true, patterns: true, limited: true, minDrop: 0 }] : []),
  ];
  for (const pass of strictOnly ? passes.filter((p) => p.noOverload) : passes) {
    const cands: { e: ExerciseInput; score: number }[] = [];
    for (const e of pool) {
      if (dayUsed.has(e.id)) continue;
      if (!fitsTrack(e, session)) continue;
      if (!isWarm && !pass.reuse && ctx.used.has(e.id)) continue;
      if (slot.patterns && pass.patterns && !(e.pattern && slot.patterns.includes(e.pattern))) continue;
      if (!pass.patterns && e.pattern) {
        // relaxed picks must stay inside the region this session is meant to load
        if (tpl.load.lower === 0 && LOWER.has(e.pattern)) continue;
        if (tpl.load.upper === 0 && (e.pattern === "upper_push" || e.pattern === "upper_pull")) continue;
      }
      if (e.attrs[slot.role] < slot.min - pass.minDrop) continue;
      if (slot.modes && pass.patterns && !slot.modes.includes(e.mode)) continue;
      if (slot.light && !isLight(e)) continue;
      if (intensity === "low" && !isLowOk(e)) continue;
      if (intensity !== "high" && isMaxEffort(e) && !pass.limited) continue;
      const hitsLimit = e.loadedAreas.some((a) => ctx.limited.has(a));
      if (hitsLimit && (!pass.limited || isWarm)) continue;
      if (pass.noOverload && (slot.block === "main" || slot.block === "secondary") && wouldOverload(e, last, date)) continue;
      let score = scoreCandidate(e, slot, slotIdx, tpl, ctx, last, date, input);
      if (hitsLimit) score -= 30;
      cands.push({ e, score });
    }
    if (cands.length === 0) continue;
    cands.sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name));
    const top = cands.filter((c) => c.score >= cands[0].score - MIN_SCORE_GAP).slice(0, TOP_K);
    const pick = top[(ctx.week - 1 + slotIdx + ctx.variation) % top.length];
    return { e: pick.e, goEasy: pick.e.loadedAreas.some((a) => ctx.limited.has(a)) };
  }
  return null;
}

type Role = { e: ExerciseInput; slot: SlotDef; goEasy: boolean; session: Track };

function fillSlots(tpl: TemplateDef, intensity: Intensity, pool: ExerciseInput[], ctx: WeekCtx, last: LastTrained | null, date: string, input: AssembleInput, session: Track): Role[] {
  const dayUsed = new Set<string>();
  const roles: Role[] = [];
  const seen = ctx.tplSeen.get(tpl.id) ?? 0;
  ctx.tplSeen.set(tpl.id, seen + 1);
  // a locked main lift belongs to its own session: other slots avoid it so the lock can hold (a soft preference, not a filter,
  // because thin pools would otherwise be forced into repeats)
  ctx.lockedIds = new Set([...ctx.locks.values()].map((e) => e.id));
  tpl.slots.forEach((slot, idx) => {
    // Main lifts stay the same all block (progressive overload needs the same lift week to week); everything
    // else rotates. If the locked lift can't be used this week (a deload, a limitation, recovery spacing) the
    // slot falls back to a normal pick for that week only and the lock is kept.
    const lockKey = slot.block === "main" ? `${session}:${tpl.id}:${seen}:${idx}` : null;
    const locked = lockKey ? ctx.locks.get(lockKey) : undefined;
    const pick = (locked ? pickForSlot(slot, idx, tpl, intensity, [locked], dayUsed, ctx, last, date, input, session, true) : null) ?? pickForSlot(slot, idx, tpl, intensity, pool, dayUsed, ctx, last, date, input, session);
    if (!pick) return;
    if (lockKey && !locked) ctx.locks.set(lockKey, pick.e);
    dayUsed.add(pick.e.id);
    roles.push({ e: pick.e, slot, goEasy: pick.goEasy, session });
    if (slot.block === "warmup") ctx.used.add(`w:${pick.e.id}`);
    else ctx.used.add(pick.e.id);
    for (const a of ATTRIBUTES) if (pick.e.attrs[a] >= 5) ctx.exposure[a]++;
  });
  return roles;
}

// ------------------------------------------------------------------ main
type WeekDay = { off: number; day: AssembledDay; items: DayItem[] };
interface TrackState { lastTrained: LastTrained | null }

/**
 * Two independent tracks share one week: the Gym track (weight room only) and the Field track (field, court and
 * every plyometric). Each has its own schedule of complete sessions; they may land on the same day or on different
 * days. Each track runs the same allocation -> arrangement -> selection pipeline over its own exercise pool.
 */
export function assembleProgram(input: AssembleInput): AssembleResult {
  const notes: string[] = [];
  const cfg = input.config;
  const dayCap = Math.max(1, Math.min(7, input.maxSessions ?? 7));
  const N0 = Math.max(1, Math.min(dayCap, 7, Math.round(input.sessionsPerWeek ?? cfg.sessionsPerWeek)));
  const weeks = input.weeks ?? programLength({ start: input.startDate, target: input.target, deloadEvery: cfg.deloadEvery });
  const plans = planWeeks({ start: input.startDate, weeks, target: input.target, deloadEvery: cfg.deloadEvery, deloadCarry: input.deloadCarry ?? 0 });
  const limited = new Set(input.limitations.map((l) => l.area));

  const fullPool = eligiblePool(input);
  const poolFor: Record<Track, ExerciseInput[]> = {
    weight_room: fullPool.filter((e) => fitsTrack(e, "weight_room")),
    field: fullPool.filter((e) => fitsTrack(e, "field")),
  };
  const horizonEnd = addDays(input.startDate, weeks * 7);
  const hasEvents = input.events.some((e) => e.date >= input.startDate && e.date <= horizonEnd);
  const basePhaseVolume = input.phase === "in_season" && hasEvents ? IN_SEASON_EVENT_BASE_VOLUME : cfg.volumePct;
  if (input.phase === "in_season" && !hasEvents) {
    notes.push("Add your games and practices to the calendar and in-season training will lighten around them instead of using a flat reduction.");
  }

  const days: AssembledDay[] = [];
  const summaries: WeekSummary[] = [];
  const usedLastWeek = new Map<TemplateId, Set<string>>();
  const mainLocks = new Map<string, ExerciseInput>();
  const state: Record<Track, TrackState> = { weight_room: { lastTrained: null }, field: { lastTrained: null } };
  const lowOnly = cfg.maxSessionIntensity === "low";

  // ---- the fixed weekly pattern: which weekday gets which template, worked out ONCE for the whole
  // block so every week reads the same (Day 1 is always the same kind of session, Day 2 the next...).
  // A week with fewer sessions than usual (a deload, or a phase that wants fewer) drops days off the
  // END of this list rather than picking different ones.
  const trainingDays = normalizeTrainingDays(input.trainingDays && input.trainingDays.length ? input.trainingDays : defaultTrainingDays(N0));
  const trainingOffsets = [...new Set(trainingDays.map((d) => offsetOf(input.startDate, d)))].sort((a, b) => a - b);
  const noAdjust = (): DayAdjust => ({ blocked: false, volumeMul: 1, intensityCap: null, hardPenalty: 0, reasons: [] });
  const w1 = plans[0];
  const canonicalBalanced = computeEffectiveProfile({ base: input.base, phaseModifiers: input.phaseModifiers, emphasis: [], periodization: w1.shift, plateau: input.plateau });

  function canonicalTemplates(track: Track, count: number): TemplateId[] {
    if (count <= 0) return [];
    const allowed = new Set<AllocKey>(TRACK_ALLOWED[track](lowOnly, count));
    const focusKey = FOCUS_KEY_BY_TRACK[track];
    const strong = new Set<AllocKey>(ATTRIBUTES.filter((a) => canonicalBalanced.values[a] >= 7).map((a) => focusKey[a]).filter((k): k is AllocKey => !!k));
    const counts = allocate(count, canonicalBalanced.demand, { allowed, fixed: [], minRecovery: track === "weight_room" && !lowOnly && count >= 6 ? 2 : 0, emphasis: input.emphasis.slice(0, 2), strong, focusKey });
    const free: TemplateId[] = [];
    for (const k of ALLOC_KEYS) {
      const n = counts[k];
      if (n <= 0) continue;
      if (k === "strength_day") free.push(...expandStrength(n, []));
      else for (let i = 0; i < n; i++) free.push(k as TemplateId);
    }
    return free;
  }
  // Gym: one session per training day, arranged once for good spacing.
  const gymFree = canonicalTemplates("weight_room", trainingOffsets.length);
  const gymOrder = arrange({ offsets: trainingOffsets, free: gymFree, fixed: [], adjust: noAdjust, adjustSig: "canonical-gym", tail: null, preferFirst: false });
  const gymHighOffsets = new Set([...gymOrder].filter(([, t]) => TEMPLATES[t].intensity === "high").map(([o]) => o));
  // Field: its own weekly count, choosing the best subset of the same training days, leaning away
  // from the gym's usual hard days (never off a day the athlete didn't pick).
  const fieldCount = Math.min(FIELD_SESSIONS_PER_WEEK, trainingOffsets.length);
  const fieldFree = canonicalTemplates("field", fieldCount);
  const fieldAdjust = (off: number): DayAdjust => {
    const penalty = (gymHighOffsets.has(off) ? 1.5 : 0) + (gymHighOffsets.has(off - 1) || gymHighOffsets.has(off + 1) ? 0.8 : 0);
    return penalty ? { ...noAdjust(), hardPenalty: penalty } : noAdjust();
  };
  const fieldOrder = arrange({ offsets: trainingOffsets, free: fieldFree, fixed: [], adjust: fieldAdjust, adjustSig: "canonical-field", tail: null, preferFirst: false });
  const canonicalByTrack: Record<Track, Map<number, TemplateId>> = { weight_room: gymOrder, field: fieldOrder };

  for (const wk of plans) {
    const weekNotes: string[] = [];
    const profile = computeEffectiveProfile({
      base: input.base,
      phaseModifiers: input.phaseModifiers,
      emphasis: input.emphasis,
      periodization: wk.shift,
      plateau: input.plateau,
    });
    const weekAdjust = new Map<number, DayAdjust>();
    for (let off = 0; off < 7; off++) weekAdjust.set(off, adjustForEvents(addDays(wk.start, off), input.events, input.phase));
    const baseAdjust = (off: number) => weekAdjust.get(off)!;
    if ([0, 1, 2, 3, 4, 5, 6].some((o) => baseAdjust(o).blocked)) weekNotes.push("Game days are left free of training.");

    const needsShare = normalize(profile.values);
    const exposure = Object.fromEntries(ATTRIBUTES.map((a) => [a, 0])) as Record<Attribute, number>;
    const fixedAll = (input.fixed ?? []).filter((f) => f.week === wk.week);
    // exercises used this week are shared by both tracks so a drill never shows up twice
    const used = new Set(fixedAll.flatMap((f) => f.exerciseIds));
    for (const f of fixedAll) for (const id of f.exerciseIds) {
      const ex = input.exercises.find((x) => x.id === id);
      if (ex) for (const a of ATTRIBUTES) if (ex.attrs[a] >= 5) exposure[a]++;
    }
    const usedThisWeekByTemplate = new Map<TemplateId, Set<string>>();
    const weekDays: WeekDay[] = [];
    const placedCount: Record<Track, number> = { weight_room: 0, field: 0 };
    const templatesByTrack: TemplateId[] = [];

    // The hard-session limit is per athlete, not per track: field sessions only get what the gym left of it.
    let highSoFar = 0;
    for (const track of ["weight_room", "field"] as Track[]) {
      const pool = poolFor[track];
      const fixedForWeek = fixedAll.filter((f) => trackOfFixed(f) === track);
      const fixedOffsets = new Set(fixedForWeek.map((f) => offsetOf(input.startDate, f.dayNumber)));
      const from = input.fromDate;
      const canonical = canonicalByTrack[track];
      // ascending: a lighter week drops the LAST (latest) day of the pattern, never picks a different one
      const canonicalOffsets = [...canonical.keys()].sort((a, b) => a - b);

      let N = track === "weight_room" ? (lowOnly ? Math.min(N0, 3) : wk.deload && N0 >= 6 ? N0 - 1 : N0) : Math.min(wk.deload ? FIELD_SESSIONS_DELOAD_WEEK : FIELD_SESSIONS_PER_WEEK, dayCap);
      N = Math.max(N, fixedForWeek.length);

      // Same days every week: the offsets used are a prefix of the block's fixed per-track pattern
      // (a lighter week drops off the END of it, never a different day), minus anything a game or
      // practice blocks just this week and minus a day a rebuild has already locked in place.
      const weekOffsets = canonicalOffsets
        .slice(0, Math.min(N, canonicalOffsets.length))
        .filter((o) => !fixedOffsets.has(o) && !baseAdjust(o).blocked && (!from || addDays(wk.start, o) >= from));
      if (weekOffsets.length + fixedForWeek.length < Math.min(N, canonicalOffsets.length) && track === "weight_room") {
        weekNotes.push(`Only ${weekOffsets.length + fixedForWeek.length} of your training days are open this week, so the gym has ${weekOffsets.length + fixedForWeek.length} session${weekOffsets.length + fixedForWeek.length === 1 ? "" : "s"}.`);
      }

      const template = new Map<number, TemplateId>();
      for (const o of weekOffsets) template.set(o, canonical.get(o)!);
      for (const f of fixedForWeek) template.set(offsetOf(input.startDate, f.dayNumber), f.template);
      const placedOffsets = [...new Set([...weekOffsets, ...fixedOffsets])].sort((a, b) => a - b);

      // ---- intensity per day: template baseline -> week/phase cap -> event cap -> high-day budget
      const cap = minIntensity(cfg.maxSessionIntensity, wk.intensityCap);
      const placedDays = placedOffsets.map((off) => ({ off, t: template.get(off)!, fixed: fixedOffsets.has(off) }));
      const demandOf = (t: TemplateId) => profile.demand[TEMPLATES[t].focus];
      const intensity = new Map<number, Intensity>();
      for (const d of placedDays) {
        const adj = baseAdjust(d.off);
        let t = d.t;
        if (adj.intensityCap === "low" && TEMPLATES[t].intensity !== "low" && !d.fixed) t = "recovery";
        template.set(d.off, t);
        let i = minIntensity(TEMPLATES[t].intensity, cap);
        i = minIntensity(i, adj.intensityCap);
        if (i === "high" && wk.highAllowed && !wk.highAllowed.includes(t) && !(t === "gym_power" && wk.highAllowed.includes("power"))) i = "moderate";
        intensity.set(d.off, d.fixed ? (fixedForWeek.find((f) => offsetOf(input.startDate, f.dayNumber) === d.off)?.intensity ?? i) : i);
      }
      // a field week always keeps an easier session (3 field sessions -> at most 2 high)
      const weekCap = Math.min(cfg.maxHighIntensity, wk.maxHigh ?? 99);
      // the gym leaves one hard slot for the field whenever the cap has more than one to give
      const trackBudget = track === "weight_room" ? weekCap - (weekCap >= 2 ? 1 : 0) : weekCap - highSoFar;
      const maxHigh = Math.max(0, Math.min(trackBudget, track === "field" ? Math.max(1, placedDays.length - 1) : 99));
      const highDays = placedDays.filter((d) => intensity.get(d.off) === "high").sort((a, b) => demandOf(template.get(b.off)!) - demandOf(template.get(a.off)!) || a.off - b.off);
      highDays.slice(maxHigh).forEach((d) => { if (!d.fixed) intensity.set(d.off, "moderate"); });
      for (let idx = 1; idx < placedDays.length; idx++) {
        const a = placedDays[idx - 1], b = placedDays[idx];
        if (b.off - a.off === 1 && intensity.get(a.off) === "high" && intensity.get(b.off) === "high" && !b.fixed) intensity.set(b.off, "moderate");
      }
      highSoFar += placedDays.filter((d) => intensity.get(d.off) === "high").length;

      // ---- build this track's sessions chronologically
      const ctx: WeekCtx = {
        week: wk.week,
        variation: input.variation ?? 0,
        profile,
        needsShare,
        limited,
        used,
        usedLastWeek,
        exposure,
        daysLeft: placedDays.filter((d) => !d.fixed).length,
        totalDays: placedDays.filter((d) => !d.fixed).length,
        locks: mainLocks,
        lockedIds: new Set(),
        tplSeen: new Map(),
      };
      for (const d of placedDays) {
        const off = d.off;
        const date = addDays(wk.start, off);
        const t = template.get(off)!;
        const tpl = TEMPLATES[t];
        if (d.fixed) {
          const f = fixedForWeek.find((x) => offsetOf(input.startDate, x.dayNumber) === off)!;
          state[track].lastTrained = { date, items: f.heavyPatterns.map((p) => ({ pattern: p, heavy: true, areas: f.loadedAreas })) };
          continue;
        }
        const adj = baseAdjust(off);
        const dayIntensity = intensity.get(off)!;
        let volume = Math.round(basePhaseVolume * wk.volumeMul * adj.volumeMul);
        if (tpl.intensity === "low") volume = Math.max(60, volume);
        if (input.lighten && date < input.lighten.until && tpl.intensity !== "low") volume = Math.round(volume * input.lighten.mul);
        volume = Math.min(100, Math.max(20, volume));

        const roles = fillSlots(tpl, dayIntensity, pool, ctx, state[track].lastTrained, date, input, track);
        ctx.daysLeft = Math.max(0, ctx.daysLeft - 1);
        const built = finalizeDay({ week: wk.week, off, date, tpl, track, dayIntensity, volume, wk, roles, adj, input, level: input.level });
        weekDays.push({ off, day: built.day, items: built.items });
        state[track].lastTrained = {
          date,
          items: roles.filter((r) => r.slot.block === "main" || r.slot.block === "secondary").map((r) => ({ pattern: r.e.pattern, heavy: isHeavy(r.e), areas: r.e.loadedAreas })),
        };
        const set = usedThisWeekByTemplate.get(t) ?? new Set<string>();
        roles.forEach((r) => { if (r.slot.block !== "warmup") set.add(r.e.id); });
        usedThisWeekByTemplate.set(t, set);
      }

      placedCount[track] = placedDays.length;
      templatesByTrack.push(...placedDays.map((d) => template.get(d.off)!));
    }

    // ---- finishers: (1) baseline coverage, nothing is ever left at zero for the week;
    //                   (2) "extra focus": an emphasised area gets extra exposures on top of that baseline.
    // A finisher only joins a session of its own track, so a gym session never picks up field work or the reverse.
    const addFinisher = (a: Attribute, minWeight: number, why: string, slack = 0): boolean => {
      const candidates = weekDays
        .filter((w) => w.day.intensity !== "low" && w.items.filter((i) => i.block === "finisher").length < 2)
        .sort((x, y) => RANK[x.day.intensity] - RANK[y.day.intensity] || (TEMPLATES[y.day.template].contrib[a] ?? 0) - (TEMPLATES[x.day.template].contrib[a] ?? 0) || x.items.length - y.items.length);
      for (const target of candidates) {
        if (input.sessionMinutes && target.day.estMinutes + 5 > input.sessionMinutes + slack) continue;
        const neighbours = weekDays.filter((w) => w.day.setting === target.day.setting && Math.abs(w.off - target.off) === 1);
        const dayUsed = new Set(target.items.map((i) => i.e.id));
        const options = fullPool
          .filter((e) => fitsTrack(e, target.day.setting) && e.attrs[a] >= minWeight && !used.has(e.id) && !dayUsed.has(e.id) && !e.loadedAreas.some((x) => limited.has(x)))
          .filter((e) => !(isHeavy(e) && neighbours.some((n) => n.items.some((i) => isHeavy(i.e) && i.e.pattern === e.pattern && e.pattern && OVERLOAD_PATTERNS.has(e.pattern)))))
          .filter((e) => (target.day.intensity === "high" ? true : !isMaxEffort(e)))
          .sort((x, y) => y.attrs[a] - x.attrs[a] || x.name.localeCompare(y.name));
        const fits = (e: ExerciseInput) => {
          if (!input.sessionMinutes) return true;
          const rx0 = prescribe({ mode: e.mode }, a, { intensity: target.day.intensity, volumePct: target.day.volumePct, level: input.level, block: "finisher" });
          const total = estimateMinutes([...target.day.exercises.map((x) => ({ mode: x.mode, sets: x.sets, reps: x.reps })), { mode: e.mode, sets: rx0.sets, reps: rx0.reps }]);
          return total <= input.sessionMinutes + slack;
        };
        const fitting = options.filter(fits);
        const pick = fitting[(wk.week - 1 + (input.variation ?? 0)) % Math.max(1, Math.min(3, fitting.length))];
        if (!pick) continue;
        const rx = prescribe({ mode: pick.mode }, a, { intensity: target.day.intensity, volumePct: target.day.volumePct, level: input.level, block: "finisher" });
        target.day.exercises.push({
          exerciseId: pick.id, name: pick.name, block: "finisher", role: a, order: target.day.exercises.length, sets: rx.sets, reps: rx.reps,
          restSeconds: rx.restSeconds, loadPct: rx.loadPct, rxNote: rx.note, mode: pick.mode, pattern: pick.pattern, goEasy: false,
          setting: target.day.setting,
        });
        target.items.push({ e: pick, block: "finisher" });
        used.add(pick.id);
        for (const x of ATTRIBUTES) if (pick.attrs[x] >= 5) exposure[x]++;
        target.day.attributeProfile = aggregateProfile(target.day.exercises.map((x) => ({ attrs: input.exercises.find((e) => e.id === x.exerciseId)!.attrs, sets: x.sets })));
        target.day.patterns = uniq(target.day.exercises.map((x) => x.pattern).filter((p): p is MovementPattern => !!p));
        target.day.estMinutes = estimateMinutes(target.day.exercises.map((x) => ({ mode: x.mode, sets: x.sets, reps: x.reps })));
        weekNotes.push(`Added a short ${a} finisher to ${target.day.title} ${why}.`);
        return true;
      }
      return false;
    };
    // Recount coverage from what actually made it into each session: trimming a session to the
    // athlete's time budget can drop an exercise that was already counted when it was picked.
    for (const a of ATTRIBUTES) exposure[a] = 0;
    const counted = [
      ...weekDays.flatMap((w) => w.items.map((i) => i.e)),
      ...fixedAll.flatMap((f) => f.exerciseIds.map((id) => input.exercises.find((x) => x.id === id)).filter((x): x is ExerciseInput => !!x)),
    ];
    for (const e of counted) for (const a of ATTRIBUTES) if (e.attrs[a] >= 5) exposure[a]++;
    if (!wk.deload && !lowOnly && weekDays.length >= 3) {
      const missing = ATTRIBUTES.filter((a) => exposure[a] === 0).sort((a, b) => profile.demand[b] - profile.demand[a]);
      for (const a of missing) addFinisher(a, 5, `so ${a} is covered this week`, 8);
      for (const a of input.emphasis.slice(0, 2)) {
        // extra focus: at least EMPHASIS_EXPOSURES meaningful exposures to the area, versus 1 for everything else
        let guard = 0;
        while (exposure[a] < EMPHASIS_EXPOSURES && guard++ < 2 && addFinisher(a, 6, `for your extra ${a} focus`));
      }
    }

    usedLastWeek.clear();
    for (const [k, v] of usedThisWeekByTemplate) usedLastWeek.set(k, v);

    for (const w of weekDays) days.push(w.day);
    summaries.push({
      week: wk.week,
      plan: wk,
      sessions: placedCount.weight_room + placedCount.field,
      templates: templatesByTrack,
      profile,
      notes: [...(wk.note ? [wk.note] : []), ...weekNotes],
    });
  }

  days.sort((a, b) => a.date.localeCompare(b.date) || (a.setting === b.setting ? 0 : a.setting === "weight_room" ? -1 : 1));
  return { days, weeks, sessionsPerWeek: N0, summaries, notes };
}

/**
 * Rebuild ONE session (e.g. the athlete accepted a lighter swap). Everything else about the
 * program is untouched; exercises already used elsewhere that week are avoided. The session stays in its track.
 */
export function buildSingleSession(
  input: AssembleInput,
  args: { week: number; dayNumber: number; template: TemplateId; track: Track; intensity: Intensity; volumePct: number; usedElsewhere: string[]; note?: string },
): AssembledDay {
  const weeks = Math.max(input.weeks ?? programLength({ start: input.startDate, target: input.target, deloadEvery: input.config.deloadEvery }), args.week);
  const wk = planWeeks({ start: input.startDate, weeks, target: input.target, deloadEvery: input.config.deloadEvery, deloadCarry: input.deloadCarry ?? 0 })[args.week - 1];
  const profile = computeEffectiveProfile({ base: input.base, phaseModifiers: input.phaseModifiers, emphasis: input.emphasis, periodization: wk.shift, plateau: input.plateau });
  const off = offsetOf(input.startDate, args.dayNumber);
  const date = addDays(wk.start, off);
  const pool = eligiblePool(input).filter((e) => fitsTrack(e, args.track));
  const ctx: WeekCtx = {
    week: args.week,
    variation: (input.variation ?? 0) + 1,
    profile,
    needsShare: normalize(profile.values),
    limited: new Set(input.limitations.map((l) => l.area)),
    used: new Set(args.usedElsewhere),
    usedLastWeek: new Map(),
    exposure: Object.fromEntries(ATTRIBUTES.map((a) => [a, 1])) as Record<Attribute, number>,
    daysLeft: 1,
    totalDays: 1,
    locks: new Map(),
    lockedIds: new Set(),
    tplSeen: new Map(),
  };
  const tpl = TEMPLATES[args.template];
  const roles = fillSlots(tpl, args.intensity, pool, ctx, null, date, input, args.track);
  const adj = adjustForEvents(date, input.events, input.phase);
  const { day } = finalizeDay({ week: args.week, off, date, tpl, track: args.track, dayIntensity: args.intensity, volume: args.volumePct, wk, roles, adj, input, level: input.level });
  if (args.note) day.note = [args.note, day.note].filter(Boolean).join(" ");
  return day;
}

function finalizeDay(args: {
  week: number;
  off: number;
  date: string;
  tpl: TemplateDef;
  track: Track;
  dayIntensity: Intensity;
  volume: number;
  wk: WeekPlan;
  roles: { e: ExerciseInput; slot: SlotDef; goEasy: boolean; session: Track }[];
  adj: DayAdjust;
  input: AssembleInput;
  level: ExperienceLevel | null;
}): { day: AssembledDay; items: DayItem[] } {
  const { tpl, input } = args;
  let roles = args.roles;
  const build = (list: typeof roles): AssembledExercise[] => list.map((r, order) => {
    const rx = prescribe(
      { mode: r.e.mode },
      r.slot.role,
      { intensity: args.dayIntensity, volumePct: args.volume, level: args.level, block: r.slot.block, goEasy: r.goEasy, focus: input.emphasis.slice(0, 2).includes(r.slot.role) && !args.wk.deload },
      r.e.rolePrescriptions[r.slot.role] ?? null,
    );
    return {
      exerciseId: r.e.id, name: r.e.name, block: r.slot.block, role: r.slot.role, order,
      sets: rx.sets, reps: rx.reps, restSeconds: rx.restSeconds, loadPct: rx.loadPct, rxNote: rx.note,
      mode: r.e.mode, pattern: r.e.pattern, goEasy: r.goEasy, setting: args.track,
    };
  });
  let exercises = build(roles);
  const limit = input.sessionMinutes;
  if (limit) {
    // fit the athlete's session length: drop finishers, then accessories, then secondary work, then extra warm-ups
    const dropOrder: Block[] = ["finisher", "accessory", "secondary", "warmup"];
    const minutes = () => estimateMinutes(exercises.map((x) => ({ mode: x.mode, sets: x.sets, reps: x.reps })));
    for (const block of dropOrder) {
      while (minutes() > limit) {
        const same = roles.map((r, i) => ({ r, i })).filter(({ r }) => r.slot.block === block);
        if (same.length === 0 || (block === "warmup" && same.length <= 1)) break;
        const drop = same[same.length - 1].i;
        roles = roles.filter((_, i) => i !== drop);
        exercises = build(roles);
      }
    }
  }
  if (limit && limit >= 60 && args.dayIntensity !== "low") {
    const minutes = () => estimateMinutes(exercises.map((x) => ({ mode: x.mode, sets: x.sets, reps: x.reps })));
    const growable = () => exercises.filter((x) => (x.block === "main" || x.block === "secondary") && x.sets < 6 && x.mode !== "steady");
    let guard = 0;
    while (minutes() < limit * 0.75 && growable().length > 0 && guard++ < 12) {
      const x = growable().sort((a, b) => a.sets - b.sets || a.order - b.order)[0];
      x.sets += 1;
    }
  }
  const profile = aggregateProfile(roles.map((r, i) => ({ attrs: r.e.attrs, sets: exercises[i].sets })));
  const noteParts: string[] = [];
  if (args.wk.deload) noteParts.push("Deload week: lighter on purpose.");
  else if (args.wk.mode === "taper" || args.wk.mode === "peak") noteParts.push(`${args.wk.label}.`);
  noteParts.push(...args.adj.reasons);
  if (input.lighten && args.date < input.lighten.until && tpl.intensity !== "low") noteParts.push(input.lighten.reason);
  const focus = tpl.focus;
  const day: AssembledDay = {
    weekNumber: args.week,
    dayNumber: dayNumberOf(input.startDate, args.off),
    date: args.date,
    setting: args.track,
    template: tpl.id,
    // Which room/track this is is already obvious from the tab and icon it's shown under; the UI adds
    // "Day N" (its order in the week) in front of this when it displays the session.
    title: tpl.label,
    focus,
    intensity: args.dayIntensity,
    volumePct: args.volume,
    deload: args.wk.deload,
    weekMode: args.wk.mode,
    category: legacyCategory(focus),
    patterns: uniq(exercises.map((x) => x.pattern).filter((p): p is MovementPattern => !!p)),
    attributeProfile: profile,
    why: input.notes[focus] ?? null,
    estMinutes: estimateMinutes(exercises.map((x) => ({ mode: x.mode, sets: x.sets, reps: x.reps }))),
    note: noteParts.length ? noteParts.join(" ") : null,
    exercises,
  };
  return { day, items: roles.map((r) => ({ e: r.e, block: r.slot.block })) };
}

// -------------------------------------------------------------- validation
export interface Violation { rule: string; detail: string }

export function validateProgram(result: AssembleResult, input: AssembleInput): Violation[] {
  const v: Violation[] = [];
  const byId = new Map(input.exercises.map((e) => [e.id, e]));
  const limited = new Set(input.limitations.map((l) => l.area));
  const cfg = input.config;
  const weeksSeen = uniq(result.days.map((d) => d.weekNumber));
  for (const w of weeksSeen) {
    const wd = result.days.filter((d) => d.weekNumber === w).sort((a, b) => a.date.localeCompare(b.date));
    const summary = result.summaries.find((s) => s.week === w)!;
    const plan = summary.plan;
    const seen = new Map<string, number>();
    for (const d of wd) for (const x of d.exercises) if (x.block !== "warmup" && !(d.intensity === "low" && x.pattern === "mobility")) seen.set(x.exerciseId, (seen.get(x.exerciseId) ?? 0) + 1);
    // With an area flagged, most of that region's drills are excluded and the remaining pool can be
    // too thin to avoid a repeat; that trade-off is accepted rather than dropping the session.
    // (with home or bodyweight gear the gym pool is too thin to never repeat a drill inside a week)
    if (limited.size === 0 && (input.equipmentAccess ?? "full_gym") === "full_gym") for (const [id, n] of seen) if (n > 1) v.push({ rule: "duplicate-exercise", detail: `week ${w}: ${byId.get(id)?.name} appears ${n}x` });

    if (new Set(wd.map((d) => d.date)).size >= 3 && wd.every((d) => d.intensity === "high")) v.push({ rule: "low-day", detail: `week ${w}: every session is high intensity` });
    const maxHigh = Math.min(cfg.maxHighIntensity, plan.maxHigh ?? 99);
    for (const track of ["weight_room", "field"] as Track[]) {
      const high = wd.filter((d) => d.setting === track && d.intensity === "high");
      if (high.length > Math.min(maxHigh, track === "field" ? Math.max(1, wd.filter((d) => d.setting === "field").length - 1) : 99)) v.push({ rule: "high-cap", detail: `week ${w}: ${high.length} high ${track} days > cap ${maxHigh}` });
    }
    const highAll = wd.filter((d) => d.intensity === "high").length;
    if (highAll > maxHigh) v.push({ rule: "high-cap", detail: `week ${w}: ${highAll} high sessions across gym and field > cap ${maxHigh}` });
    if (plan.deload && wd.some((d) => d.intensity === "high")) v.push({ rule: "deload-has-high", detail: `week ${w}: deload week contains a high-intensity day` });
    const fieldN = wd.filter((d) => d.setting === "field").length;
    if (fieldN > (plan.deload ? FIELD_SESSIONS_DELOAD_WEEK : FIELD_SESSIONS_PER_WEEK + 1)) v.push({ rule: "field-sessions", detail: `week ${w}: ${fieldN} field sessions` });

    if (wd.length >= 3 && !plan.deload && cfg.maxSessionIntensity !== "low") {
      for (const attr of ATTRIBUTES) {
        const covered = wd.some((d) => d.exercises.some((x) => byId.get(x.exerciseId)!.attrs[attr] >= 5));
        if (!covered) v.push({ rule: "coverage-gap", detail: `week ${w}: no exercise with ${attr} >= 5` });
      }
    }
  }
  // spacing is checked across the WHOLE block, per track, including where one week rolls into the next
  const heavyOf = (d: AssembledDay) => d.exercises.filter((x) => (x.block === "main" || x.block === "secondary") && x.pattern && OVERLOAD_PATTERNS.has(x.pattern) && isHeavy(byId.get(x.exerciseId)!));
  for (const track of ["weight_room", "field"] as Track[]) {
    const chrono = result.days.filter((d) => d.setting === track).sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < chrono.length; i++) {
      const a = chrono[i - 1], b = chrono[i];
      const gap = Math.round((Date.parse(b.date) - Date.parse(a.date)) / 86_400_000);
      if (gap !== 1) continue;
      if (a.intensity === "high" && b.intensity === "high") v.push({ rule: "back-to-back-high", detail: `${track}: ${a.date} ${a.template} then ${b.date} ${b.template}` });
      for (const x of heavyOf(a)) for (const y of heavyOf(b)) if (x.pattern === y.pattern) v.push({ rule: "same-pattern-consecutive", detail: `${x.pattern} loaded heavy on ${a.date} (${x.name}) and ${b.date} (${y.name})` });
    }
  }
  // gym and field are separate tracks: a session holds only its own environment's work, and every plyometric is field
  const seenKeys = new Set<string>();
  for (const d of result.days) {
    const key = `${d.weekNumber}:${d.dayNumber}:${d.setting}`;
    if (seenKeys.has(key)) v.push({ rule: "duplicate-session", detail: `${d.date}: two ${d.setting} sessions on one day` });
    seenKeys.add(key);
    for (const x of d.exercises) {
      const e = byId.get(x.exerciseId)!;
      if (x.setting !== d.setting) v.push({ rule: "setting-mismatch", detail: `${d.date} ${d.title}: ${x.name} is a ${x.setting} exercise in a ${d.setting} session` });
      if (e.pattern === "plyometric" ? d.setting !== "field" : e.setting !== "either" && e.setting !== d.setting) v.push({ rule: "wrong-track", detail: `${d.date} ${d.title}: ${x.name} (${e.setting}) does not belong in the ${d.setting} track` });
    }
    if (!d.exercises.some((x) => x.block !== "warmup")) v.push({ rule: "empty-session", detail: `${d.date} ${d.title}: only warm-ups` });
  }
  // personalization constraints
  const access = TIER_RANK[input.equipmentAccess ?? "full_gym"];
  const lvl = LEVEL_RANK[input.level ?? "intermediate"];
  if (input.maxSessions) for (const w of weeksSeen) {
    const n = Math.max(result.days.filter((d) => d.weekNumber === w && d.setting === "weight_room").length, result.days.filter((d) => d.weekNumber === w && d.setting === "field").length);
    if (n > input.maxSessions) v.push({ rule: "days-per-week", detail: `week ${w}: ${n} sessions in a track > ${input.maxSessions} available days` });
  }
  for (const d of result.days) {
    if (input.sessionMinutes && d.estMinutes > input.sessionMinutes + 10) v.push({ rule: "session-length", detail: `${d.date} ${d.template} ~${d.estMinutes} min > ${input.sessionMinutes}` });
    for (const x of d.exercises) {
      const e = byId.get(x.exerciseId)!;
      if (TIER_RANK[e.tier] > access) v.push({ rule: "equipment", detail: `${e.name} needs ${e.tier}` });
      if (LEVEL_RANK[e.minLevel] > lvl) v.push({ rule: "level", detail: `${e.name} is ${e.minLevel}-level` });
      if (e.positionScope.length && !e.positionScope.some((p) => p === input.positionId || p === input.secondaryPositionId)) v.push({ rule: "position-scope", detail: `${e.name} is scoped to other positions` });
      if (e.pattern === "rotational" && !input.rotational) v.push({ rule: "rotational", detail: `${e.name} used for a non-rotational position` });
      if (!x.goEasy && e.loadedAreas.some((a) => limited.has(a))) v.push({ rule: "limitation", detail: `${e.name} loads a flagged area without go-easy` });
    }
    if (input.events.some((ev) => ev.type === "game" && ev.date === d.date) && ["in_season", "pre_season"].includes(input.phase)) v.push({ rule: "game-day-session", detail: `session on game day ${d.date}` });
    if (["in_season", "pre_season"].includes(input.phase) && input.events.some((ev) => ev.type === "game" && ev.date === addDays(d.date, 1)) && d.intensity !== "low") v.push({ rule: "pre-game-hard", detail: `${d.intensity} session the day before a game (${d.date})` });
  }
  return v;
}

