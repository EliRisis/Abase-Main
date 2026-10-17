"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { metricLogSchema } from "@/lib/validations/program";
import { replanIfPlateauChanged } from "@/lib/program/service";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function logMetricAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = metricLogSchema.safeParse({
    metricId: formData.get("metricId"),
    value: formData.get("value"),
    loggedOn: formData.get("loggedOn") || undefined,
    note: formData.get("note") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("metric_logs").insert({
    user_id: user.id,
    metric_id: parsed.data.metricId,
    value: parsed.data.value,
    logged_on: parsed.data.loggedOn ?? new Date().toISOString().slice(0, 10),
    note: parsed.data.note || null,
  });
  // The DB trigger enforces the metric's plausible range and rejects future dates,
  // so a range mistake surfaces as a Postgres error here even if the client check
  // is bypassed.
  if (error) return { error: error.message.replace(/^.*?ERROR:\s*/, "") };

  // A metric that has stopped improving shifts the program's emphasis and rotates its exercises.
  await replanIfPlateauChanged(supabase, user.id);
  revalidatePath("/metrics");
  revalidatePath("/program");
  return { success: true };
}

export async function deleteMetricLogAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("metric_logs").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  await replanIfPlateauChanged(supabase, user.id);
  revalidatePath("/metrics");
  revalidatePath("/program");
  return { success: true };
}
