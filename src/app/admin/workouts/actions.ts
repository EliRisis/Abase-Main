"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { workoutSchema, workoutExerciseSchema } from "@/lib/validations/content";
import { assertAdmin } from "@/lib/auth/assert-admin";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

function parseWorkoutForm(formData: FormData) {
  return workoutSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sportId: formData.get("sportId"),
    positionId: formData.get("positionId"),
    level: formData.get("level"),
    estimatedMinutes: formData.get("estimatedMinutes") || undefined,
  });
}

export async function createWorkoutAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseWorkoutForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await assertAdmin();
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      sport_id: parsed.data.sportId,
      position_id: parsed.data.positionId,
      level: parsed.data.level,
      estimated_minutes: parsed.data.estimatedMinutes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create workout" };
  revalidatePath("/admin/workouts");
  redirect(`/admin/workouts/${data.id}`);
}

export async function updateWorkoutAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseWorkoutForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("workouts")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      sport_id: parsed.data.sportId,
      position_id: parsed.data.positionId,
      level: parsed.data.level,
      estimated_minutes: parsed.data.estimatedMinutes ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/workouts");
  revalidatePath(`/admin/workouts/${id}`);
  return { success: true };
}

export async function deleteWorkoutAction(id: string): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/workouts");
  return { success: true };
}

export interface ExerciseRowResult {
  error?: string;
  success?: boolean;
}

export async function addWorkoutExerciseAction(
  workoutId: string,
  _prev: ExerciseRowResult,
  formData: FormData,
): Promise<ExerciseRowResult> {
  const parsed = workoutExerciseSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    restSeconds: formData.get("restSeconds") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { data: existing } = await supabase
    .from("workout_exercises")
    .select("order_index")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextIndex = (existing?.order_index ?? 0) + 1;

  const { error } = await supabase.from("workout_exercises").insert({
    workout_id: workoutId,
    exercise_id: parsed.data.exerciseId,
    order_index: nextIndex,
    sets: parsed.data.sets,
    reps: parsed.data.reps,
    rest_seconds: parsed.data.restSeconds ?? null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/workouts/${workoutId}`);
  return { success: true };
}

export async function updateWorkoutExerciseAction(
  id: string,
  workoutId: string,
  _prev: ExerciseRowResult,
  formData: FormData,
): Promise<ExerciseRowResult> {
  const parsed = workoutExerciseSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    restSeconds: formData.get("restSeconds") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("workout_exercises")
    .update({
      exercise_id: parsed.data.exerciseId,
      sets: parsed.data.sets,
      reps: parsed.data.reps,
      rest_seconds: parsed.data.restSeconds ?? null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/admin/workouts/${workoutId}`);
  return { success: true };
}

export async function removeWorkoutExerciseAction(id: string, workoutId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("workout_exercises").delete().eq("id", id);
  revalidatePath(`/admin/workouts/${workoutId}`);
}

export async function moveWorkoutExerciseAction(
  workoutId: string,
  currentId: string,
  currentIndex: number,
  neighborId: string,
  neighborIndex: number,
) {
  const { supabase } = await assertAdmin();
  await supabase.from("workout_exercises").update({ order_index: -1 }).eq("id", currentId);
  await supabase
    .from("workout_exercises")
    .update({ order_index: currentIndex })
    .eq("id", neighborId);
  await supabase
    .from("workout_exercises")
    .update({ order_index: neighborIndex })
    .eq("id", currentId);
  revalidatePath(`/admin/workouts/${workoutId}`);
}
