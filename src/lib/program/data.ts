// Loads everything the assembler needs from Supabase. All reads go through the
// caller's client, so RLS applies: athletes only ever see their own rows, and
// content tables are public-read.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EquipmentAccess, ExperienceLevel, LimitationBodyArea, LimitationSide, Tables, TrainingPhase } from "../database.types";
import { ATTRIBUTES, emptyVector, vectorFromRow, type Attribute, type AttributeVector } from "./attributes";
import type { AssembleInput, ExerciseInput, PhaseConfig } from "./assembler";
import type { CalendarEvent } from "./periodization";
import { addDays, todayISO } from "./periodization";
import { computeAdaptations, type FeedbackPoint, type Lightening } from "./adapt";
import { detectPlateaus, plateauAttributes, type MetricSeries, type Plateau } from "./plateau";
import type { RolePrescription } from "./prescription";

export type Client = SupabaseClient<Database>;

export interface Content {
  exercises: ExerciseInput[];
  phaseModifiers: Record<TrainingPhase, Partial<AttributeVector>>;
  phaseConfigs: Record<TrainingPhase, PhaseConfig>;
}

export async function loadContent(supabase: Client): Promise<Content> {
  const [{ data: ex, error: exErr }, { data: mods }, { data: cfgs }] = await Promise.all([
    supabase
      .from("exercises")
      .select(
        "id, name, slug, attr_speed, attr_strength, attr_power, attr_agility, attr_coordination, attr_conditioning, attr_mobility, movement_pattern, prescription_mode, loaded_areas, equipment_tier, min_level, setting, exercise_positions(position_id), exercise_role_prescriptions(role, sets, reps, load_pct, tempo)",
      )
      .order("name"),
    supabase.from("phase_attribute_modifiers").select("phase, attribute, modifier"),
    supabase.from("training_phase_config").select("*"),
  ]);
  if (exErr) throw new Error(exErr.message);

  const exercises: ExerciseInput[] = (ex ?? []).map((row) => {
    const rp: Partial<Record<Attribute, RolePrescription>> = {};
    for (const r of row.exercise_role_prescriptions ?? []) {
      rp[r.role] = { sets: r.sets, reps: r.reps, loadPct: r.load_pct, tempo: r.tempo };
    }
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      attrs: vectorFromRow(row),
      pattern: row.movement_pattern,
      mode: row.prescription_mode,
      loadedAreas: row.loaded_areas ?? [],
      positionScope: (row.exercise_positions ?? []).map((p) => p.position_id),
      setting: row.setting === "recovery" ? "either" : row.setting,
      tier: row.equipment_tier,
      minLevel: row.min_level,
      rolePrescriptions: rp,
    };
  });

  const phaseModifiers = {} as Content["phaseModifiers"];
  for (const m of mods ?? []) (phaseModifiers[m.phase] ??= {})[m.attribute] = m.modifier;
  const phaseConfigs = {} as Content["phaseConfigs"];
  for (const c of cfgs ?? []) {
    phaseConfigs[c.phase] = {
      sessionsPerWeek: c.sessions_per_week,
      volumePct: c.volume_pct,
      maxHighIntensity: c.max_high_intensity_sessions,
      maxSessionIntensity: c.max_session_intensity,
      deloadEvery: c.deload_every_weeks,
    };
  }
  return { exercises, phaseModifiers, phaseConfigs };
}

export interface PositionInfo {
  id: string;
  name: string;
  archetypeName: string | null;
  base: AttributeVector;
  rotational: boolean;
  notes: Partial<Record<Attribute, string>>;
}

export async function loadPosition(supabase: Client, positionId: string): Promise<PositionInfo | null> {
  const [{ data: pos }, { data: needs }, { data: notes }] = await Promise.all([
    supabase.from("positions").select("id, name, archetype:position_archetypes(name)").eq("id", positionId).maybeSingle(),
    supabase.from("position_needs_profiles").select("*").eq("position_id", positionId).maybeSingle(),
    supabase.from("position_attribute_notes").select("attribute, note").eq("position_id", positionId),
  ]);
  if (!pos) return null;
  const archetype = pos.archetype as unknown as { name: string } | null;
  const nm: Partial<Record<Attribute, string>> = {};
  for (const n of notes ?? []) nm[n.attribute] = n.note;
  return {
    id: pos.id,
    name: pos.name,
    archetypeName: archetype?.name ?? null,
    base: needs ? vectorFromRow(needs) : emptyVector(5),
    rotational: needs?.rotational ?? false,
    notes: nm,
  };
}

/** A two-position athlete: needs are a 65/35 blend, rotational if either position needs it, notes from the primary. */
export function blendPositions(primary: PositionInfo, secondary: PositionInfo | null): PositionInfo {
  if (!secondary) return primary;
  const base = emptyVector();
  for (const a of ATTRIBUTES) base[a] = Math.round(primary.base[a] * 0.65 + secondary.base[a] * 0.35);
  return { ...primary, base, rotational: primary.rotational || secondary.rotational, archetypeName: primary.archetypeName };
}

export async function loadMetricSeries(supabase: Client, userId: string): Promise<MetricSeries[]> {
  const [{ data: defs }, { data: logs }] = await Promise.all([
    supabase.from("metric_definitions").select("id, slug, name, unit, direction, attribute"),
    supabase.from("metric_logs").select("metric_id, value, logged_on").eq("user_id", userId).order("logged_on", { ascending: true }).limit(2000),
  ]);
  const byMetric = new Map<string, { value: number; date: string }[]>();
  for (const l of logs ?? []) {
    const list = byMetric.get(l.metric_id) ?? [];
    list.push({ value: Number(l.value), date: l.logged_on });
    byMetric.set(l.metric_id, list);
  }
  return (defs ?? [])
    .filter((d) => byMetric.has(d.id))
    .map((d) => ({ slug: d.slug, name: d.name, unit: d.unit, direction: d.direction, attribute: d.attribute, logs: byMetric.get(d.id)! }));
}

export interface AthleteState {
  userId: string;
  /** The athlete's calendar date (their timezone when known). */
  today: string;
  positionId: string | null;
  phase: TrainingPhase;
  level: ExperienceLevel | null;
  timezone: string | null;
  target: { date: string; event: string | null } | null;
  limitations: { id: string; area: LimitationBodyArea; side: LimitationSide; note: string | null }[];
  events: (CalendarEvent & { id: string; note: string | null })[];
  plateaus: Plateau[];
  plateauAttributes: Attribute[];
  activeProgram: Tables<"user_programs"> | null;
  secondaryPositionId: string | null;
  /** Saved defaults that prefill the build screen. */
  equipmentAccess: EquipmentAccess | null;
  daysPerWeek: number | null;
  /** Which weekdays the athlete trains (ISO weekdays, 1=Mon..7=Sun). null = not chosen yet. */
  trainingDays: number[] | null;
  sessionMinutes: number | null;
  /** Newest first. */
  feedback: FeedbackPoint[];
  checkins: { date: string; score: number }[];
}

export async function loadAthlete(supabase: Client, userId: string, now: Date = new Date()): Promise<AthleteState | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("position_id, secondary_position_id, equipment_access, days_per_week, training_days, session_minutes, training_phase, level, timezone, target_date, target_event")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;
  const today = todayISO(profile.timezone, now);
  const [{ data: lims }, { data: evs }, series, { data: prog }, { data: fbRows }, { data: ckRows }] = await Promise.all([
    supabase.from("user_training_limitations").select("id, body_area, side, note").eq("user_id", userId).eq("active", true).order("created_at"),
    supabase
      .from("user_calendar_events")
      .select("id, event_date, event_type, note")
      .eq("user_id", userId)
      .gte("event_date", addDays(today, -3))
      .lte("event_date", addDays(today, 120))
      .order("event_date"),
    loadMetricSeries(supabase, userId),
    supabase.from("user_programs").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
    supabase.from("progress_logs").select("completed_at, feedback").eq("user_id", userId).not("feedback", "is", null).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(6),
    supabase.from("readiness_checkins").select("checkin_date, score").eq("user_id", userId).order("checkin_date", { ascending: false }).limit(5),
  ]);
  const plateaus = detectPlateaus(series);
  return {
    userId,
    today,
    positionId: profile.position_id,
    phase: profile.training_phase,
    level: profile.level,
    timezone: profile.timezone,
    target: profile.target_date && profile.target_date >= today ? { date: profile.target_date, event: profile.target_event } : null,
    limitations: (lims ?? []).map((l) => ({ id: l.id, area: l.body_area, side: l.side, note: l.note })),
    events: (evs ?? []).map((e) => ({ id: e.id, date: e.event_date, type: e.event_type, note: e.note })),
    plateaus,
    plateauAttributes: plateauAttributes(plateaus),
    activeProgram: prog ?? null,
    secondaryPositionId: profile.secondary_position_id,
    equipmentAccess: profile.equipment_access,
    daysPerWeek: profile.days_per_week,
    trainingDays: profile.training_days,
    sessionMinutes: profile.session_minutes,
    feedback: (fbRows ?? []).map((f) => ({ date: todayISO(profile.timezone, new Date(f.completed_at!)), value: f.feedback! })),
    checkins: (ckRows ?? []).map((c) => ({ date: c.checkin_date, score: c.score })),
  };
}

export interface BuildOptions {
  phase?: TrainingPhase;
  emphasis?: Attribute[];
  sessionsPerWeek?: number;
  startDate: string;
  fromDate?: string;
  weeks?: number;
  deloadCarry?: number;
  newProgram?: boolean;
  fixed?: AssembleInput["fixed"];
  variation?: number;
  secondaryPositionId?: string | null;
  equipmentAccess?: EquipmentAccess | null;
  maxSessions?: number | null;
  /** Which weekdays to build sessions on; falls back to a default spread for `maxSessions`. */
  trainingDays?: number[] | null;
  sessionMinutes?: number | null;
  level?: ExperienceLevel | null;
  /** Explicit lightening; undefined = derive from the athlete's recent feedback and check-ins. */
  lighten?: Lightening | null;
}

export function buildAssembleInput(content: Content, position: PositionInfo, athlete: AthleteState, opts: BuildOptions): AssembleInput {
  const phase = opts.phase ?? athlete.phase;
  return {
    positionId: position.id,
    rotational: position.rotational,
    phase,
    level: opts.level !== undefined ? opts.level : athlete.level,
    base: position.base,
    phaseModifiers: content.phaseModifiers[phase] ?? {},
    emphasis: (opts.emphasis ?? []).filter((a) => ATTRIBUTES.includes(a)).slice(0, 2),
    plateau: athlete.plateauAttributes,
    config: content.phaseConfigs[phase],
    exercises: content.exercises,
    limitations: athlete.limitations.map((l) => ({ area: l.area, side: l.side })),
    events: athlete.events.map((e) => ({ date: e.date, type: e.type })),
    notes: position.notes,
    startDate: opts.startDate,
    fromDate: opts.fromDate,
    target: athlete.target,
    weeks: opts.weeks,
    sessionsPerWeek: opts.sessionsPerWeek,
    deloadCarry: opts.deloadCarry,
    variation: (opts.variation ?? 0) + athlete.plateauAttributes.length,
    fixed: opts.fixed,
    newProgram: opts.newProgram,
    secondaryPositionId: opts.secondaryPositionId ?? null,
    equipmentAccess: opts.equipmentAccess ?? null,
    maxSessions: opts.maxSessions ?? null,
    trainingDays: opts.trainingDays ?? null,
    sessionMinutes: opts.sessionMinutes ?? null,
    lighten: opts.lighten !== undefined ? opts.lighten : computeAdaptations({ feedback: athlete.feedback, checkins: athlete.checkins, today: athlete.today }).lighten,
  };
}
