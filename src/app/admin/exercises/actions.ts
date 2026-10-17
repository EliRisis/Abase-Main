"use server";

import { revalidatePath } from "next/cache";
import { exerciseSchema, exerciseTagSchema } from "@/lib/validations/content";
import { assertAdmin } from "@/lib/auth/assert-admin";
import { ATTRIBUTES } from "@/lib/training";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

function parseForm(formData: FormData, requireConfirmation: boolean) {
  const base = exerciseSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    videoUrl: formData.get("videoUrl"),
    imageUrl: formData.get("imageUrl"),
    muscleGroups: formData.get("muscleGroups"),
    equipment: formData.get("equipment"),
  });
  if (!base.success) return { error: base.error.issues[0]?.message ?? "Invalid input" } as const;

  const rolePrescriptions = ATTRIBUTES.map((role) => ({
    role,
    sets: formData.get(`rx_${role}_sets`),
    reps: formData.get(`rx_${role}_reps`),
    loadPct: formData.get(`rx_${role}_load`) || null,
    tempo: formData.get(`rx_${role}_tempo`) || null,
  })).filter((r) => String(r.sets ?? "").trim() !== "" || String(r.reps ?? "").trim() !== "");

  const tags = exerciseTagSchema.safeParse({
    attrSpeed: formData.get("attr_speed"),
    attrStrength: formData.get("attr_strength"),
    attrPower: formData.get("attr_power"),
    attrAgility: formData.get("attr_agility"),
    attrCoordination: formData.get("attr_coordination"),
    attrConditioning: formData.get("attr_conditioning"),
    attrMobility: formData.get("attr_mobility"),
    pattern: formData.get("pattern"),
    mode: formData.get("mode"),
    setting: formData.get("setting"),
    equipmentTier: formData.get("equipmentTier"),
    minLevel: formData.get("minLevel"),
    loadedAreas: formData.getAll("loadedAreas").map(String),
    positionIds: formData.getAll("positionIds").map(String),
    rolePrescriptions,
  });
  if (!tags.success) return { error: tags.error.issues[0]?.message ?? "Invalid tags" } as const;

  // New exercises get suggested weights; the admin must confirm they reviewed them before saving.
  if (requireConfirmation && formData.get("tagsConfirmed") !== "on") {
    return { error: "Confirm you've reviewed the attribute weights before saving." } as const;
  }
  return { data: base.data, tags: tags.data } as const;
}

function toMuscleGroups(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function columns(parsed: { data: ReturnType<typeof exerciseSchema.parse>; tags: ReturnType<typeof exerciseTagSchema.parse> }) {
  const { data, tags } = parsed;
  return {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    video_url: data.videoUrl || null,
    image_url: data.imageUrl || null,
    muscle_groups: toMuscleGroups(data.muscleGroups),
    equipment: data.equipment || null,
    attr_speed: tags.attrSpeed,
    attr_strength: tags.attrStrength,
    attr_power: tags.attrPower,
    attr_agility: tags.attrAgility,
    attr_coordination: tags.attrCoordination,
    attr_conditioning: tags.attrConditioning,
    attr_mobility: tags.attrMobility,
    movement_pattern: tags.pattern,
    prescription_mode: tags.mode,
    setting: tags.setting,
    equipment_tier: tags.equipmentTier,
    min_level: tags.minLevel,
    loaded_areas: tags.loadedAreas,
  };
}

async function saveRelations(
  supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"],
  exerciseId: string,
  tags: ReturnType<typeof exerciseTagSchema.parse>,
): Promise<string | null> {
  const del1 = await supabase.from("exercise_positions").delete().eq("exercise_id", exerciseId);
  if (del1.error) return del1.error.message;
  if (tags.positionIds.length > 0) {
    const ins = await supabase.from("exercise_positions").insert(tags.positionIds.map((position_id) => ({ exercise_id: exerciseId, position_id })));
    if (ins.error) return ins.error.message;
  }
  const del2 = await supabase.from("exercise_role_prescriptions").delete().eq("exercise_id", exerciseId);
  if (del2.error) return del2.error.message;
  if (tags.rolePrescriptions.length > 0) {
    const ins = await supabase.from("exercise_role_prescriptions").insert(
      tags.rolePrescriptions.map((r) => ({ exercise_id: exerciseId, role: r.role, sets: r.sets, reps: r.reps, load_pct: r.loadPct, tempo: r.tempo })),
    );
    if (ins.error) return ins.error.message;
  }
  return null;
}

export async function createExerciseAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = parseForm(formData, true);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase } = await assertAdmin();
  const { data: created, error } = await supabase.from("exercises").insert(columns(parsed)).select("id").single();
  if (error || !created) return { error: error?.message ?? "Could not create the exercise" };
  const relErr = await saveRelations(supabase, created.id, parsed.tags);
  if (relErr) return { error: `Saved the exercise but not its extras: ${relErr}` };

  revalidatePath("/admin/exercises");
  return { success: true };
}

export async function updateExerciseAction(id: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = parseForm(formData, false);
  if ("error" in parsed) return { error: parsed.error };

  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("exercises").update(columns(parsed)).eq("id", id);
  if (error) return { error: error.message };
  const relErr = await saveRelations(supabase, id, parsed.tags);
  if (relErr) return { error: `Saved the exercise but not its extras: ${relErr}` };

  revalidatePath("/admin/exercises");
  return { success: true };
}

export async function deleteExerciseAction(id: string): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/exercises");
  return { success: true };
}
