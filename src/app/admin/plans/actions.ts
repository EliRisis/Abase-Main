"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { planSchema } from "@/lib/validations/content";
import { assertAdmin } from "@/lib/auth/assert-admin";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

function parsePlanForm(formData: FormData) {
  return planSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sportId: formData.get("sportId"),
    positionId: formData.get("positionId"),
    level: formData.get("level"),
    weeks: formData.get("weeks"),
    daysPerWeek: formData.get("daysPerWeek"),
    published: formData.get("published") === "on",
    category: formData.get("category"),
    secondaryCategory: formData.get("secondaryCategory"),
    intensity: formData.get("intensity"),
    phases: formData.getAll("phases").map(String).filter(Boolean),
  });
}

export async function createPlanAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parsePlanForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase, user } = await assertAdmin();
  const { data, error } = await supabase
    .from("plans")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      sport_id: parsed.data.sportId,
      position_id: parsed.data.positionId,
      level: parsed.data.level,
      weeks: parsed.data.weeks,
      days_per_week: parsed.data.daysPerWeek,
      published: parsed.data.published ?? true,
      category: parsed.data.category,
      secondary_category: parsed.data.secondaryCategory,
      intensity: parsed.data.intensity,
      phases: parsed.data.phases,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create plan" };
  revalidatePath("/admin/plans");
  redirect(`/admin/plans/${data.id}`);
}

export async function updatePlanAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parsePlanForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("plans")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      sport_id: parsed.data.sportId,
      position_id: parsed.data.positionId,
      level: parsed.data.level,
      weeks: parsed.data.weeks,
      days_per_week: parsed.data.daysPerWeek,
      published: parsed.data.published ?? true,
      category: parsed.data.category,
      secondary_category: parsed.data.secondaryCategory,
      intensity: parsed.data.intensity,
      phases: parsed.data.phases,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${id}`);
  return { success: true };
}

export async function deletePlanAction(id: string): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function setPlanWorkoutAction(
  planId: string,
  weekNumber: number,
  dayNumber: number,
  workoutId: string,
  title: string,
) {
  const { supabase } = await assertAdmin();

  if (!workoutId) {
    await supabase
      .from("plan_workouts")
      .delete()
      .eq("plan_id", planId)
      .eq("week_number", weekNumber)
      .eq("day_number", dayNumber);
  } else {
    await supabase.from("plan_workouts").upsert(
      {
        plan_id: planId,
        week_number: weekNumber,
        day_number: dayNumber,
        workout_id: workoutId,
        title: title || null,
      },
      { onConflict: "plan_id,week_number,day_number" },
    );
  }

  revalidatePath(`/admin/plans/${planId}`);
}
