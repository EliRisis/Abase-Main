// Gym vs field. A training day is one or two SEPARATE sessions, each done in its own place with
// its own equipment and its own logging: the weight room (reps x load), the field (distance, time,
// rest) and, on light days, recovery. This module holds the pure helpers everything shares.
import type { TrainingSetting } from "../database.types";

export type Session = "weight_room" | "field" | "recovery";
export const SESSION_ORDER: Session[] = ["field", "weight_room", "recovery"];

export const SESSION_LABEL: Record<Session, string> = {
  weight_room: "Weight Room",
  field: "Field & Conditioning",
  recovery: "Recovery",
};
export const SESSION_SHORT: Record<Session, string> = { weight_room: "Weight Room", field: "Field", recovery: "Recovery" };
export const SESSION_HINT: Record<Session, string> = {
  weight_room: "Reps and weight. You need a gym or weights.",
  field: "Distance, time and rest. Take it outside or to the court.",
  recovery: "Mobility and easy movement. Anywhere.",
};

export const isSession = (s: string | null | undefined): s is Session => s === "weight_room" || s === "field" || s === "recovery";

/** Rows grouped into sessions, in the order each session first appears. */
export function groupSessions<T extends { setting: TrainingSetting | Session }>(rows: T[]): { setting: Session; rows: T[] }[] {
  const out: { setting: Session; rows: T[] }[] = [];
  for (const r of rows) {
    const s = (r.setting === "either" ? "field" : r.setting) as Session;
    let g = out.find((x) => x.setting === s);
    if (!g) {
      g = { setting: s, rows: [] };
      out.push(g);
    }
    g.rows.push(r);
  }
  return out;
}

/**
 * A pre-authored module workout is a flat list. Give every exercise a session: work exercises keep
 * their own setting, and "either" ones (warm-ups, core holds) join the session of the work that
 * follows them (or the one before, for a cool-down). A workout that is all mobility is a recovery session.
 */
export function assignModuleSessions<T extends { setting: TrainingSetting }>(items: T[]): (T & { session: Session })[] {
  const work = (i: number): Session | null => {
    const s = items[i].setting;
    return s === "weight_room" || s === "field" ? s : null;
  };
  const anyWork = items.some((_, i) => work(i) !== null);
  return items.map((it, i) => {
    let session = work(i);
    if (!session && anyWork) {
      for (let j = i + 1; j < items.length && !session; j++) session = work(j);
      for (let j = i - 1; j >= 0 && !session; j--) session = work(j);
    }
    return { ...it, session: session ?? "recovery" };
  });
}

/** Distinct equipment named by a session's exercises, e.g. ["Barbell", "Dumbbells"]. */
export function equipmentFor(rows: { equipment: string | null }[]): string[] {
  const skip = new Set(["Bodyweight", "None", "Any", "Turf", "Field", "Court", "Track", "Wall", "Mat/Turf", "Bases"]);
  return [...new Set(rows.map((r) => r.equipment).filter((e): e is string => !!e && !skip.has(e)))];
}

export interface FieldSpec {
  /** 20, 30, 40 ... */
  amount: number | null;
  unit: "yd" | "m" | "s" | "min" | null;
  /** "20 yd", "30 s", or the raw text when it is neither ("5 / side") */
  label: string;
  /** Distance work is scored by time. */
  timed: boolean;
}

/** Read "20 yd" / "30 s" / "5 / side" from a field prescription so the field view can lead with distance or time. */
export function fieldSpec(reps: string): FieldSpec {
  const m = /(\d+(?:\.\d+)?)\s*(yds?|yards?|m|meters?|sec|s|min)\b/i.exec(reps);
  if (!m) return { amount: null, unit: null, label: reps, timed: false };
  const u = m[2].toLowerCase();
  const unit = u.startsWith("y") ? "yd" : u.startsWith("m") && u !== "min" ? "m" : u === "min" ? "min" : "s";
  return { amount: Number(m[1]), unit, label: `${m[1]} ${unit}`, timed: unit === "yd" || unit === "m" };
}

/** 90 -> "1:30", 45 -> "0:45" */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Which sessions of a day are finished, from the athlete's logs. A log from before sessions existed (setting null) covered the whole day. */
export function sessionsDoneFor(logs: { setting: Session | null; completed_at: string | null }[], daySessions: Session[]): Set<Session> {
  const done = new Set<Session>();
  const legacy = logs.some((l) => l.completed_at && l.setting === null);
  for (const st of daySessions) if (legacy || logs.some((l) => l.completed_at && l.setting === st)) done.add(st);
  return done;
}
