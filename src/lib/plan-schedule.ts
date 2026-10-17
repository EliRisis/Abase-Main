import { differenceInCalendarDays, startOfDay } from "date-fns";

export const WEEKDAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** ISO weekday: Monday = 1 ... Sunday = 7. */
export function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * Which week of the plan "today" falls in, given when the athlete enrolled.
 * Week 1 covers the 7 days starting on enrollment day; clamped to the
 * plan's total length once it runs out.
 */
export function effectiveWeekNumber(
  startedAt: string,
  totalWeeks: number,
  now: Date = new Date(),
): number {
  const daysElapsed = differenceInCalendarDays(
    startOfDay(now),
    startOfDay(new Date(startedAt)),
  );
  const week = Math.floor(Math.max(daysElapsed, 0) / 7) + 1;
  return Math.min(week, totalWeeks);
}

export function isPlanFinished(
  startedAt: string,
  totalWeeks: number,
  now: Date = new Date(),
): boolean {
  const daysElapsed = differenceInCalendarDays(
    startOfDay(now),
    startOfDay(new Date(startedAt)),
  );
  return Math.floor(Math.max(daysElapsed, 0) / 7) + 1 > totalWeeks;
}
