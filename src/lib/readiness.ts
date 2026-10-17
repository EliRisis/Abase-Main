// Fatigue / readiness advisory. Looks at everything the athlete actually did in the
// last couple of days (scheduled sessions AND extra modules they did on their own),
// today's optional check-in, and any game/practice nearby, then decides whether
// today's session might be too much. It only ever RECOMMENDS: the result carries a
// suggested lighter swap, and the athlete can always run the original session.
import type { IntensityLevel, ModuleCategory, MovementPattern } from "./database.types";

export interface RecentSession {
  /** Days before today: 0 = earlier today, 1 = yesterday, 2 = two days ago. */
  daysAgo: number;
  intensity: IntensityLevel | null;
  patterns: MovementPattern[];
  /** Done outside the assembled program (a standalone module). */
  supplemental?: boolean;
  title?: string | null;
}
export interface TodaySession {
  intensity: IntensityLevel;
  patterns: MovementPattern[];
}
export interface NearbyEvent {
  /** Days from today: -1 = yesterday, 1 = tomorrow. */
  offset: number;
  type: "game" | "practice";
}
export interface ReadinessInput {
  today: TodaySession | null;
  recent: RecentSession[];
  checkinScore?: number | null; // 1-5, 1 = wiped out, 5 = great
  events?: NearbyEvent[];
}
export type ReadinessSuggestion = "recovery" | "lighter";
export interface ReadinessAdvisory {
  flagged: boolean;
  /** Always true: the athlete decides. Kept explicit so no caller can treat this as a gate. */
  canOverride: true;
  reasons: string[];
  suggestion: ReadinessSuggestion | null;
  points: number;
  /** At least one reason came from work the athlete did on their own. */
  includesSupplemental: boolean;
}

const LEGS = new Set<MovementPattern>(["squat", "hinge", "single_leg", "plyometric", "locomotion"]);
const UPPER = new Set<MovementPattern>(["upper_push", "upper_pull"]);

const RANK: Record<IntensityLevel, number> = { low: 1, moderate: 2, high: 3 };

/** Old logs (before movement patterns were recorded) only know their module category. */
export function patternsFromCategory(category: ModuleCategory | null): MovementPattern[] {
  switch (category) {
    case "strength":
      return ["squat", "hinge", "upper_push", "upper_pull"];
    case "speed_acceleration":
      return ["locomotion", "plyometric"];
    case "agility_cod":
    case "position_skill":
    case "conditioning":
      return ["locomotion"];
    default:
      return [];
  }
}

export function evaluateReadiness(input: ReadinessInput): ReadinessAdvisory {
  const reasons: string[] = [];
  let points = 0;
  let includesSupplemental = false;
  const { today, recent, checkinScore, events = [] } = input;

  const noAdvice: ReadinessAdvisory = { flagged: false, canOverride: true, reasons, suggestion: null, points: 0, includesSupplemental: false };
  if (!today) return noAdvice;
  const todayHard = today.intensity === "high";
  const todayMod = RANK[today.intensity] >= 2;

  if (typeof checkinScore === "number" && checkinScore <= 2 && todayMod) {
    reasons.push(checkinScore === 1 ? "You checked in feeling wiped out today." : "You checked in feeling pretty run down today.");
    points += checkinScore === 1 ? 3 : 2;
  }

  const yesterday = recent.filter((r) => r.daysAgo === 1);
  const twoDaysAgo = recent.filter((r) => r.daysAgo === 2);
  const earlierToday = recent.filter((r) => r.daysAgo === 0);
  const tag = (r: RecentSession) => (r.supplemental ? "an extra session you did on your own" : "a scheduled session");
  const flagSupp = (rs: RecentSession[]) => {
    if (rs.some((r) => r.supplemental)) includesSupplemental = true;
  };
  const highest = (rs: RecentSession[]) => rs.reduce<IntensityLevel | null>((best, r) => (r.intensity && (!best || RANK[r.intensity] > RANK[best]) ? r.intensity : best), null);

  const yHigh = highest(yesterday) === "high";
  const twoHigh = highest(twoDaysAgo) === "high";

  if (todayHard && yHigh) {
    const src = yesterday.find((r) => r.intensity === "high")!;
    reasons.push(`Yesterday you did a high-intensity session (${tag(src)}), and today is scheduled hard too.`);
    points += 2;
    flagSupp(yesterday);
  }

  if (todayMod && yesterday.length > 0) {
    const yLegs = yesterday.some((r) => r.intensity && RANK[r.intensity] >= 2 && r.patterns.some((p) => LEGS.has(p)));
    const yUpper = yesterday.some((r) => r.intensity && RANK[r.intensity] >= 2 && r.patterns.some((p) => UPPER.has(p)));
    const tLegs = today.patterns.some((p) => LEGS.has(p));
    const tUpper = today.patterns.some((p) => UPPER.has(p));
    if (todayHard && yLegs && tLegs && !yHigh) {
      reasons.push("Yesterday's session already worked your legs, and today loads them again.");
      points += 2;
      flagSupp(yesterday);
    } else if (todayHard && yLegs && tLegs) {
      points += 1; // already explained by the back-to-back reason; extra weight for the same region
    }
    if (todayHard && yUpper && tUpper) {
      reasons.push("Yesterday's session worked your upper body, and today loads it again.");
      points += 1;
      flagSupp(yesterday);
    }
  }

  if (todayHard && yHigh && twoHigh) {
    reasons.push("This would be your third high-intensity day in a row.");
    points += 2;
    flagSupp(twoDaysAgo);
  }

  const highInWindow = recent.filter((r) => r.daysAgo <= 2 && r.intensity === "high").length;
  if (todayHard && highInWindow >= 2 && !(yHigh && twoHigh)) {
    reasons.push(`You've had ${highInWindow} high-intensity sessions in the last 3 days.`);
    points += 1;
  }

  if (earlierToday.length > 0 && todayMod) {
    reasons.push("You already trained earlier today.");
    points += 2;
    flagSupp(earlierToday);
  }

  const gameTomorrow = events.some((e) => e.type === "game" && e.offset === 1);
  const gameYesterday = events.some((e) => e.type === "game" && e.offset === -1);
  const practiceToday = events.some((e) => e.type === "practice" && e.offset === 0);
  if (todayHard && gameTomorrow) {
    reasons.push("You have a game tomorrow.");
    points += 2;
  }
  if (todayHard && gameYesterday) {
    reasons.push("You played a game yesterday.");
    points += 1;
  }
  if (todayHard && practiceToday) {
    reasons.push("You have practice today.");
    points += 1;
  }

  const flagged = points >= 2;
  let suggestion: ReadinessSuggestion | null = null;
  if (flagged) suggestion = points >= 4 || (typeof checkinScore === "number" && checkinScore <= 2) ? "recovery" : "lighter";
  return { flagged, canOverride: true, reasons: flagged ? reasons : [], suggestion, points, includesSupplemental: flagged && includesSupplemental };
}
