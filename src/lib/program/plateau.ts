// Plateau detection: a tested metric (a lift max, a sprint time) that has stopped
// improving across consecutive logs. Pure.
import type { MetricDirection } from "../database.types";
import type { Attribute } from "./attributes";
import { diffDays } from "./periodization";

export interface MetricSeries {
  slug: string;
  name: string;
  unit: string;
  direction: MetricDirection;
  attribute: Attribute | null;
  logs: { value: number; date: string }[];
}
export interface Plateau {
  slug: string;
  name: string;
  unit: string;
  attribute: Attribute | null;
  tests: number;
  since: string;
  latest: number;
  best: number;
  message: string;
}

export const PLATEAU_TOLERANCE = 0.005; // 0.5% counts as noise
export const PLATEAU_MIN_SPAN_DAYS = 10;

export function detectPlateaus(series: MetricSeries[]): Plateau[] {
  const out: Plateau[] = [];
  for (const s of series) {
    // one reading per day (the last one wins), oldest first
    const byDay = new Map<string, number>();
    for (const l of [...s.logs].sort((a, b) => a.date.localeCompare(b.date))) byDay.set(l.date, l.value);
    const logs = [...byDay.entries()].map(([date, value]) => ({ date, value }));
    if (logs.length < 3) continue;

    const better = (v: number, ref: number) =>
      s.direction === "higher_is_better" ? v > ref * (1 + PLATEAU_TOLERANCE) : v < ref * (1 - PLATEAU_TOLERANCE);
    const bestOf = (xs: { value: number }[]) =>
      xs.reduce((b, x) => (s.direction === "higher_is_better" ? Math.max(b, x.value) : Math.min(b, x.value)), xs[0].value);

    const n = logs.length;
    const reference = bestOf(logs.slice(0, n - 2)); // the level the last two tests had to beat
    const lastTwo = logs.slice(n - 2);
    if (lastTwo.some((l) => better(l.value, reference))) continue;
    if (diffDays(logs[n - 3].date, logs[n - 1].date) < PLATEAU_MIN_SPAN_DAYS) continue;

    const latest = logs[n - 1].value;
    out.push({
      slug: s.slug,
      name: s.name,
      unit: s.unit,
      attribute: s.attribute,
      tests: 3,
      since: logs[n - 3].date,
      latest,
      best: bestOf(logs),
      message: `Your ${s.name.toLowerCase()} hasn't improved across your last 3 tests (best ${bestOf(logs)} ${s.unit}).${
        s.attribute ? ` We've added extra ${s.attribute} work and switched up the exercises.` : ""
      }`,
    });
  }
  return out;
}

export function plateauAttributes(plateaus: Plateau[]): Attribute[] {
  return [...new Set(plateaus.map((p) => p.attribute).filter((a): a is Attribute => !!a))].slice(0, 3);
}
