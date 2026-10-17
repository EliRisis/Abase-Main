"use server";

import { revalidatePath } from "next/cache";
import { needsProfileSchema, phaseModifiersSchema } from "@/lib/validations/content";
import { assertAdmin } from "@/lib/auth/assert-admin";
import { ATTRIBUTES } from "@/lib/training";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function saveNeedsProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = needsProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { supabase } = await assertAdmin();
  const d = parsed.data;

  const { error } = await supabase.from("position_needs_profiles").upsert(
    {
      position_id: d.positionId,
      attr_speed: d.speed,
      attr_strength: d.strength,
      attr_power: d.power,
      attr_agility: d.agility,
      attr_coordination: d.coordination,
      attr_conditioning: d.conditioning,
      attr_mobility: d.mobility,
      rotational: d.rotational,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "position_id" },
  );
  if (error) return { error: error.message };

  for (const a of ATTRIBUTES) {
    const note = d.notes[a]?.trim() ?? "";
    if (note.length === 0) {
      await supabase.from("position_attribute_notes").delete().eq("position_id", d.positionId).eq("attribute", a);
    } else if (note.length < 5) {
      return { error: `The ${a} note is too short (5 characters minimum).` };
    } else {
      const { error: noteErr } = await supabase.from("position_attribute_notes").upsert({ position_id: d.positionId, attribute: a, note }, { onConflict: "position_id,attribute" });
      if (noteErr) return { error: noteErr.message };
    }
  }
  revalidatePath("/admin/needs");
  return { success: true };
}

export async function savePhaseModifiersAction(input: unknown): Promise<ActionResult> {
  const parsed = phaseModifiersSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { supabase } = await assertAdmin();
  const rows = Object.entries(parsed.data).flatMap(([phase, attrs]) =>
    Object.entries(attrs).map(([attribute, modifier]) => ({ phase, attribute, modifier })),
  );
  const { error } = await supabase.from("phase_attribute_modifiers").upsert(rows as never, { onConflict: "phase,attribute" });
  if (error) return { error: error.message };
  revalidatePath("/admin/needs");
  return { success: true };
}
