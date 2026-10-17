import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only");

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || z.uuid().safeParse(v).success, "Invalid selection");

const level = z
  .union([z.enum(["beginner", "intermediate", "advanced"]), z.literal("")])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v == null ? null : v));

export const sportSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug,
  icon: z.string().trim().max(8).optional().nullable(),
});
export type SportInput = z.infer<typeof sportSchema>;

export const positionSchema = z.object({
  sportId: z.uuid("Choose a sport"),
  name: z.string().trim().min(2).max(60),
  slug,
  description: z.string().trim().max(300).optional().nullable(),
  archetypeId: optionalUuid,
});
export type PositionInput = z.infer<typeof positionSchema>;

export const archetypeSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug,
  description: z.string().trim().max(300).optional().nullable(),
});
export type ArchetypeInput = z.infer<typeof archetypeSchema>;

const attributeWeight = z.coerce.number().int("Weights are whole numbers").min(0, "Weights are 0-10").max(10, "Weights are 0-10");
const MOVEMENT_PATTERN_VALUES = ["upper_push", "upper_pull", "hinge", "squat", "single_leg", "core", "carry", "rotational", "plyometric", "locomotion", "mobility"] as const;
const PRESCRIPTION_MODE_VALUES = ["loaded", "bodyweight", "ballistic", "drill", "hold", "interval", "steady", "mobility"] as const;
const BODY_AREA_VALUES = ["knee", "ankle_foot", "hip", "low_back", "shoulder", "elbow_wrist", "hamstring_groin", "other"] as const;
const ATTRIBUTE_VALUES = ["speed", "strength", "power", "agility", "coordination", "conditioning", "mobility"] as const;

export const rolePrescriptionSchema = z.object({
  role: z.enum(ATTRIBUTE_VALUES),
  sets: z.coerce.number().int().min(1, "Sets must be 1-20").max(20, "Sets must be 1-20"),
  reps: z.string().trim().min(1, "Reps are required").max(40),
  loadPct: z.coerce.number().int().min(0).max(100).nullable(),
  tempo: z.string().trim().max(40).nullable(),
});

/** Fixed-taxonomy tags. Every value is validated here AND by table check constraints. */
export const exerciseTagSchema = z
  .object({
    attrSpeed: attributeWeight,
    attrStrength: attributeWeight,
    attrPower: attributeWeight,
    attrAgility: attributeWeight,
    attrCoordination: attributeWeight,
    attrConditioning: attributeWeight,
    attrMobility: attributeWeight,
    pattern: z
      .union([z.enum(MOVEMENT_PATTERN_VALUES), z.literal("")])
      .optional()
      .nullable()
      .transform((v) => (v === "" || v == null ? null : v)),
    mode: z.enum(PRESCRIPTION_MODE_VALUES, "Choose how this exercise is prescribed"),
    /** Where it is done: the weight room, the field, or either (mobility and core that ride along with a session). */
    setting: z.enum(["weight_room", "field", "either"], "Choose where this exercise is done"),
    equipmentTier: z.enum(["bodyweight", "home", "full_gym"], "Choose the equipment level this needs"),
    minLevel: z.enum(["beginner", "intermediate", "advanced"], "Choose the lowest level this suits"),
    loadedAreas: z.array(z.enum(BODY_AREA_VALUES)).max(8).default([]),
    positionIds: z.array(z.uuid()).max(100).default([]),
    rolePrescriptions: z.array(rolePrescriptionSchema).max(7).default([]),
  })
  .refine((t) => t.attrSpeed + t.attrStrength + t.attrPower + t.attrAgility + t.attrCoordination + t.attrConditioning + t.attrMobility > 0, {
    message: "Give at least one attribute a weight above 0",
    path: ["attrSpeed"],
  });
export type ExerciseTagInput = z.infer<typeof exerciseTagSchema>;

export const exerciseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug,
  description: z.string().trim().max(500).optional().nullable(),
  videoUrl: z.union([z.url(), z.literal("")]).optional().nullable(),
  imageUrl: z.union([z.url(), z.literal("")]).optional().nullable(),
  muscleGroups: z.string().trim().max(300).optional().nullable(),
  equipment: z.string().trim().max(80).optional().nullable(),
});
export type ExerciseInput = z.infer<typeof exerciseSchema>;

export const workoutSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug,
  description: z.string().trim().max(500).optional().nullable(),
  sportId: optionalUuid,
  positionId: optionalUuid,
  level,
  estimatedMinutes: z.coerce.number().int().min(1).max(300).optional().nullable(),
});
export type WorkoutInput = z.infer<typeof workoutSchema>;

export const workoutExerciseSchema = z.object({
  exerciseId: z.uuid("Choose an exercise"),
  sets: z.coerce.number().int().min(1).max(20),
  reps: z.string().trim().min(1).max(40),
  restSeconds: z.coerce.number().int().min(0).max(1800).optional().nullable(),
  notes: z.string().trim().max(300).optional().nullable(),
});
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;

const moduleCategory = z.enum([
  "strength",
  "speed_acceleration",
  "agility_cod",
  "conditioning",
  "mobility_injury_prevention",
  "position_skill",
]);
const optionalModuleCategory = z
  .union([moduleCategory, z.literal("")])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v == null ? null : v));
const intensity = z.enum(["low", "moderate", "high"]);
const trainingPhase = z.enum(["off_season", "pre_season", "in_season", "post_season"]);

export const planSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug,
  description: z.string().trim().max(500).optional().nullable(),
  sportId: optionalUuid,
  positionId: optionalUuid,
  level,
  weeks: z.coerce.number().int().min(1).max(52),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  published: z.coerce.boolean().optional(),
  category: moduleCategory,
  secondaryCategory: optionalModuleCategory,
  intensity,
  phases: z.array(trainingPhase).min(1, "Choose at least one phase"),
});
export type PlanInput = z.infer<typeof planSchema>;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const need = z.coerce.number().int("Whole numbers only").min(0, "Needs are 0-10").max(10, "Needs are 0-10");
export const needsProfileSchema = z.object({
  positionId: z.uuid(),
  speed: need,
  strength: need,
  power: need,
  agility: need,
  coordination: need,
  conditioning: need,
  mobility: need,
  rotational: z.boolean(),
  notes: z.record(z.enum(ATTRIBUTE_VALUES), z.string().trim().max(200, "Keep each note under 200 characters")),
});
export type NeedsProfileInput = z.infer<typeof needsProfileSchema>;

const modifier = z.coerce.number().int("Whole numbers only").min(-5, "Modifiers are -5 to +5").max(5, "Modifiers are -5 to +5");
export const phaseModifiersSchema = z.record(
  z.enum(["off_season", "pre_season", "in_season", "post_season"]),
  z.record(z.enum(ATTRIBUTE_VALUES), modifier),
);
