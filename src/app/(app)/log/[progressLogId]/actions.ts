"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { completeAsPrescribed, submitSessionFeedback } from "@/lib/program/service";
import { createClient } from "@/lib/supabase/server";
import { sessionFeedbackSchema } from "@/lib/validations/program";
import type { TablesUpdate } from "@/lib/database.types";

const setUpdateSchema = z.object({
  id: z.uuid(),
  repsCompleted: z.number().int().min(0).max(500).nullable().optional(),
  weight: z.number().min(0).max(2000).nullable().optional(),
  completed: z.boolean().optional(),
  /** Field work: the time for one rep, in seconds. */
  resultSeconds: z.number().min(0.1).max(3600).nullable().optional(),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function updateSetAction(
  exerciseLogId: string,
  data: { repsCompleted?: number | null; weight?: number | null; completed?: boolean; resultSeconds?: number | null },
) {
  const parsed = setUpdateSchema.safeParse({ id: exerciseLogId, ...data });
  if (!parsed.success) throw new Error("Invalid set values");
  const { supabase, user } = await requireUser();

  const update: TablesUpdate<"exercise_logs"> = {};
  if (parsed.data.repsCompleted !== undefined) update.reps_completed = parsed.data.repsCompleted;
  if (parsed.data.weight !== undefined) update.weight = parsed.data.weight;
  if (parsed.data.completed !== undefined) update.completed = parsed.data.completed;
  if (parsed.data.resultSeconds !== undefined) update.result_seconds = parsed.data.resultSeconds;

  const { error } = await supabase.from("exercise_logs").update(update).eq("id", parsed.data.id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

/** Save several sets at once (the one-tap "all sets as prescribed" for an exercise). */
export async function saveSetsAction(updates: { id: string; repsCompleted: number | null; weight: number | null; completed: boolean }[]) {
  const parsed = z.array(setUpdateSchema).max(40).safeParse(updates);
  if (!parsed.success) throw new Error("Invalid set values");
  const { supabase, user } = await requireUser();
  for (const u of parsed.data) {
    const { error } = await supabase
      .from("exercise_logs")
      .update({ reps_completed: u.repsCompleted ?? null, weight: u.weight ?? null, completed: u.completed ?? true })
      .eq("id", u.id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
  }
}

/** Mark every set not yet ticked off as done with its pre-filled / prescribed numbers. */
export async function completeAllAsPrescribedAction(progressLogId: string) {
  if (!z.uuid().safeParse(progressLogId).success) throw new Error("Invalid session");
  const { supabase, user } = await requireUser();
  const result = await completeAsPrescribed(supabase, user.id, progressLogId);
  if (!result.ok) throw new Error(result.error);
  revalidatePath(`/log/${progressLogId}`);
  return result.updated;
}

export async function finishWorkoutAction(progressLogId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("progress_logs")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", progressLogId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/progress");
  revalidatePath("/program");
  // straight to the one-tap "how did that feel?"
  redirect(`/log/${progressLogId}/done`);
}

export async function submitFeedbackAction(progressLogId: string, value: string): Promise<{ error?: string; adapted?: string[] }> {
  const parsed = sessionFeedbackSchema.safeParse({ progressLogId, value });
  if (!parsed.success) return { error: "Pick one of the three options." };
  const { supabase, user } = await requireUser();
  const result = await submitSessionFeedback(supabase, user.id, parsed.data.progressLogId, parsed.data.value);
  if (!result.ok) return { error: result.error };
  revalidatePath("/program");
  revalidatePath(`/log/${progressLogId}/done`);
  return { adapted: result.adapted };
}
