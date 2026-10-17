// Calendar and periodization logic: which weeks are deloads, how a target date
// (combine, tryouts, season start) reshapes the block, and how games/practices
// lighten the days around them. Dates are ISO strings (YYYY-MM-DD) handled in UTC
// so results never depend on the server's timezone.
import type { CalendarEventType, IntensityLevel, TrainingPhase } from "../database.types";
import type { Attribute, AttributeVector } from "./attributes";

// ------------------------------------------------------------------ dates
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
/** ISO weekday: Monday = 1 ... Sunday = 7. */
export function isoWeekdayOf(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}
/** The athlete's calendar date "today" in their timezone (UTC when unknown). */
export function todayISO(timezone?: string | null, now: Date = new Date()): string {
  if (timezone) {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    } catch {
      /* fall through to UTC */
    }
  }
  return now.toISOString().slice(0, 10);
}

/**
 * A program's week w covers the 7 days starting at `start + (w-1)*7`. Inside a week
 * days are addressed by ISO weekday (1-7) so the schedule reads "Mon, Wed, Fri" whatever
 * day the athlete started on.
 */
export function offsetOf(start: string, dayNumber: number): number {
  return (dayNumber - isoWeekdayOf(start) + 7) % 7;
}
export function dayNumberOf(start: string, offset: number): number {
  return ((isoWeekdayOf(start) - 1 + offset) % 7) + 1;
}
export function programDayDate(start: string, week: number, dayNumber: number): string {
  return addDays(start, (week - 1) * 7 + offsetOf(start, dayNumber));
}
export function programPosition(start: string, today: string, weeks: number) {
  const elapsed = diffDays(start, today);
  const week = Math.floor(Math.max(elapsed, 0) / 7) + 1;
  return {
    notStarted: elapsed < 0,
    finished: week > weeks,
    week: Math.min(week, weeks),
    dayNumber: isoWeekdayOf(today),
  };
}

// ------------------------------------------------------------------ weeks
export type WeekMode = "standard" | "base" | "build" | "peak" | "taper" | "deload";

export interface WeekPlan {
  week: number;
  /** Date of offset 0 for this week. */
  start: string;
  mode: WeekMode;
  deload: boolean;
  /** Multiplies the phase's base volume. */
  volumeMul: number;
  /** Cap on session intensity for the whole week (null = phase decides). */
  intensityCap: IntensityLevel | null;
  /** Templates allowed to stay high-intensity this week (null = any). */
  highAllowed: string[] | null;
  /** Hard cap on high-intensity days this week (null = phase decides). */
  maxHigh: number | null;
  /** Periodization nudge applied to the effective needs profile. */
  shift: Partial<AttributeVector>;
  /** Weeks left INCLUDING this one until the target date (null when there is no target). */
  weeksToTarget: number | null;
  label: string;
  note: string | null;
}

export const MODE_SHIFT: Record<WeekMode, Partial<Record<Attribute, number>>> = {
  standard: {},
  deload: {},
  base: { strength: 1, conditioning: 1 },
  build: { power: 1, speed: 1, agility: 1 },
  peak: { speed: 2, power: 2, agility: 1, strength: -1, conditioning: -1 },
  taper: { speed: 1, power: 1, strength: -2, conditioning: -2, mobility: 1 },
};

export interface PlanWeeksArgs {
  start: string;
  weeks: number;
  target: { date: string; event?: string | null } | null;
  deloadEvery: number;
  /** Loading weeks already done since the last deload (carried over from a previous block). */
  deloadCarry: number;
}

/** How many weeks the next block runs: one deload cycle, or fewer if the target date comes sooner. */
export function programLength(args: { start: string; target: { date: string } | null; deloadEvery: number }): number {
  const cycle = Math.min(12, Math.max(1, args.deloadEvery));
  if (!args.target) return cycle;
  const toTarget = Math.ceil((diffDays(args.start, args.target.date) + 1) / 7);
  return toTarget < 1 ? cycle : Math.min(cycle, toTarget);
}

export function planWeeks(args: PlanWeeksArgs): WeekPlan[] {
  const out: WeekPlan[] = [];
  for (let w = 1; w <= args.weeks; w++) {
    const start = addDays(args.start, (w - 1) * 7);
    let weeksToTarget: number | null = null;
    if (args.target) {
      const left = Math.ceil((diffDays(start, args.target.date) + 1) / 7);
      weeksToTarget = left >= 1 ? left : null;
    }
    const scheduledDeload = (w + args.deloadCarry) % args.deloadEvery === 0;
    let mode: WeekMode = "standard";
    if (weeksToTarget !== null) {
      if (weeksToTarget === 1) mode = "taper";
      else if (weeksToTarget === 2) mode = "peak";
      else if (weeksToTarget <= 6) mode = "build";
      else mode = "base";
    }
    // A deload right before the peak/taper would strip the block of quality work twice.
    const deload = scheduledDeload && mode !== "taper" && mode !== "peak";
    if (deload) mode = "deload";

    const eventName = args.target?.event?.trim() || "your target date";
    const plan: WeekPlan = {
      week: w,
      start,
      mode,
      deload,
      volumeMul: 1,
      intensityCap: null,
      highAllowed: null,
      maxHigh: null,
      shift: MODE_SHIFT[mode],
      weeksToTarget,
      label: "",
      note: null,
    };
    switch (mode) {
      case "deload":
        plan.volumeMul = 0.6;
        plan.intensityCap = "moderate";
        plan.label = "Deload week";
        plan.note = "A planned lighter week: less volume and no max-effort work so your body can absorb the last few weeks of training.";
        break;
      case "taper":
        plan.volumeMul = 0.55;
        plan.maxHigh = 2;
        plan.highAllowed = ["speed", "power", "agility"];
        plan.label = "Taper week";
        plan.note = `Final week before ${eventName}: short, sharp speed and power work, less volume, more recovery.`;
        break;
      case "peak":
        plan.volumeMul = 0.9;
        plan.label = "Peak week";
        plan.note = `Two weeks out from ${eventName}: converting strength into speed and power.`;
        break;
      case "build":
        plan.label = "Build week";
        plan.note = `${weeksToTarget} weeks to ${eventName}: emphasis is shifting toward speed, power and agility.`;
        break;
      case "base":
        plan.label = "Base week";
        plan.note = `${weeksToTarget} weeks to ${eventName}: building strength and work capacity first.`;
        break;
      default:
        plan.label = "Training week";
    }
    out.push(plan);
  }
  return out;
}

// ---------------------------------------------------------------- calendar
export interface CalendarEvent {
  date: string;
  type: CalendarEventType;
}

export interface DayAdjust {
  blocked: boolean;
  volumeMul: number;
  intensityCap: IntensityLevel | null;
  /** Placement cost for hard sessions on this day (used by the arrangement search). */
  hardPenalty: number;
  reasons: string[];
}

export const IN_SEASON_EVENT_BASE_VOLUME = 85;

export function eventsMatter(phase: TrainingPhase): boolean {
  return phase === "in_season" || phase === "pre_season";
}

const RANK: Record<IntensityLevel, number> = { low: 1, moderate: 2, high: 3 };
const tighter = (a: IntensityLevel | null, b: IntensityLevel | null): IntensityLevel | null =>
  a === null ? b : b === null ? a : RANK[a] <= RANK[b] ? a : b;

export function adjustForEvents(date: string, events: CalendarEvent[], phase: TrainingPhase): DayAdjust {
  const adj: DayAdjust = { blocked: false, volumeMul: 1, intensityCap: null, hardPenalty: 0, reasons: [] };
  if (!eventsMatter(phase) || events.length === 0) return adj;
  const on = (offset: number, type?: CalendarEventType) =>
    events.some((e) => e.date === addDays(date, offset) && (!type || e.type === type));

  if (on(0, "game")) {
    adj.blocked = true;
    adj.reasons.push("Game day: no training.");
    return adj;
  }
  if (on(0, "practice")) {
    adj.volumeMul = Math.min(adj.volumeMul, 0.65);
    adj.intensityCap = tighter(adj.intensityCap, "moderate");
    adj.hardPenalty += 40;
    adj.reasons.push("Practice today: kept moderate.");
  }
  if (on(1, "game")) {
    adj.volumeMul = Math.min(adj.volumeMul, 0.5);
    adj.intensityCap = tighter(adj.intensityCap, "low");
    adj.hardPenalty += 80;
    adj.reasons.push("Game tomorrow: activation only.");
  }
  if (on(-1, "game")) {
    adj.volumeMul = Math.min(adj.volumeMul, 0.6);
    adj.intensityCap = tighter(adj.intensityCap, "low");
    adj.hardPenalty += 70;
    adj.reasons.push("Day after a game: recovery.");
  }
  if (on(2, "game")) {
    adj.volumeMul = Math.min(adj.volumeMul, 0.75);
    adj.intensityCap = tighter(adj.intensityCap, "moderate");
    adj.hardPenalty += 30;
    adj.reasons.push("Game in 2 days: no max-effort work.");
  }
  if (on(1, "practice")) {
    adj.volumeMul = Math.min(adj.volumeMul, 0.9);
    adj.hardPenalty += 8;
  }
  return adj;
}
