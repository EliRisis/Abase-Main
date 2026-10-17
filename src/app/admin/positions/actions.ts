"use server";

import { revalidatePath } from "next/cache";
import { positionSchema } from "@/lib/validations/content";
import { assertAdmin } from "@/lib/auth/assert-admin";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

function parseForm(formData: FormData) {
  return positionSchema.safeParse({
    sportId: formData.get("sportId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    archetypeId: formData.get("archetypeId"),
  });
}

export async function createPositionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("positions").insert({
    sport_id: parsed.data.sportId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    archetype_id: parsed.data.archetypeId,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/positions");
  return { success: true };
}

export async function updatePositionAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("positions")
    .update({
      sport_id: parsed.data.sportId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      archetype_id: parsed.data.archetypeId,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/positions");
  return { success: true };
}

export async function deletePositionAction(id: string): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("positions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/positions");
  return { success: true };
}
