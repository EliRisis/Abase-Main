// Which weekdays an athlete trains on. `training_days` is stored as ISO weekdays (1 = Mon ... 7 = Sun),
// unique and ascending, on both `profiles` (the athlete's standing preference) and `user_programs`
// (a snapshot of what the block was built with, same idea as `days_per_week`). This module is the one
// place that knows the preselected spread for a given day count and reads/writes that array shape.
import { addDays, isoWeekdayOf } from "./periodization";

/** Preselected spread shown for each day count, so most people just tap Continue. Mon=1 ... Sun=7. */
export const DEFAULT_TRAINING_DAYS: Record<number, number[]> = {
  2: [2, 5], // Tue, Fri
  3: [1, 3, 5], // Mon, Wed, Fri
  4: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  5: [1, 2, 3, 5, 6], // Mon, Tue, Wed, Fri, Sat
  6: [1, 2, 3, 4, 5, 6], // Mon-Sat
};
export const MIN_TRAINING_DAYS = 2;

export const MAX_TRAINING_DAYS = 6;

/** The chip row's default selection for a day count outside 2-6 falls back to the closest in-range spread. */
export function defaultTrainingDays(count: number): number[] {
  const n = Math.max(MIN_TRAINING_DAYS, Math.min(MAX_TRAINING_DAYS, Math.round(count)));
  return DEFAULT_TRAINING_DAYS[n] ?? DEFAULT_TRAINING_DAYS[4];
}

/** Unique, ascending, ISO-weekday values only. What gets written to `training_days` columns. */
export function normalizeTrainingDays(days: number[]): number[] {
  return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b);
}

/** The week strip pages through this many Sun-Sat calendar weeks, starting at the current one. */
export const WEEK_STRIP_WEEKS = 4;

/** The Sunday that starts the calendar week containing `iso` (Sun-Sat, distinct from the block's own week numbering). */
export function sundayOf(iso: string): string {
  const dow = isoWeekdayOf(iso); // Mon=1 ... Sun=7
  return addDays(iso, dow === 7 ? 0 : -dow);
}

/** e.g. "Tuesday" (renders as "TUESDAY" via the text-display/text-label uppercase styles). */
export function weekdayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

/** e.g. "Sep 27". */
export function monthDayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Older sessions stored "Gym: " / "Field: " on the title; the room is now shown by the tab and icon instead. */
export function sessionTitle(title: string | null): string {
  return (title ?? "Session").replace(/^(Gym|Field):\s*/, "");
}
