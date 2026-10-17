"use server";

import { redirect } from "next/navigation";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";
import { generateProgram } from "@/lib/program/service";
import { createClient } from "@/lib/supabase/server";

export interface OnboardingActionResult {
  error?: string;
}

export async function completeOnboardingAction(
  _prev: OnboardingActionResult,
  formData: FormData,
): Promise<OnboardingActionResult> {
  const parsed = completeOnboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    sportId: formData.get("sportId"),
    positionId: formData.get("positionId"),
    level: formData.get("level"),
    trainingDays: formData.getAll("trainingDays"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      sport_id: parsed.data.sportId,
      position_id: parsed.data.positionId,
      level: parsed.data.level,
      training_days: parsed.data.trainingDays,
      days_per_week: parsed.data.trainingDays.length,
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Something went wrong saving your profile. Try again." };
  }

  // Straight into the athlete's first built program (not a library screen). If building
  // fails for any reason the program page offers the builder form, so nobody is stranded.
  await generateProgram(supabase, user.id, { trainingDays: parsed.data.trainingDays });
  redirect("/program?welcome=1");
}
