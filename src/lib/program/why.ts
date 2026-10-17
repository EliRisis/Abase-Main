// "Why this matters for your position": a one-line reason attached to workouts and modules.
// An admin-written note wins; otherwise it is derived from what the workout actually trains
// (its computed attribute profile) and the position's note for that attribute.
import { ATTRIBUTES, dominantAttributes, emptyVector, type Attribute, type AttributeVector } from "./attributes";
import type { Client } from "./data";

export interface WhyNote {
  text: string;
  attribute: Attribute | null;
  profile: AttributeVector | null;
  source: "admin" | "derived";
}

export async function computedWorkoutProfile(supabase: Client, workoutIds: string[]): Promise<AttributeVector | null> {
  if (workoutIds.length === 0) return null;
  const { data } = await supabase.from("workout_attribute_profiles").select("*").in("workout_id", workoutIds);
  const rows = (data ?? []).filter((r) => r.workout_id);
  if (rows.length === 0) return null;
  const out = emptyVector();
  for (const a of ATTRIBUTES) out[a] = Math.round((rows.reduce((s, r) => s + Number(r[a] ?? 0), 0) / rows.length) * 100) / 100;
  return out;
}

export async function whyNoteFor(
  supabase: Client,
  args: { override: string | null; workoutIds: string[]; positionId: string | null },
): Promise<WhyNote | null> {
  const profile = await computedWorkoutProfile(supabase, args.workoutIds);
  if (args.override) return { text: args.override, attribute: profile ? dominantAttributes(profile, 1)[0] : null, profile, source: "admin" };
  if (!profile || !args.positionId) return null;
  const attribute = dominantAttributes(profile, 1)[0];
  const { data } = await supabase
    .from("position_attribute_notes")
    .select("note")
    .eq("position_id", args.positionId)
    .eq("attribute", attribute)
    .maybeSingle();
  return data ? { text: data.note, attribute, profile, source: "derived" } : null;
}
