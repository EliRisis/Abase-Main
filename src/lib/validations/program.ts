import { z } from "zod";
import { addDays, todayISO } from "../program/periodization";
import { MAX_TRAINING_DAYS, MIN_TRAINING_DAYS } from "../program/schedule";

export const CATEGORY_VALUES = [
  "strength",
  "speed_acceleration",
  "agility_cod",
  "conditioning",
  "mobility_injury_prevention",
  "position_skill",
] as const;

export const PHASE_VALUES = ["off_season", "pre_season", "in_season", "post_season"] as const;
export const ATTRIBUTE_VALUES = ["speed", "strength", "power", "agility", "coordination", "conditioning", "mobility"] as const;
export const BODY_AREA_VALUES = ["knee", "ankle_foot", "hip", "low_back", "shoulder", "elbow_wrist", "hamstring_groin", "other"] as const;
export const SIDE_VALUES = ["both", "left", "right"] as const;
export const EVENT_TYPE_VALUES = ["game", "practice"] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date").refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), "Choose a valid date");

export const LEVEL_VALUES = ["beginner", "intermediate", "advanced"] as const;
export const EQUIPMENT_VALUES = ["bodyweight", "home", "full_gym"] as const;
export const SESSION_MINUTE_VALUES = [30, 45, 60, 90] as const;
export const FEEDBACK_VALUES = ["too_easy", "just_right", "too_hard"] as const;

const optionalId = z
  .union([z.uuid(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

/** Which weekdays the athlete trains: ISO weekdays (1=Mon..7=Sun), 2 to 6 of them, each picked once. */
export const trainingDaysSchema = z
  .array(z.coerce.number().int().min(1).max(7))
  .min(MIN_TRAINING_DAYS, `Pick at least ${MIN_TRAINING_DAYS} days`)
  .max(MAX_TRAINING_DAYS, `Pick at most ${MAX_TRAINING_DAYS} days`)
  .refine((a) => new Set(a).size === a.length, "Pick each day once")
  .transform((a) => [...a].sort((x, y) => x - y));

export const generateProgramSchema = z.object({
  phase: z.enum(PHASE_VALUES),
  positionId: z.uuid("Choose a position"),
  secondaryPositionId: optionalId,
  level: z.enum(LEVEL_VALUES, "Choose your training level"),
  equipmentAccess: z.enum(EQUIPMENT_VALUES, "Choose what equipment you have"),
  trainingDays: trainingDaysSchema,
  sessionMinutes: z.coerce
    .number()
    .int()
    .refine((m) => (SESSION_MINUTE_VALUES as readonly number[]).includes(m), "Pick a session length"),
  /** Every attribute is always trained. Emphasis only adds extra focus to at most two of them. */
  emphasis: z
    .array(z.enum(ATTRIBUTE_VALUES))
    .max(2, "Pick up to 2 areas for extra focus")
    .refine((a) => new Set(a).size === a.length, "Pick each area once")
    .optional()
    .default([]),
  sessionsPerWeek: z.coerce.number().int().min(1).max(7).optional(),
});
export type GenerateProgramInput = z.infer<typeof generateProgramSchema>;

/** "Adjust program": the lightweight changes that are applied in place. */
export const adjustProgramSchema = z.object({
  phase: z.enum(PHASE_VALUES),
  positionId: z.uuid("Choose a position"),
  secondaryPositionId: optionalId,
  trainingDays: trainingDaysSchema,
  emphasis: generateProgramSchema.shape.emphasis,
});

export const setTrainingDaysSchema = z.object({ trainingDays: trainingDaysSchema });

export const setPhaseSchema = z.object({ phase: z.enum(PHASE_VALUES) });

export const sessionFeedbackSchema = z.object({ progressLogId: z.uuid(), value: z.enum(FEEDBACK_VALUES) });

export const readinessSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().max(200).optional().nullable(),
});
export type ReadinessInput = z.infer<typeof readinessSchema>;

export const metricLogSchema = z.object({
  metricId: z.uuid(),
  value: z.coerce.number().positive().max(100000),
  loggedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional(),
  note: z.string().trim().max(200).optional().nullable(),
});
export type MetricLogInput = z.infer<typeof metricLogSchema>;

/** `today` is injected so the same schema runs in the browser and on the server. */
export function targetDateSchema(today: string = todayISO()) {
  return z.object({
    date: isoDate.refine((d) => d >= today, "Pick a date that hasn't passed").refine((d) => d <= addDays(today, 730), "Pick a date within the next two years"),
    event: z.string().trim().max(100, "Keep the event name under 100 characters").optional().nullable(),
  });
}

export const limitationSchema = z.object({
  area: z.enum(BODY_AREA_VALUES),
  side: z.enum(SIDE_VALUES).default("both"),
  note: z.string().trim().max(200, "Keep the note under 200 characters").optional().nullable(),
});
export type LimitationInput = z.infer<typeof limitationSchema>;

export function calendarEventSchema(today: string = todayISO()) {
  return z.object({
    date: isoDate.refine((d) => d >= addDays(today, -1), "Pick today or a future date").refine((d) => d <= addDays(today, 400), "Pick a date within the next year"),
    type: z.enum(EVENT_TYPE_VALUES),
    note: z.string().trim().max(200, "Keep the note under 200 characters").optional().nullable(),
  });
}

export const idSchema = z.object({ id: z.uuid() });

export const timezoneSchema = z.string().max(64).refine((tz) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}, "Unknown timezone");
