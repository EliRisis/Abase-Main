"use server";

import { revalidatePath } from "next/cache";
import { archetypeSchema } from "@/lib/validations/content";
import { assertAdmin } from "@/lib/auth/assert-admin";
import { CATEGORIES, PHASES } from "@/lib/training";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

function parseForm(formData: FormData) {
  return archetypeSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  });
}

export async function createArchetypeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("position_archetypes").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/archetypes");
  return { success: true };
}

export async function updateArchetypeAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("position_archetypes")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/archetypes");
  return { success: true };
}

export async function deleteArchetypeAction(id: string): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("position_archetypes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/archetypes");
  revalidatePath("/admin/positions");
  return { success: true };
}

export async function saveWeightsAction(
  archetypeId: string,
  weights: Record<string, number>,
): Promise<ActionResult> {
  const { supabase } = await assertAdmin();

  const rows = PHASES.flatMap((phase) =>
    CATEGORIES.map((category) => ({
      archetype_id: archetypeId,
      phase,
      category,
      weight: Math.max(0, Math.min(20, Number(weights[`${phase}:${category}`]) || 0)),
    })),
  );

  const { error } = await supabase
    .from("archetype_category_weights")
    .upsert(rows, { onConflict: "archetype_id,phase,category" });

  if (error) return { error: error.message };
  revalidatePath("/admin/archetypes");
  return { success: true };
}
