"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calendarEventSchema, idSchema, limitationSchema, targetDateSchema } from "@/lib/validations/program";
import { addDays, todayISO } from "@/lib/program/periodization";
import { rebuildProgram } from "@/lib/program/service";
import { createClient } from "@/lib/supabase/server";

export interface CoachResult {
  error?: string;
  success?: boolean;
  /** The active program was re-planned around the change. */
  rebuilt?: boolean;
}

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle();
  return { supabase, user, today: todayISO(profile?.timezone) };
}

/** Re-plan the remaining sessions so the change shows up straight away. Failures don't undo the saved setting. */
async function replan(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data: active } = await supabase.from("user_programs").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!active) return false;
  const result = await rebuildProgram(supabase, userId);
  revalidatePath("/program");
  revalidatePath("/dashboard");
  return result.ok;
}

function done(rebuilt: boolean): CoachResult {
  revalidatePath("/program/coach");
  return { success: true, rebuilt };
}

// ---------------------------------------------------------------- target date
export async function setTargetDateAction(input: { date: string; event?: string | null }): Promise<CoachResult> {
  const { supabase, user, today } = await ctx();
  const parsed = targetDateSchema(today).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid date" };
  const { error } = await supabase
    .from("profiles")
    .update({ target_date: parsed.data.date, target_event: parsed.data.event?.trim() || null })
    .eq("id", user.id);
  if (error) return { error: error.message };
  return done(await replan(supabase, user.id));
}

export async function clearTargetDateAction(): Promise<CoachResult> {
  const { supabase, user } = await ctx();
  const { error } = await supabase.from("profiles").update({ target_date: null, target_event: null }).eq("id", user.id);
  if (error) return { error: error.message };
  return done(await replan(supabase, user.id));
}

// ---------------------------------------------------------------- go-easy flags
export async function addLimitationAction(input: { area: string; side?: string; note?: string | null }): Promise<CoachResult> {
  const parsed = limitationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { supabase, user } = await ctx();
  const { error } = await supabase.from("user_training_limitations").insert({
    user_id: user.id,
    body_area: parsed.data.area,
    side: parsed.data.side,
    note: parsed.data.note?.trim() || null,
  });
  if (error) return { error: error.code === "23505" ? "You already flagged that area." : error.message };
  return done(await replan(supabase, user.id));
}

export async function removeLimitationAction(id: string): Promise<CoachResult> {
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { error: "Invalid flag" };
  const { supabase, user } = await ctx();
  const { error } = await supabase.from("user_training_limitations").delete().eq("id", parsed.data.id).eq("user_id", user.id);
  if (error) return { error: error.message };
  return done(await replan(supabase, user.id));
}

// ---------------------------------------------------------------- games & practices
export async function addEventAction(input: { date: string; type: string; note?: string | null; repeatWeeks?: number }): Promise<CoachResult> {
  const { supabase, user, today } = await ctx();
  const parsed = calendarEventSchema(today).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const repeat = Math.min(16, Math.max(1, Math.trunc(Number(input.repeatWeeks) || 1)));

  const rows = Array.from({ length: repeat }, (_, i) => ({
    user_id: user.id,
    event_date: addDays(parsed.data.date, i * 7),
    event_type: parsed.data.type,
    note: parsed.data.note?.trim() || null,
  })).filter((r) => r.event_date <= addDays(today, 400));

  const { error } = await supabase.from("user_calendar_events").upsert(rows, { onConflict: "user_id,event_date,event_type", ignoreDuplicates: true });
  if (error) return { error: error.message };
  return done(await replan(supabase, user.id));
}

export async function removeEventAction(id: string): Promise<CoachResult> {
  const parsed = idSchema.safeParse({ id });
  if (!parsed.success) return { error: "Invalid event" };
  const { supabase, user } = await ctx();
  const { error } = await supabase.from("user_calendar_events").delete().eq("id", parsed.data.id).eq("user_id", user.id);
  if (error) return { error: error.message };
  return done(await replan(supabase, user.id));
}
