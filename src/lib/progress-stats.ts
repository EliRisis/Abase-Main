import { differenceInCalendarDays, formatISO, startOfDay } from "date-fns";

/**
 * Given a set of dates on which the athlete completed at least one workout,
 * returns the current streak: consecutive days ending today or yesterday
 * (a streak isn't broken until a full day is missed).
 */
export function computeStreak(completedAt: string[], now: Date = new Date()): number {
  const days = new Set(
    completedAt.map((iso) => formatISO(startOfDay(new Date(iso)), { representation: "date" })),
  );
  if (days.size === 0) return 0;

  const today = startOfDay(now);
  const todayKey = formatISO(today, { representation: "date" });
  let cursor = today;
  let streak = 0;

  if (!days.has(todayKey)) {
    // Streak may still be "alive" if yesterday was completed; otherwise 0.
    cursor = new Date(today.getTime() - 86_400_000);
  }

  while (days.has(formatISO(cursor, { representation: "date" }))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }

  return streak;
}

export function daysAgoLabel(iso: string, now: Date = new Date()): string {
  const diff = differenceInCalendarDays(startOfDay(now), startOfDay(new Date(iso)));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}
