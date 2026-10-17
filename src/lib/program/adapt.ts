// Feedback-driven adjustments. Turns what the athlete tells us (post-session difficulty, pre-session
// check-ins) into a plain-language coaching decision. Pure: callers load the inputs.
import type { SessionFeedback } from "../database.types";
import { addDays } from "./periodization";

export interface FeedbackPoint {
  /** ISO date the session was finished. */
  date: string;
  value: SessionFeedback;
}
export interface Lightening {
  mul: number;
  until: string;
  reason: string;
}
export interface AdaptResult {
  lighten: Lightening | null;
  /** Short notes shown on the program page ("stepping up", "lighter this week"). */
  notes: string[];
}

export const FEEDBACK_LABEL: Record<SessionFeedback, string> = { too_easy: "Too easy", just_right: "Just right", too_hard: "Too hard" };

/**
 * `feedback` and `checkins` are newest first. The rules are deliberately simple and explainable:
 *  - 2 of the last 3 sessions felt too hard            -> lighter week
 *  - average of the last few check-ins <= 2.5          -> lighter week
 *  - both                                              -> lighter still
 *  - last 3 sessions all felt too easy                 -> note only (loads step up through overload)
 */
export function computeAdaptations(input: { feedback: FeedbackPoint[]; checkins: { date: string; score: number }[]; today: string }): AdaptResult {
  const recentFb = input.feedback.filter((f) => f.date >= addDays(input.today, -14)).slice(0, 3);
  const hard = recentFb.filter((f) => f.value === "too_hard").length;
  const easy = recentFb.length >= 3 && recentFb.every((f) => f.value === "too_easy");
  const recentCk = input.checkins.filter((c) => c.date >= addDays(input.today, -7)).slice(0, 3);
  const worn = recentCk.length >= 2 && recentCk.reduce((s, c) => s + c.score, 0) / recentCk.length <= 2.5;
  const tooHard = hard >= 2;

  const notes: string[] = [];
  let lighten: Lightening | null = null;
  if (tooHard || worn) {
    const why =
      tooHard && worn
        ? "your last sessions felt too hard and you've flagged feeling worn down"
        : tooHard
          ? "your last sessions felt too hard"
          : "you've flagged feeling worn down";
    lighten = { mul: tooHard && worn ? 0.7 : 0.8, until: addDays(input.today, 7), reason: `Lighter this week: ${why}.` };
    notes.push(lighten.reason);
  }
  if (easy && !lighten) notes.push("Stepping things up: your last few sessions felt easy, so weights are going up where you hit your reps.");
  return { lighten, notes };
}
