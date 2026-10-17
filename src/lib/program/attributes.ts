// Attribute math for the smart matching system. Pure functions only.
//
//  * Exercises carry fixed-taxonomy weights (0-10) for 7 attributes. Nothing else is tagged by hand.
//  * A workout's / session's profile is COMPUTED by aggregating its exercises (set-weighted).
//  * An athlete's "effective needs profile" is one formula fed by three inputs:
//        position base  ->  training-phase modifier  ->  emphasis boost
//    plus two coach adjustments (target-date periodization and plateau response).
import type {
  LimitationBodyArea,
  MovementPattern,
  PrescriptionMode,
  TrainingAttribute,
} from "../database.types";
import { ATTRIBUTES } from "../training";

export type Attribute = TrainingAttribute;
export type AttributeVector = Record<Attribute, number>;

export { ATTRIBUTES };

export function emptyVector(fill = 0): AttributeVector {
  return { speed: fill, strength: fill, power: fill, agility: fill, coordination: fill, conditioning: fill, mobility: fill };
}

/** Build a vector from a DB row with attr_* columns (exercises / position_needs_profiles). */
export function vectorFromRow(row: {
  attr_speed: number;
  attr_strength: number;
  attr_power: number;
  attr_agility: number;
  attr_coordination: number;
  attr_conditioning: number;
  attr_mobility: number;
}): AttributeVector {
  return {
    speed: row.attr_speed,
    strength: row.attr_strength,
    power: row.attr_power,
    agility: row.attr_agility,
    coordination: row.attr_coordination,
    conditioning: row.attr_conditioning,
    mobility: row.attr_mobility,
  };
}

export const EMPHASIS_BOOST = 3;
export const PLATEAU_BOOST = 2;
export const MIN_NEED = 1; // baseline coverage: no attribute is ever zero
export const MAX_NEED = 10;
export const MAX_EMPHASIS = 2;

export interface EffectiveProfileInput {
  base: AttributeVector;
  phaseModifiers?: Partial<AttributeVector>;
  emphasis?: Attribute[];
  /** Target-date periodization shift for this week (build / peak / taper). */
  periodization?: Partial<AttributeVector>;
  /** Attributes whose tested metric has stopped improving. */
  plateau?: Attribute[];
}

export interface EffectiveProfile {
  /** Clamped to [1,10]: what exercises are scored against. */
  values: AttributeVector;
  /** Clamped to [1,15]: what session counts are allocated from (lets emphasis still bite at a 10). */
  demand: AttributeVector;
  parts: Record<Attribute, { base: number; phase: number; emphasis: number; periodization: number; plateau: number }>;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function computeEffectiveProfile(input: EffectiveProfileInput): EffectiveProfile {
  const emphasis = new Set((input.emphasis ?? []).slice(0, MAX_EMPHASIS));
  const plateau = new Set(input.plateau ?? []);
  const values = emptyVector();
  const demand = emptyVector();
  const parts = {} as EffectiveProfile["parts"];
  for (const a of ATTRIBUTES) {
    const p = {
      base: input.base[a],
      phase: input.phaseModifiers?.[a] ?? 0,
      emphasis: emphasis.has(a) ? EMPHASIS_BOOST : 0,
      periodization: input.periodization?.[a] ?? 0,
      plateau: plateau.has(a) ? PLATEAU_BOOST : 0,
    };
    parts[a] = p;
    const sum = p.base + p.phase + p.emphasis + p.periodization + p.plateau;
    values[a] = clamp(sum, MIN_NEED, MAX_NEED);
    demand[a] = clamp(sum, MIN_NEED, 15);
  }
  return { values, demand, parts };
}

/** Set-weighted mean of exercise attribute vectors. Mirrors the workout_attribute_profiles view. */
export function aggregateProfile(items: { attrs: AttributeVector; sets: number }[]): AttributeVector {
  const out = emptyVector();
  const total = items.reduce((s, i) => s + i.sets, 0);
  if (total <= 0) return out;
  for (const a of ATTRIBUTES) {
    out[a] = Math.round((items.reduce((s, i) => s + i.attrs[a] * i.sets, 0) / total) * 100) / 100;
  }
  return out;
}

export function dominantAttributes(profile: AttributeVector, n = 1): Attribute[] {
  return [...ATTRIBUTES]
    .sort((a, b) => profile[b] - profile[a] || ATTRIBUTES.indexOf(a) - ATTRIBUTES.indexOf(b))
    .slice(0, n);
}

/** Weighted-mean match between an exercise and a desired mix. Returns 0-10. */
export function fitScore(attrs: AttributeVector, wanted: AttributeVector): number {
  let num = 0;
  let den = 0;
  for (const a of ATTRIBUTES) {
    num += wanted[a] * attrs[a];
    den += wanted[a];
  }
  return den > 0 ? num / den : 0;
}

export function normalize(v: AttributeVector): AttributeVector {
  const sum = ATTRIBUTES.reduce((s, a) => s + v[a], 0);
  if (sum <= 0) return emptyVector(1 / ATTRIBUTES.length);
  const out = emptyVector();
  for (const a of ATTRIBUTES) out[a] = v[a] / sum;
  return out;
}

// ---------------------------------------------------------------------------
// Admin auto-suggest: a starting point for a brand-new exercise. The admin
// always reviews and adjusts before it is saved (the form requires a
// confirmation), so this only has to be a sensible first guess.
// ---------------------------------------------------------------------------
export interface TagSuggestion {
  attrs: AttributeVector;
  pattern: MovementPattern | null;
  mode: PrescriptionMode;
  loadedAreas: LimitationBodyArea[];
  /** "matched" when a specific rule fired; "guess" when nothing recognisable was found. */
  confidence: "matched" | "guess";
  basis: string;
}

type Rule = {
  id: string;
  re: RegExp;
  attrs: Partial<AttributeVector>;
  pattern: MovementPattern | null;
  mode: PrescriptionMode;
  areas?: LimitationBodyArea[];
};

const RULES: Rule[] = [
  { id: "reaction", re: /reaction|reactive|mirror drill|tennis ball|diving save/, attrs: { coordination: 9, agility: 6, speed: 3, power: 2, conditioning: 1 }, pattern: "locomotion", mode: "bodyweight" },
  { id: "sled carry", re: /sled (push|drag)|prowler|farmer|suitcase|carry/, attrs: { strength: 6, conditioning: 6, power: 3, coordination: 2 }, pattern: "carry", mode: "drill", areas: ["knee"] },
  { id: "repeat sprints", re: /repeat sprint|gasser|line sprint|suicide|300[- ]yard|shuttle run|tempo run/, attrs: { conditioning: 9, speed: 5, agility: 2, power: 2, strength: 1, mobility: 1 }, pattern: "locomotion", mode: "drill", areas: ["knee", "ankle_foot"] },
  { id: "jump rope", re: /jump rope|skipping rope/, attrs: { coordination: 8, conditioning: 6, agility: 3, power: 3, speed: 3 }, pattern: "plyometric", mode: "interval", areas: ["ankle_foot"] },
  { id: "pallof/core press", re: /pallof/, attrs: { strength: 4, coordination: 6, conditioning: 1, mobility: 2 }, pattern: "core", mode: "hold" },
  { id: "sprint", re: /sprint|\bdash\b|-yard|acceleration|flying|wicket|three-point|first[- ]step|\bfly\b|resisted/, attrs: { speed: 9, power: 5, conditioning: 4, coordination: 3, agility: 2, strength: 2, mobility: 1 }, pattern: "locomotion", mode: "drill", areas: ["hamstring_groin"] },
  { id: "rotational power", re: /rotational|woodchop|wood chop|chop|landmine rotation|rotation(al)? throw|shot ?put/, attrs: { power: 8, coordination: 6, strength: 3, agility: 1, conditioning: 2, mobility: 2 }, pattern: "rotational", mode: "ballistic", areas: ["low_back"] },
  { id: "med ball power", re: /slam|scoop toss|chest pass|overhead throw|med(icine)? ball/, attrs: { power: 8, coordination: 5, strength: 3, conditioning: 3 }, pattern: "core", mode: "ballistic" },
  { id: "olympic", re: /clean|snatch|push press|jerk|kettlebell swing|\bswing\b/, attrs: { power: 9, strength: 6, coordination: 5, speed: 2, conditioning: 3 }, pattern: "hinge", mode: "loaded", areas: ["low_back"] },
  { id: "jump", re: /jump|hop\b|hops\b|bound|pogo|depth|skater|tuck|plyo/, attrs: { power: 8, coordination: 5, agility: 3, strength: 3, speed: 3, conditioning: 1 }, pattern: "plyometric", mode: "ballistic", areas: ["knee", "ankle_foot"] },
  { id: "agility", re: /cone|shuttle|carioca|backpedal|footwork|drop[- ]step|t-drill|w-drill|box drill|zig-?zag|closeout|slide|cutting|\bcut\b|change of direction/, attrs: { agility: 9, coordination: 6, speed: 5, conditioning: 3, power: 3, strength: 1 }, pattern: "locomotion", mode: "drill", areas: ["knee", "ankle_foot"] },
  { id: "ladder", re: /ladder|icky|high knees|a-skip|b-skip|skip/, attrs: { coordination: 8, agility: 6, speed: 3, conditioning: 2, mobility: 2 }, pattern: "locomotion", mode: "drill", areas: ["ankle_foot"] },
  { id: "aerobic", re: /zone 2|zone-2|fartlek|tempo run|easy run|steady|jog|aerobic/, attrs: { conditioning: 8, speed: 1, strength: 0 }, pattern: "locomotion", mode: "steady" },
  { id: "intervals", re: /interval|rowing|assault|air bike|battle rope|burpee|mountain climber/, attrs: { conditioning: 9, power: 3, strength: 2, speed: 3, coordination: 3 }, pattern: "locomotion", mode: "interval" },
  { id: "hip thrust/hinge", re: /deadlift|romanian|\brdl\b|good morning|hip thrust|glute bridge|hamstring (curl|slider)|nordic|back extension|hip hinge/, attrs: { strength: 8, power: 4, coordination: 3, mobility: 2, conditioning: 1 }, pattern: "hinge", mode: "loaded", areas: ["low_back", "hamstring_groin"] },
  { id: "single-leg", re: /single[- ]leg|one[- ]leg|bulgarian|split squat|lunge|step[- ]up|pistol|cossack|calf raise|lateral walk/, attrs: { strength: 6, coordination: 6, mobility: 3, agility: 2, power: 2, conditioning: 2 }, pattern: "single_leg", mode: "loaded", areas: ["knee"] },
  { id: "squat", re: /squat|leg press|hack/, attrs: { strength: 8, power: 4, coordination: 3, mobility: 2, conditioning: 2 }, pattern: "squat", mode: "loaded", areas: ["knee", "low_back", "hip"] },
  { id: "upper push", re: /bench|press|push-?up|\bdip\b|dips|pushup|floor press/, attrs: { strength: 8, power: 4, coordination: 3, conditioning: 1 }, pattern: "upper_push", mode: "loaded", areas: ["shoulder"] },
  { id: "upper pull", re: /\brow\b|pull-?up|chin-?up|pulldown|pull-?down|face pull|pull apart|rear delt|reverse fly|external rotation|internal rotation|\by-t-w\b/, attrs: { strength: 7, power: 2, coordination: 3, mobility: 3, conditioning: 1 }, pattern: "upper_pull", mode: "loaded" },
  { id: "core", re: /plank|dead bug|bird dog|pallof|hollow|ab wheel|rollout|hanging (knee|leg)|leg raise|crunch|sit-?up|core|get-?up/, attrs: { strength: 4, coordination: 6, conditioning: 1, mobility: 2 }, pattern: "core", mode: "hold" },
  { id: "mobility", re: /stretch|mobility|\bcars\b|90\/90|90-90|open book|rockback|couch|foam|world'?s greatest|wall slide|hip airplane|thoracic|sleeper|band shoulder|warm-?up|hold|flow/, attrs: { mobility: 9, coordination: 3, strength: 1 }, pattern: "mobility", mode: "mobility" },
];

const ZERO = emptyVector(0);

export function suggestExerciseTags(input: {
  name: string;
  description?: string | null;
  muscleGroups?: string[] | null;
  equipment?: string | null;
}): TagSuggestion {
  const name = input.name.toLowerCase();
  const extra = `${input.description ?? ""} ${(input.muscleGroups ?? []).join(" ")}`.toLowerCase();
  const equipment = (input.equipment ?? "").toLowerCase();

  let rule = RULES.find((r) => r.re.test(name));
  let basis = rule ? `Matched "${rule.id}" from the name` : "";
  if (!rule) {
    rule = RULES.find((r) => r.re.test(extra));
    if (rule) basis = `Matched "${rule.id}" from the description / muscle groups`;
  }
  if (!rule) {
    return {
      attrs: { ...ZERO, strength: 3, coordination: 3, conditioning: 2 },
      pattern: null,
      mode: "bodyweight",
      loadedAreas: [],
      confidence: "guess",
      basis: "Nothing recognisable in the name - these are neutral placeholders. Please set them yourself.",
    };
  }

  const attrs: AttributeVector = { ...ZERO, ...rule.attrs };
  let mode = rule.mode;
  const lift = (a: Attribute, by: number) => (attrs[a] = clamp(attrs[a] + by, 0, 10));

  // Equipment-driven mode: a "loaded" pattern done with no implement is bodyweight.
  if (mode === "loaded" && (/^(none|bodyweight|body weight)$/.test(equipment) || /\b(push-?up|pull-?up|chin-?up|nordic|dip)\b/.test(name))) {
    mode = "bodyweight";
    if (!/pull-?up|chin-?up|nordic|dip/.test(name)) lift("strength", -2);
  }
  if (/\b(band|banded|mini band)\b/.test(name + " " + equipment) && mode === "loaded") {
    mode = "bodyweight";
    lift("strength", -3);
  }
  if (/\b(hold|isometric|wall sit|spanish)\b/.test(name + " " + extra)) mode = mode === "loaded" || mode === "bodyweight" ? "hold" : mode;
  if (/\bsingle[- ]leg\b|\bone[- ]leg\b|\bunilateral\b/.test(name) && rule.id !== "single-leg") {
    lift("coordination", 2);
    lift("strength", -1);
  }
  if (/explosive|reactive|ballistic/.test(extra)) lift("power", 1);
  if (/heavy|max effort|maximal/.test(extra) && attrs.strength > 0) lift("strength", 1);

  return { attrs, pattern: rule.pattern, mode, loadedAreas: rule.areas ?? [], confidence: "matched", basis };
}
