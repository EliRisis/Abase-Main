"use server";

import { revalidatePath } from "next/cache";
import { sportSchema } from "@/lib/validations/content";
import { assertAdmin } from "@/lib/auth/assert-admin";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

function parseForm(formData: FormData) {
  return sportSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    icon: formData.get("icon"),
  });
}

export async function createSportAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("sports").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    icon: parsed.data.icon || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/sports");
  return { success: true };
}

export async function updateSportAction(
  id: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from("sports")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      icon: parsed.data.icon || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/sports");
  return { success: true };
}

export async function deleteSportAction(id: string): Promise<ActionResult> {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from("sports").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/sports");
  return {};
}
