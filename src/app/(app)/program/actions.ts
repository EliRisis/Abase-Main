"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adjustProgramSchema, generateProgramSchema, readinessSchema, setPhaseSchema, setTrainingDaysSchema, timezoneSchema } from "@/lib/validations/program";
import { rebuildProgram, startNewBlock, startProgramDay, swapDayToLighter } from "@/lib/program/service";
import { loadAthlete } from "@/lib/program/data";
import { createClient } from "@/lib/supabase/server";
import type { IntensityLevel, ModuleCategory } from "@/lib/database.types";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function refresh() {
  revalidatePath("/program");
  revalidatePath("/dashboard");
  revalidatePath("/today");
  revalidatePath("/profile");
}

export async function generateProgramAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = generateProgramSchema.safeParse({
    phase: formData.get("phase"),
    emphasis: formData.getAll("emphasis").map(String).filter(Boolean),
    sessionsPerWeek: formData.get("sessionsPerWeek") || undefined,
    positionId: formData.get("positionId"),
    secondaryPositionId: formData.get("secondaryPositionId"),
    level: formData.get("level"),
    equipmentAccess: formData.get("equipmentAccess"),
    trainingDays: formData.getAll("trainingDays"),
    sessionMinutes: formData.get("sessionMinutes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  if (d.secondaryPositionId && d.secondaryPositionId === d.positionId) return { error: "Your second position has to be different from your main one." };

  const { supabase, user } = await requireUser();
  const invalid = await checkPositions(supabase, user.id, [d.positionId, d.secondaryPositionId]);
  if (invalid) return { error: invalid };

  // Starting a new block replaces the running one, so it needs the athlete's explicit confirmation
  // (enforced in the service, not only in the dialog). A plain "adjust" never comes through here.
  const result = await startNewBlock(supabase, user.id, {
    phase: d.phase,
    emphasis: d.emphasis,
    sessionsPerWeek: d.sessionsPerWeek,
    positionId: d.positionId,
    secondaryPositionId: d.secondaryPositionId,
    level: d.level,
    equipmentAccess: d.equipmentAccess,
    trainingDays: d.trainingDays,
    sessionMinutes: d.sessionMinutes,
  }, formData.get("confirmArchive") === "yes");
  if (!result.ok) return { error: result.error };
  refresh();
  redirect("/program");
}

async function checkPositions(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, positionIds: (string | null)[]): Promise<string | null> {
  // Positions must exist and belong to the athlete's sport.
  const { data: profile } = await supabase.from("profiles").select("sport_id").eq("id", userId).single();
  const ids = positionIds.filter((x): x is string => !!x);
  const { data: found } = await supabase.from("positions").select("id, sport_id").in("id", ids);
  if ((found ?? []).length !== ids.length || (found ?? []).some((p) => profile?.sport_id && p.sport_id !== profile.sport_id)) return "Pick positions from your sport.";
  return null;
}

/**
 * ADJUST PROGRAM: position, second position, season phase and extra focus. Applied instantly to the
 * running program. Sessions that are done, started or in the past stay exactly as they were; only the
 * remaining days are re-planned. Nothing is archived.
 */
export async function adjustProgramAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = adjustProgramSchema.safeParse({
    phase: formData.get("phase"),
    positionId: formData.get("positionId"),
    secondaryPositionId: formData.get("secondaryPositionId"),
    trainingDays: formData.getAll("trainingDays"),
    emphasis: formData.getAll("emphasis").map(String).filter(Boolean),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  if (d.secondaryPositionId && d.secondaryPositionId === d.positionId) return { error: "Your second position has to be different from your main one." };

  const { supabase, user } = await requireUser();
  const invalid = await checkPositions(supabase, user.id, [d.positionId, d.secondaryPositionId]);
  if (invalid) return { error: invalid };
  const { data: active } = await supabase.from("user_programs").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!active) return { error: "There is no running program to adjust. Start a new block instead." };

  const result = await rebuildProgram(supabase, user.id, { phase: d.phase, emphasis: d.emphasis, positionId: d.positionId, secondaryPositionId: d.secondaryPositionId, trainingDays: d.trainingDays });
  if (!result.ok) return { error: result.error };
  refresh();
  return { success: true };
}

/** Changing phase re-plans the rest of the block; past and started sessions are kept. */
export async function setTrainingPhaseAction(phase: string) {
  const parsed = setPhaseSchema.safeParse({ phase });
  if (!parsed.success) throw new Error("Invalid phase");
  const { supabase, user } = await requireUser();

  const { data: active } = await supabase.from("user_programs").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (active) {
    const result = await rebuildProgram(supabase, user.id, { phase: parsed.data.phase });
    if (!result.ok) throw new Error(result.error);
  } else {
    const { error } = await supabase.from("profiles").update({ training_phase: parsed.data.phase }).eq("id", user.id);
    if (error) throw new Error(error.message);
  }
  refresh();
}

export async function submitReadinessAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readinessSchema.safeParse({ score: formData.get("score"), note: formData.get("note") || null });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const rawDate = String(formData.get("checkinDate") || "");
  const checkinDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : new Date().toISOString().slice(0, 10);

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("readiness_checkins")
    .upsert({ user_id: user.id, checkin_date: checkinDate, score: parsed.data.score, note: parsed.data.note || null }, { onConflict: "user_id,checkin_date" });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/program");
  return { success: true };
}

/** Start (or resume) a scheduled session. Readiness never gates this: it is only ever advice. */
export async function startProgramDayAction(dayId: string) {
  const { supabase, user } = await requireUser();

  const { data: day } = await supabase.from("user_program_days").select("*").eq("id", dayId).eq("user_id", user.id).maybeSingle();
  if (!day) throw new Error("Session not found");

  // Sessions written by the older category-based builder point at a pre-authored workout.
  if (!day.template && day.workout_id) {
    const progressLogId = await startLegacyDay(supabase, user.id, {
      id: day.id,
      workoutId: day.workout_id,
      planId: day.plan_id,
      week: day.week_number,
      dayNumber: day.day_number,
      category: day.category,
      intensity: day.intensity,
      volumePct: day.volume_pct,
    });
    redirect(`/log/${progressLogId}`);
  }

  const result = await startProgramDay(supabase, user.id, dayId);
  if (!result.ok) throw new Error(result.error);
  redirect(`/log/${result.progressLogId}`);
}

async function startLegacyDay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  d: { id: string; workoutId: string; planId: string | null; week: number; dayNumber: number; category: ModuleCategory; intensity: IntensityLevel; volumePct: number },
): Promise<string> {
  const { data: existing } = await supabase
    .from("progress_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("program_day_id", d.id)
    .is("completed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("progress_logs")
    .insert({
      user_id: userId,
      program_day_id: d.id,
      plan_id: d.planId,
      workout_id: d.workoutId,
      week_number: d.week,
      day_number: d.dayNumber,
      category: d.category,
      intensity: d.intensity,
      volume_pct: d.volumePct,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not start workout");

  const { data: wes } = await supabase.from("workout_exercises").select("id, exercise_id, sets").eq("workout_id", d.workoutId);
  const setRows = (wes ?? []).flatMap((we) =>
    Array.from({ length: we.sets }, (_, i) => ({ progress_log_id: created.id, user_id: userId, workout_exercise_id: we.id, exercise_id: we.exercise_id, set_number: i + 1 })),
  );
  if (setRows.length > 0) await supabase.from("exercise_logs").insert(setRows);
  return created.id;
}

/** The athlete accepted a lighter swap from the readiness notice. */
export async function swapDayAction(dayId: string, mode: "recovery" | "lighter"): Promise<ActionResult> {
  if (mode !== "recovery" && mode !== "lighter") return { error: "Invalid swap" };
  const { supabase, user } = await requireUser();
  const result = await swapDayToLighter(supabase, user.id, dayId, mode);
  if (!result.ok) return { error: result.error };
  refresh();
  return { success: true };
}

export async function syncTimezoneAction(timezone: string): Promise<void> {
  const parsed = timezoneSchema.safeParse(timezone);
  if (!parsed.success) return;
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ timezone: parsed.data }).eq("id", user.id);
}

/**
 * "Edit days": reschedule the active program's still-upcoming sessions onto a new weekday pattern.
 * Content and order are kept; only which day each falls on changes, and a track that now has fewer
 * days than it did drops its last session(s) of the affected weeks. Past and completed sessions never move.
 */
export async function setTrainingDaysAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = setTrainingDaysSchema.safeParse({ trainingDays: formData.getAll("trainingDays") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { supabase, user } = await requireUser();
  const athlete = await loadAthlete(supabase, user.id);
  if (!athlete) return { error: "Profile not found." };
  const { error } = await supabase.rpc("set_training_days", { p_training_days: parsed.data.trainingDays, p_today: athlete.today });
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}
