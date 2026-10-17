import { z } from "zod";
import { trainingDaysSchema } from "./program";

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters").max(60),
  sportId: z.string().uuid("Choose a sport"),
  positionId: z.string().uuid("Choose a position"),
  level: z.enum(["beginner", "intermediate", "advanced"], {
    message: "Choose your experience level",
  }),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** The one place onboarding asks which days the athlete trains, before the first program is built. */
export const completeOnboardingSchema = onboardingSchema.extend({ trainingDays: trainingDaysSchema });

/** Profile edits add an optional second position (for athletes who play more than one). */
export const profileSchema = onboardingSchema
  .extend({
    secondaryPositionId: z
      .union([z.string().uuid(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .refine((d) => d.secondaryPositionId !== d.positionId, { message: "Your second position has to be different from your main one.", path: ["secondaryPositionId"] });
