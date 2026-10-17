// Program lifecycle on top of Supabase: generate, rebuild around locked days, start a
// session, refresh progressive-overload targets and swap a session for a lighter one.
// Every function takes the caller's client, so RLS decides what is visible/writable and
// the same code is used by server actions and by the tests.
import type { EquipmentAccess, ExperienceLevel, Json, SessionFeedback, Tables, TrainingPhase, TrainingSetting } from "../database.types";
import { assignModuleSessions, groupSessions, sessionsDoneFor, type Session } from "./sessions";
import { aggregateProfile, ATTRIBUTES, vectorFromRow, type Attribute } from "./attributes";
import { assembleProgram, buildSingleSession, TEMPLATES, type AssembledDay, type FixedDay, type TemplateId } from "./assembler";
import { blendPositions, buildAssembleInput, loadAthlete, loadContent, loadPosition, type AthleteState, type Client, type Content, type PositionInfo } from "./data";
import { computeAdaptations } from "./adapt";
import { loadExerciseHistory, resolveLoads, type LoadRow } from "./history";
import { parseRepRange, type LoadSuggestion } from "./overload";
import { addDays, diffDays, programDayDate, programPosition, todayISO } from "./periodization";
import { patternsFromCategory, type NearbyEvent, type RecentSession } from "../readiness";

export type ServiceResult = { ok: true; programId: string; days: number; notes: string[] } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export interface GenerateOptions {
  phase?: TrainingPhase;
  emphasis?: Attribute[];
  sessionsPerWeek?: number;
  /** Build for a different position than the profile's. */
  positionId?: string;
  /** undefined = use the profile's; null = none. */
  secondaryPositionId?: string | null;
  level?: ExperienceLevel;
  equipmentAccess?: EquipmentAccess;
  daysPerWeek?: number;
  /** Which weekdays to train on (ISO weekdays, 1=Mon..7=Sun). Sets `daysPerWeek` to its length. */
  trainingDays?: number[];
  sessionMinutes?: number;
}

async function loadBlendedPosition(supabase: Client, primaryId: string, secondaryId: string | null): Promise<PositionInfo | null> {
  const [primary, secondary] = await Promise.all([
    loadPosition(supabase, primaryId),
    secondaryId && secondaryId !== primaryId ? loadPosition(supabase, secondaryId) : Promise.resolve(null),
  ]);
  return primary ? blendPositions(primary, secondary) : null;
}

/** The constraints a stored program was built with, so re-plans and swaps keep respecting them. */
function programConstraints(prog: Tables<"user_programs">, athlete: AthleteState) {
  return {
    secondaryPositionId: prog.secondary_position_id,
    equipmentAccess: prog.equipment_access,
    maxSessions: prog.days_per_week,
    trainingDays: prog.training_days,
    sessionMinutes: prog.session_minutes,
    level: prog.level ?? athlete.level,
  };
}

function adjustmentsJson(athlete: AthleteState): Json {
  const a = computeAdaptations({ feedback: athlete.feedback, checkins: athlete.checkins, today: athlete.today });
  return [
    ...(a.lighten ? [{ kind: "lighten", message: a.lighten.reason }] : []),
    ...a.notes.filter((n) => !a.lighten || n !== a.lighten.reason).map((message) => ({ kind: "progress", message })),
  ] as unknown as Json;
}

// ------------------------------------------------------------------ helpers
function dayJson(day: AssembledDay, loads: Map<string, LoadSuggestion> | null, scale = 1): Json {
  return {
    setting: day.setting,
    week_number: day.weekNumber,
    day_number: day.dayNumber,
    category: day.category,
    intensity: day.intensity,
    volume_pct: day.volumePct,
    title: day.title,
    template: day.template,
    focus: day.focus,
    attribute_profile: day.attributeProfile,
    patterns: day.patterns,
    why_note: day.why,
    note: day.note,
    est_minutes: day.estMinutes,
    deload: day.deload,
    exercises: day.exercises.map((x) => {
      const s = loads?.get(x.exerciseId);
      const w = s?.weight != null ? Math.round((s.weight * scale) / 2.5) * 2.5 : null;
      return {
        exercise_id: x.exerciseId,
        exercise_name: x.name,
        order_index: x.order,
        block: x.block,
        role: x.role,
        sets: x.sets,
        reps: x.reps,
        rest_seconds: x.restSeconds,
        target_weight: w,
        weight_unit: s?.unit ?? "lb",
        rx_note: x.rxNote,
        setting: x.setting,
      };
    }),
  } as unknown as Json;
}

function loadRowsFor(content: Content, days: AssembledDay[]): LoadRow[] {
  const byId = new Map(content.exercises.map((e) => [e.id, e]));
  const seen = new Set<string>();
  const rows: LoadRow[] = [];
  for (const d of days) {
    for (const x of d.exercises) {
      const e = byId.get(x.exerciseId);
      if (!e || seen.has(x.exerciseId)) continue;
      seen.add(x.exerciseId);
      rows.push({ exerciseId: e.id, slug: e.slug, mode: e.mode, pattern: e.pattern, sets: x.sets, reps: x.reps, loadPct: x.loadPct });
    }
  }
  return rows;
}

function rationaleOf(result: ReturnType<typeof assembleProgram>, athlete: AthleteState, position: { name: string; archetypeName: string | null }, emphasis: Attribute[]): Json {
  const first = result.summaries[0];
  return {
    engine: "smart-v2",
    position: position.name,
    archetype: position.archetypeName,
    emphasis,
    effective: first
      ? Object.fromEntries(ATTRIBUTES.map((a) => [a, { value: first.profile.values[a], ...first.profile.parts[a] }]))
      : {},
    weeks: result.summaries.map((s) => ({ week: s.week, mode: s.plan.mode, deload: s.plan.deload, sessions: s.sessions, templates: s.templates, note: s.plan.note })),
    plateaus: athlete.plateaus.map((p) => ({ slug: p.slug, attribute: p.attribute, message: p.message })),
    limitations: athlete.limitations.map((l) => l.area),
    events: athlete.events.length,
    notes: [...result.notes, ...result.summaries.flatMap((s) => s.notes)].slice(0, 24),
  } as unknown as Json;
}

function deloadCarryFor(athlete: AthleteState, deloadEvery: number): number {
  const prev = athlete.activeProgram;
  if (!prev) return 0;
  const elapsed = Math.floor(Math.max(0, diffDays(prev.started_on, athlete.today)) / 7);
  return elapsed >= prev.weeks ? 0 : (prev.deload_carry + elapsed) % deloadEvery;
}

// ------------------------------------------------------------------ generate
export async function generateProgram(supabase: Client, userId: string, opts: GenerateOptions = {}): Promise<ServiceResult> {
  const athlete = await loadAthlete(supabase, userId);
  if (!athlete) return fail("Profile not found.");
  if (!athlete.positionId) return fail("Set your position before building a program.");
  const primaryId = opts.positionId ?? athlete.positionId;
  const secondaryRaw = opts.secondaryPositionId === undefined ? athlete.secondaryPositionId : opts.secondaryPositionId;
  const secondaryId = secondaryRaw && secondaryRaw !== primaryId ? secondaryRaw : null;
  const [content, position] = await Promise.all([loadContent(supabase), loadBlendedPosition(supabase, primaryId, secondaryId)]);
  if (!position) return fail("Could not load your position's training profile.");
  const level = opts.level ?? athlete.level;
  const equipmentAccess = opts.equipmentAccess ?? athlete.equipmentAccess ?? "full_gym";
  const trainingDays = opts.trainingDays ?? athlete.trainingDays ?? null;
  const daysPerWeek = trainingDays?.length ?? opts.daysPerWeek ?? athlete.daysPerWeek ?? null;
  const sessionMinutes = opts.sessionMinutes ?? athlete.sessionMinutes ?? null;
  const phase = opts.phase ?? athlete.phase;
  const cfg = content.phaseConfigs[phase];
  if (!cfg) return fail("Training phase settings are missing.");
  const emphasis = (opts.emphasis ?? []).slice(0, 2);

  const input = buildAssembleInput(content, position, athlete, {
    phase,
    emphasis,
    sessionsPerWeek: opts.sessionsPerWeek,
    startDate: athlete.today,
    newProgram: true,
    secondaryPositionId: secondaryId,
    equipmentAccess,
    maxSessions: daysPerWeek,
    trainingDays,
    sessionMinutes,
    level,
    deloadCarry: deloadCarryFor(athlete, cfg.deloadEvery),
  });
  const result = assembleProgram(input);
  if (result.days.length === 0) return fail("No training could be built for your position yet.");

  const loads = await resolveLoads(supabase, userId, loadRowsFor(content, result.days.filter((d) => d.weekNumber === 1)), athlete.today);

  const { data: program, error: pErr } = await supabase
    .from("user_programs")
    .insert({
      user_id: userId,
      position_id: primaryId,
      secondary_position_id: secondaryId,
      equipment_access: equipmentAccess,
      days_per_week: daysPerWeek,
      training_days: trainingDays,
      session_minutes: sessionMinutes,
      level,
      adjustments: adjustmentsJson(athlete),
      phase,
      sessions_per_week: result.sessionsPerWeek,
      emphasis_attributes: emphasis,
      status: "archived", // activated below once every day has been written
      started_on: athlete.today,
      weeks: result.weeks,
      deload_carry: input.deloadCarry ?? 0,
      target_date: athlete.target?.date ?? null,
      target_event: athlete.target?.event ?? null,
      rationale: rationaleOf(result, athlete, position, emphasis),
    })
    .select("id")
    .single();
  if (pErr || !program) return fail(pErr?.message ?? "Could not create the program.");

  const week1 = new Set(result.days.filter((d) => d.weekNumber === 1).map((d) => d.date));
  const daysJson = result.days.map((d) => dayJson(d, week1.has(d.date) ? loads : null));
  const { error: rpcErr } = await supabase.rpc("replace_program_days", { p_program_id: program.id, p_from_date: "1900-01-01", p_days: daysJson });
  if (rpcErr) {
    await supabase.from("user_programs").delete().eq("id", program.id);
    return fail(rpcErr.message);
  }

  await supabase.from("user_programs").update({ status: "archived", archived_at: new Date().toISOString() }).eq("user_id", userId).eq("status", "active");
  const { error: actErr } = await supabase.from("user_programs").update({ status: "active" }).eq("id", program.id);
  if (actErr) return fail(actErr.message);
  // Remember the answers so the build screen is prefilled next time.
  await supabase
    .from("profiles")
    .update({
      training_phase: phase,
      level,
      equipment_access: equipmentAccess,
      days_per_week: daysPerWeek,
      training_days: trainingDays,
      session_minutes: sessionMinutes,
      position_id: primaryId,
      secondary_position_id: secondaryId,
    })
    .eq("id", userId);

  return { ok: true, programId: program.id, days: result.days.length, notes: result.summaries.flatMap((s) => s.notes).slice(0, 6) };
}

/**
 * START A NEW TRAINING BLOCK: the full regeneration. If a program is running it gets archived (kept, with
 * everything logged against it), so this refuses to go ahead unless the athlete confirmed exactly that.
 */
export async function startNewBlock(supabase: Client, userId: string, opts: GenerateOptions, confirmArchive: boolean): Promise<ServiceResult> {
  const { data: running } = await supabase.from("user_programs").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (running && !confirmArchive) return fail("Confirm that your current program will be archived to start a new block.");
  return generateProgram(supabase, userId, opts);
}

// ------------------------------------------------------------------ rebuild
export interface RebuildOptions {
  phase?: TrainingPhase;
  emphasis?: Attribute[];
  /** Force different exercise rotation (used when a plateau is detected). */
  variation?: number;
  /** Adjust program: change the main / second position in place. `undefined` keeps the current one. */
  positionId?: string;
  secondaryPositionId?: string | null;
  /** Adjust program: change which weekdays are trained. `undefined` keeps the program's current pattern. */
  trainingDays?: number[];
}

/**
 * Re-plan the rest of the active block after something changed (calendar, limitation flag,
 * target date, phase, emphasis, a plateau). Days that are in the past or already have a log
 * are locked; everything else is replaced in one transaction.
 */
export async function rebuildProgram(supabase: Client, userId: string, opts: RebuildOptions = {}): Promise<ServiceResult> {
  const athlete = await loadAthlete(supabase, userId);
  if (!athlete) return fail("Profile not found.");
  const prog = athlete.activeProgram;
  if (!prog) return fail("No active program to adjust.");
  if (programPosition(prog.started_on, athlete.today, prog.weeks).finished) {
    return generateProgram(supabase, userId, { phase: opts.phase, emphasis: opts.emphasis ?? prog.emphasis_attributes, positionId: opts.positionId, secondaryPositionId: opts.secondaryPositionId, trainingDays: opts.trainingDays });
  }

  const { data: dayRows } = await supabase
    .from("user_program_days")
    .select("id, week_number, day_number, setting, template, intensity, patterns, user_program_day_exercises(exercise_id)")
    .eq("program_id", prog.id);
  const days = dayRows ?? [];
  if (days.length === 0 || days.some((d) => !d.template)) {
    // A program written by the older category-based builder: replace it with a smart one.
    return generateProgram(supabase, userId, { phase: opts.phase, emphasis: opts.emphasis ?? prog.emphasis_attributes, positionId: opts.positionId, secondaryPositionId: opts.secondaryPositionId, trainingDays: opts.trainingDays });
  }

  const trainingDays = opts.trainingDays ?? prog.training_days ?? undefined;
  const daysPerWeek = trainingDays?.length ?? prog.days_per_week;
  const primaryId = opts.positionId ?? prog.position_id;
  const secondaryRaw = opts.secondaryPositionId === undefined ? prog.secondary_position_id : opts.secondaryPositionId;
  const secondaryId = secondaryRaw && secondaryRaw !== primaryId ? secondaryRaw : null;
  const [content, position] = await Promise.all([
    loadContent(supabase),
    primaryId ? loadBlendedPosition(supabase, primaryId, secondaryId) : Promise.resolve(null),
  ]);
  if (!position) return fail("Could not load your position's training profile.");
  const phase = opts.phase ?? prog.phase;
  const cfg = content.phaseConfigs[phase];
  if (!cfg) return fail("Training phase settings are missing.");
  const emphasis = (opts.emphasis ?? prog.emphasis_attributes).slice(0, 2);

  const { data: logRows } = await supabase.from("progress_logs").select("program_day_id").eq("user_id", userId).in("program_day_id", days.map((d) => d.id));
  const logged = new Set((logRows ?? []).map((l) => l.program_day_id));
  const byId = new Map(content.exercises.map((e) => [e.id, e]));

  const fixed: FixedDay[] = days
    .filter((d) => logged.has(d.id) || programDayDate(prog.started_on, d.week_number, d.day_number) < athlete.today)
    .map((d) => {
      const ids = (d.user_program_day_exercises ?? []).map((x) => x.exercise_id).filter((x): x is string => !!x);
      return {
        week: d.week_number,
        dayNumber: d.day_number,
        setting: d.setting === "field" ? ("field" as const) : ("weight_room" as const),
        template: d.template as TemplateId,
        intensity: d.intensity,
        exerciseIds: ids,
        heavyPatterns: d.intensity === "low" ? [] : d.patterns,
        loadedAreas: [...new Set(ids.flatMap((id) => byId.get(id)?.loadedAreas ?? []))],
      };
    });

  const input = buildAssembleInput(content, position, athlete, {
    phase,
    emphasis,
    sessionsPerWeek: phase === prog.phase ? prog.sessions_per_week : undefined,
    startDate: prog.started_on,
    fromDate: athlete.today,
    weeks: prog.weeks,
    deloadCarry: prog.deload_carry,
    fixed,
    variation: opts.variation,
    ...programConstraints(prog, athlete),
    secondaryPositionId: secondaryId,
    trainingDays,
    maxSessions: daysPerWeek,
  });
  const result = assembleProgram(input);

  const soon = addDays(athlete.today, 7);
  const loads = await resolveLoads(supabase, userId, loadRowsFor(content, result.days.filter((d) => d.date < soon)), athlete.today);
  const daysJson = result.days.map((d) => dayJson(d, d.date < soon ? loads : null));

  const { error: rpcErr } = await supabase.rpc("replace_program_days", { p_program_id: prog.id, p_from_date: athlete.today, p_days: daysJson });
  if (rpcErr) return fail(rpcErr.message);

  const { error: upErr } = await supabase
    .from("user_programs")
    .update({
      phase,
      position_id: primaryId,
      secondary_position_id: secondaryId,
      days_per_week: daysPerWeek,
      training_days: trainingDays ?? null,
      sessions_per_week: result.sessionsPerWeek,
      emphasis_attributes: emphasis,
      target_date: athlete.target?.date ?? null,
      target_event: athlete.target?.event ?? null,
      adjustments: adjustmentsJson(athlete),
      rationale: rationaleOf(result, athlete, position, emphasis),
    })
    .eq("id", prog.id);
  if (upErr) return fail(upErr.message);
  const profilePatch: { training_phase?: TrainingPhase; position_id?: string | null; secondary_position_id?: string | null; days_per_week?: number | null; training_days?: number[] | null } = {};
  if (phase !== athlete.phase) profilePatch.training_phase = phase;
  if (primaryId !== prog.position_id || secondaryId !== prog.secondary_position_id) Object.assign(profilePatch, { position_id: primaryId, secondary_position_id: secondaryId });
  if (opts.trainingDays) Object.assign(profilePatch, { days_per_week: daysPerWeek, training_days: trainingDays ?? null });
  if (Object.keys(profilePatch).length > 0) await supabase.from("profiles").update(profilePatch).eq("id", userId);

  return { ok: true, programId: prog.id, days: result.days.length, notes: result.summaries.flatMap((s) => s.notes).slice(0, 6) };
}

// ------------------------------------------------------------------ day targets
export interface DayExerciseRow extends Tables<"user_program_day_exercises"> {
  exercise: {
    slug: string;
    movement_pattern: string | null;
    prescription_mode: Tables<"exercises">["prescription_mode"];
    description: string | null;
    equipment: string | null;
    attr_speed: number;
    attr_strength: number;
    attr_power: number;
    attr_agility: number;
    attr_coordination: number;
    attr_conditioning: number;
    attr_mobility: number;
  } | null;
}

export async function loadDayExercises(supabase: Client, dayId: string): Promise<DayExerciseRow[]> {
  const { data } = await supabase
    .from("user_program_day_exercises")
    .select("*, exercise:exercises(slug, movement_pattern, prescription_mode, description, equipment, attr_speed, attr_strength, attr_power, attr_agility, attr_coordination, attr_conditioning, attr_mobility)")
    .eq("program_day_id", dayId)
    .order("order_index");
  return (data ?? []) as unknown as DayExerciseRow[];
}

/** Current overload suggestion for each loaded exercise of a day (no writes). */
export async function dayTargets(supabase: Client, userId: string, rows: DayExerciseRow[], today: string): Promise<Map<string, LoadSuggestion>> {
  const loadRows: LoadRow[] = rows
    .filter((r) => r.exercise_id && r.exercise)
    .map((r) => ({
      exerciseId: r.exercise_id!,
      slug: r.exercise!.slug,
      mode: r.exercise!.prescription_mode,
      pattern: r.exercise!.movement_pattern as LoadRow["pattern"],
      sets: r.sets,
      reps: r.reps,
      loadPct: /(\d+)%/.exec(r.rx_note ?? "") ? Number(/(\d+)%/.exec(r.rx_note ?? "")![1]) : null,
    }));
  return resolveLoads(supabase, userId, loadRows, today);
}

/** Persist fresh targets onto a day that has not been started, so what was planned reflects the latest history. */
export async function refreshDayTargets(supabase: Client, userId: string, dayId: string, today: string): Promise<{ changed: number }> {
  const rows = await loadDayExercises(supabase, dayId);
  const targets = await dayTargets(supabase, userId, rows, today);
  let changed = 0;
  for (const r of rows) {
    if (!r.exercise_id) continue;
    const t = targets.get(r.exercise_id);
    if (!t || t.weight == null) continue;
    if (r.target_weight !== null && Number(r.target_weight) === t.weight && r.weight_unit === t.unit) continue;
    const { error } = await supabase.from("user_program_day_exercises").update({ target_weight: t.weight, weight_unit: t.unit }).eq("id", r.id);
    if (!error) changed++;
  }
  return { changed };
}

// ------------------------------------------------------------------ start a session
/**
 * Start (or resume) a program day. A day is one session in one track (gym or field), with its own
 * progress log and sets; the log records the track in `progress_logs.setting`.
 */
export async function startProgramDay(supabase: Client, userId: string, dayId: string): Promise<{ ok: true; progressLogId: string; setting: Session } | { ok: false; error: string }> {
  const { data: day } = await supabase.from("user_program_days").select("*").eq("id", dayId).eq("user_id", userId).maybeSingle();
  if (!day) return fail("Session not found.");

  const athlete = await loadAthlete(supabase, userId);
  const today = athlete?.today ?? todayISO(null);
  await refreshDayTargets(supabase, userId, dayId, today);
  const allRows = await loadDayExercises(supabase, dayId);
  const sessions = groupSessions(allRows.map((r) => ({ ...r, setting: r.setting })));
  if (sessions.length === 0) return fail("This day has no exercises.");

  const { data: logs } = await supabase.from("progress_logs").select("id, completed_at, setting").eq("user_id", userId).eq("program_day_id", dayId).order("created_at", { ascending: false });
  // a day is one session in one track: that track is the session
  const pick: Session = day.setting === "field" ? "field" : "weight_room";
  const session = sessions.find((s2) => s2.setting === pick);
  if (!session) return fail("That session isn't part of this day.");

  const existing = (logs ?? []).find((l) => !l.completed_at && (l.setting === pick || l.setting === null));
  if (existing) return { ok: true, progressLogId: existing.id, setting: pick };

  const rows = session.rows;
  const patterns = [...new Set(rows.map((r) => r.exercise?.movement_pattern).filter((p): p is NonNullable<typeof p> => !!p))];
  const profile = aggregateProfile(rows.filter((r) => r.exercise).map((r) => ({ attrs: vectorFromRow(r.exercise!), sets: r.sets })));

  const { data: log, error } = await supabase
    .from("progress_logs")
    .insert({
      user_id: userId,
      program_day_id: dayId,
      setting: pick,
      week_number: day.week_number,
      day_number: day.day_number,
      category: day.category,
      intensity: day.intensity,
      volume_pct: day.volume_pct,
      patterns: patterns as never,
      attribute_profile: profile as unknown as Json,
      supplemental: false,
    })
    .select("id")
    .single();
  if (error || !log) return fail(error?.message ?? "Could not start the session.");

  const setRows = rows.flatMap((r) =>
    Array.from({ length: r.sets }, (_, i) => ({
      progress_log_id: log.id,
      user_id: userId,
      program_day_exercise_id: r.id,
      exercise_id: r.exercise_id,
      set_number: i + 1,
      weight: r.target_weight,
      weight_unit: r.weight_unit,
    })),
  );
  if (setRows.length > 0) {
    const { error: setErr } = await supabase.from("exercise_logs").insert(setRows);
    if (setErr) {
      await supabase.from("progress_logs").delete().eq("id", log.id);
      return fail(setErr.message);
    }
  }
  return { ok: true, progressLogId: log.id, setting: pick };
}

export const sessionsDone = sessionsDoneFor;

// ------------------------------------------------------------------ swap
export type SwapMode = "recovery" | "lighter";

export async function swapDayToLighter(supabase: Client, userId: string, dayId: string, mode: SwapMode): Promise<{ ok: true } | { ok: false; error: string }> {
  const athlete = await loadAthlete(supabase, userId);
  const prog = athlete?.activeProgram;
  if (!athlete || !prog) return fail("No active program.");
  const { data: day } = await supabase.from("user_program_days").select("*").eq("id", dayId).eq("user_id", userId).maybeSingle();
  if (!day || day.program_id !== prog.id) return fail("Session not found.");
  if (!day.template) return fail("This session was built by an older version and can't be swapped. Rebuild your week to get adjustable sessions.");

  const [content, position] = await Promise.all([
    loadContent(supabase),
    prog.position_id ? loadBlendedPosition(supabase, prog.position_id, prog.secondary_position_id) : Promise.resolve(null),
  ]);
  if (!position) return fail("Could not load your position's training profile.");

  const { data: siblings } = await supabase
    .from("user_program_days")
    .select("id, user_program_day_exercises(exercise_id)")
    .eq("program_id", prog.id)
    .eq("week_number", day.week_number)
    .neq("id", dayId);
  const usedElsewhere = (siblings ?? []).flatMap((s) => (s.user_program_day_exercises ?? []).map((x) => x.exercise_id)).filter((x): x is string => !!x);

  const input = buildAssembleInput(content, position, athlete, {
    phase: prog.phase,
    emphasis: prog.emphasis_attributes,
    startDate: prog.started_on,
    weeks: prog.weeks,
    deloadCarry: prog.deload_carry,
    ...programConstraints(prog, athlete),
    lighten: null,
  });
  const template: TemplateId = mode === "recovery" ? "recovery" : (day.template as TemplateId);
  if (!TEMPLATES[template]) return fail("Unknown session type.");
  const lighter = mode === "recovery" || TEMPLATES[template].intensity === "low";
  const built = buildSingleSession(input, {
    week: day.week_number,
    dayNumber: day.day_number,
    template,
    track: day.setting === "field" ? "field" : "weight_room",
    intensity: lighter ? "low" : "moderate",
    volumePct: mode === "recovery" ? 70 : Math.min(day.volume_pct, 60),
    usedElsewhere,
    note: mode === "recovery" ? "Swapped to a recovery session." : "A lighter version of this session.",
  });
  const loads = mode === "lighter" ? await resolveLoads(supabase, userId, loadRowsFor(content, [built]), athlete.today) : null;
  const { error } = await supabase.rpc("replace_program_day", { p_day_id: dayId, p_day: dayJson(built, loads, 0.85) });
  return error ? fail(error.message) : { ok: true };
}

// ------------------------------------------------------------------ readiness context
/** Everything the athlete completed in the last 3 days, including standalone modules. */
export async function loadRecentSessions(supabase: Client, userId: string, athlete: Pick<AthleteState, "today" | "timezone">): Promise<RecentSession[]> {
  const since = new Date(`${addDays(athlete.today, -3)}T00:00:00Z`).toISOString();
  const { data } = await supabase
    .from("progress_logs")
    .select("completed_at, intensity, category, patterns, supplemental, workout:workouts(name)")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", since)
    .order("completed_at", { ascending: false });
  const out: RecentSession[] = [];
  for (const l of data ?? []) {
    const doneOn = todayISO(athlete.timezone, new Date(l.completed_at!));
    const daysAgo = diffDays(doneOn, athlete.today);
    if (daysAgo < 0 || daysAgo > 3) continue;
    const workout = l.workout as unknown as { name: string } | null;
    out.push({
      daysAgo,
      intensity: l.intensity,
      patterns: l.patterns.length > 0 ? l.patterns : patternsFromCategory(l.category),
      supplemental: l.supplemental,
      title: workout?.name ?? null,
    });
  }
  return out;
}

export function nearbyEvents(athlete: Pick<AthleteState, "today" | "events">): NearbyEvent[] {
  return athlete.events
    .map((e) => ({ offset: diffDays(athlete.today, e.date), type: e.type }))
    .filter((e) => e.offset >= -1 && e.offset <= 1);
}

// ------------------------------------------------------------------ standalone modules
/**
 * Start a workout from the module library. It is logged exactly like an assembled session
 * (movement patterns, attribute profile, intensity) so readiness, history and overload all see
 * it. When the athlete also has an active assembled program it is flagged `supplemental`.
 */
export async function startModuleWorkout(
  supabase: Client,
  userId: string,
  input: { userPlanId: string; planWorkoutId: string; workoutId: string; weekNumber: number; dayNumber: number; setting?: Session },
): Promise<{ ok: true; progressLogId: string; setting: Session } | { ok: false; error: string }> {
  const [{ data: userPlan }, { data: workout }, { data: wes }, { data: activeProgram }, athlete, { data: priorLogs }] = await Promise.all([
    supabase.from("user_plans").select("plan_id, plans(category, intensity)").eq("id", input.userPlanId).eq("user_id", userId).maybeSingle(),
    supabase.from("workouts").select("intensity").eq("id", input.workoutId).maybeSingle(),
    supabase
      .from("workout_exercises")
      .select("id, exercise_id, sets, reps, exercise:exercises(slug, movement_pattern, prescription_mode, setting, attr_speed, attr_strength, attr_power, attr_agility, attr_coordination, attr_conditioning, attr_mobility)")
      .eq("workout_id", input.workoutId)
      .order("order_index"),
    supabase.from("user_programs").select("id").eq("user_id", userId).eq("status", "active").maybeSingle(),
    loadAthlete(supabase, userId),
    supabase.from("progress_logs").select("id, completed_at, setting").eq("user_id", userId).eq("plan_workout_id", input.planWorkoutId),
  ]);
  if (!userPlan) return fail("You are not enrolled in that module.");
  const plan = userPlan.plans as unknown as { category: Tables<"plans">["category"]; intensity: Tables<"plans">["intensity"] } | null;

  type WeExercise = { slug: string; movement_pattern: LoadRow["pattern"]; prescription_mode: LoadRow["mode"]; setting: TrainingSetting } & Parameters<typeof vectorFromRow>[0];
  const all = (wes ?? []).map((we) => ({ we, ex: we.exercise as unknown as WeExercise | null, setting: ((we.exercise as unknown as WeExercise | null)?.setting ?? "either") as TrainingSetting }));
  const withSessions = assignModuleSessions(all);
  const present = groupSessions(withSessions.map((i) => ({ ...i, setting: i.session }))).map((g) => g.setting);
  if (present.length === 0) return fail("This workout has no exercises.");

  const done = new Set((priorLogs ?? []).filter((l) => l.completed_at).map((l) => l.setting));
  const legacyDone = done.has(null);
  const pick = input.setting ?? present.find((st) => !legacyDone && !done.has(st)) ?? present[0];
  if (!present.includes(pick)) return fail("That session isn't part of this workout.");
  const existing = (priorLogs ?? []).find((l) => !l.completed_at && (l.setting === pick || l.setting === null));
  if (existing) return { ok: true, progressLogId: existing.id, setting: pick };

  const items = withSessions.filter((i) => i.session === pick);
  const patterns = [...new Set(items.map((i) => i.ex?.movement_pattern).filter((p): p is NonNullable<typeof p> => !!p))];
  const profile = aggregateProfile(items.filter((i) => i.ex).map((i) => ({ attrs: vectorFromRow(i.ex!), sets: i.we.sets })));

  const { data: log, error } = await supabase
    .from("progress_logs")
    .insert({
      user_id: userId,
      user_plan_id: input.userPlanId,
      plan_workout_id: input.planWorkoutId,
      workout_id: input.workoutId,
      plan_id: userPlan.plan_id,
      setting: pick,
      category: plan?.category ?? null,
      intensity: workout?.intensity ?? plan?.intensity ?? null,
      week_number: input.weekNumber,
      day_number: input.dayNumber,
      patterns,
      attribute_profile: profile as unknown as Json,
      supplemental: !!activeProgram,
    })
    .select("id")
    .single();
  if (error || !log) return fail(error?.message ?? "Could not start workout.");

  const loads = await resolveLoads(
    supabase,
    userId,
    items.filter((i) => i.we.exercise_id && i.ex).map((i) => ({ exerciseId: i.we.exercise_id!, slug: i.ex!.slug, mode: i.ex!.prescription_mode, pattern: i.ex!.movement_pattern, sets: i.we.sets, reps: i.we.reps, loadPct: null })),
    athlete?.today ?? todayISO(null),
  );
  const setRows = items.flatMap(({ we }) =>
    Array.from({ length: we.sets }, (_, i) => {
      const s = we.exercise_id ? loads.get(we.exercise_id) : undefined;
      return {
        progress_log_id: log.id,
        user_id: userId,
        workout_exercise_id: we.id,
        exercise_id: we.exercise_id,
        set_number: i + 1,
        weight: s?.weight ?? null,
        weight_unit: s?.unit ?? ("lb" as const),
      };
    }),
  );
  if (setRows.length > 0) {
    const { error: setErr } = await supabase.from("exercise_logs").insert(setRows);
    if (setErr) {
      await supabase.from("progress_logs").delete().eq("id", log.id);
      return fail(setErr.message);
    }
  }
  return { ok: true, progressLogId: log.id, setting: pick };
}

/** The sessions a module workout is made of, in order (used by the dashboard and module pages). */
export async function moduleWorkoutSessions(supabase: Client, workoutId: string): Promise<Session[]> {
  const { data } = await supabase.from("workout_exercises").select("order_index, exercise:exercises(setting)").eq("workout_id", workoutId).order("order_index");
  const items = (data ?? []).map((r) => ({ setting: ((r.exercise as unknown as { setting: TrainingSetting } | null)?.setting ?? "either") as TrainingSetting }));
  return groupSessions(assignModuleSessions(items).map((i) => ({ setting: i.session }))).map((g) => g.setting);
}

// ------------------------------------------------------------------ plateau response
/**
 * After a metric is logged (or removed): if the set of plateaued metrics changed since the
 * active program was built, re-plan so the affected area gets extra emphasis and new exercises.
 */
export async function replanIfPlateauChanged(supabase: Client, userId: string): Promise<{ rebuilt: boolean }> {
  const athlete = await loadAthlete(supabase, userId);
  const prog = athlete?.activeProgram;
  if (!athlete || !prog) return { rebuilt: false };
  const rationale = (prog.rationale ?? {}) as { plateaus?: { slug: string }[] };
  const before = (rationale.plateaus ?? []).map((p) => p.slug).sort().join(",");
  const now = athlete.plateaus.map((p) => p.slug).sort().join(",");
  if (before === now) return { rebuilt: false };
  const result = await rebuildProgram(supabase, userId);
  return { rebuilt: result.ok };
}

// ------------------------------------------------------------------ feedback loop
/** Record the one-tap "too easy / just right / too hard" after a finished session, then adapt. */
export async function submitSessionFeedback(
  supabase: Client,
  userId: string,
  progressLogId: string,
  value: SessionFeedback,
): Promise<{ ok: true; adapted: string[] } | { ok: false; error: string }> {
  const { data: log } = await supabase.from("progress_logs").select("id, completed_at").eq("id", progressLogId).eq("user_id", userId).maybeSingle();
  if (!log) return fail("Session not found.");
  if (!log.completed_at) return fail("Finish the session before rating it.");
  const { error } = await supabase
    .from("progress_logs")
    .update({ feedback: value, feedback_at: new Date().toISOString() })
    .eq("id", progressLogId)
    .eq("user_id", userId);
  if (error) return fail(error.message);

  const athlete = await loadAthlete(supabase, userId);
  const prog = athlete?.activeProgram;
  const adapted: string[] = [];
  if (athlete && prog) {
    const now = computeAdaptations({ feedback: athlete.feedback, checkins: athlete.checkins, today: athlete.today });
    const before = ((prog.adjustments ?? []) as unknown as { kind: string; message: string }[]).find((a) => a.kind === "lighten")?.message ?? null;
    if ((now.lighten?.reason ?? null) !== before) {
      const r = await rebuildProgram(supabase, userId);
      if (r.ok && now.lighten) adapted.push(now.lighten.reason);
    } else {
      await supabase.from("user_programs").update({ adjustments: adjustmentsJson(athlete) }).eq("id", prog.id);
    }
    // upcoming weights reflect the rating straight away
    const { data: upcoming } = await supabase.from("user_program_days").select("id, week_number, day_number").eq("program_id", prog.id);
    for (const d of upcoming ?? []) {
      const date = programDayDate(prog.started_on, d.week_number, d.day_number);
      if (date >= athlete.today && date <= addDays(athlete.today, 7)) await refreshDayTargets(supabase, userId, d.id, athlete.today);
    }
  }
  return { ok: true, adapted };
}

// ------------------------------------------------------------------ one-tap logging
/**
 * "Completed as prescribed": every set not yet ticked off is filled with its prefilled numbers
 * (or the prescription: top of the rep range, target weight) and marked done. Sets the athlete
 * already changed keep their numbers, so manual entry is only needed where it differs.
 */
export async function completeAsPrescribed(
  supabase: Client,
  userId: string,
  progressLogId: string,
  only?: { programDayExerciseId?: string; workoutExerciseId?: string },
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  const { data: log } = await supabase.from("progress_logs").select("id, completed_at").eq("id", progressLogId).eq("user_id", userId).maybeSingle();
  if (!log) return fail("Session not found.");
  if (log.completed_at) return fail("This session is already finished.");
  const { data: sets } = await supabase.from("exercise_logs").select("*").eq("progress_log_id", progressLogId).eq("user_id", userId);
  const pdeIds = [...new Set((sets ?? []).map((x) => x.program_day_exercise_id).filter((x): x is string => !!x))];
  const weIds = [...new Set((sets ?? []).map((x) => x.workout_exercise_id).filter((x): x is string => !!x))];
  const [{ data: pde }, { data: we }] = await Promise.all([
    pdeIds.length ? supabase.from("user_program_day_exercises").select("id, reps, target_weight").in("id", pdeIds) : Promise.resolve({ data: [] as { id: string; reps: string; target_weight: number | null }[] }),
    weIds.length ? supabase.from("workout_exercises").select("id, reps").in("id", weIds) : Promise.resolve({ data: [] as { id: string; reps: string }[] }),
  ]);
  const pdeMap = new Map((pde ?? []).map((r) => [r.id, r]));
  const weMap = new Map((we ?? []).map((r) => [r.id, r]));
  let updated = 0;
  for (const st of sets ?? []) {
    if (st.completed) continue;
    if (only?.programDayExerciseId && st.program_day_exercise_id !== only.programDayExerciseId) continue;
    if (only?.workoutExerciseId && st.workout_exercise_id !== only.workoutExerciseId) continue;
    const p = st.program_day_exercise_id ? pdeMap.get(st.program_day_exercise_id) : null;
    const w = st.workout_exercise_id ? weMap.get(st.workout_exercise_id) : null;
    const repsText = p?.reps ?? w?.reps ?? "";
    const reps = st.reps_completed ?? parseRepRange(repsText)?.max ?? null;
    const weight = st.weight ?? (p?.target_weight != null ? Number(p.target_weight) : null);
    const { error } = await supabase.from("exercise_logs").update({ reps_completed: reps, weight, completed: true }).eq("id", st.id).eq("user_id", userId);
    if (!error) updated++;
  }
  return { ok: true, updated };
}

/** Last logged top weight x reps per exercise (to prefill and to show "last time"). */
export async function lastLogged(supabase: Client, userId: string, exerciseIds: string[]): Promise<Map<string, { weight: number; reps: number[]; unit: string }>> {
  const hist = await loadExerciseHistory(supabase, userId, exerciseIds);
  const out = new Map<string, { weight: number; reps: number[]; unit: string }>();
  for (const [id, sessions] of hist) {
    const s = sessions[0];
    const done = s?.sets.filter((x) => x.completed && x.weight) ?? [];
    if (!s || done.length === 0) continue;
    const top = Math.max(...done.map((x) => x.weight as number));
    out.set(id, { weight: top, reps: done.filter((x) => x.weight === top).map((x) => x.reps ?? 0), unit: s.unit });
  }
  return out;
}
