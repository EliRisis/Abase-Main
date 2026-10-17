"use server";

import { redirect } from "next/navigation";
import { isSession, type Session } from "@/lib/program/sessions";
import { startModuleWorkout } from "@/lib/program/service";
import { createClient } from "@/lib/supabase/server";

/**
 * Start a workout from a standalone module. It is logged like any assembled session (patterns,
 * attribute profile, intensity) so the readiness check and progressive-overload targets see it.
 */
export async function startWorkoutAction(input: {
  userPlanId: string;
  planWorkoutId: string;
  workoutId: string;
  weekNumber: number;
  dayNumber: number;
  /** Which session of the workout to start: weight room, field or recovery. */
  setting?: Session;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = await startModuleWorkout(supabase, user.id, { ...input, setting: isSession(input.setting) ? input.setting : undefined });
  if (!result.ok) throw new Error(result.error);
  redirect(`/log/${result.progressLogId}`);
}
