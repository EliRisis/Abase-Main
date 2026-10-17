"use client";

import { AlertTriangle, Check } from "@/components/icons";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { submitReadinessAction, swapDayAction, type ActionResult } from "@/app/(app)/program/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCORES = [
  { value: 1, label: "Wiped out" },
  { value: 2, label: "Run down" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
];

const initialState: ActionResult = {};

export interface AdvisoryView {
  flagged: boolean;
  reasons: string[];
  suggestion: "recovery" | "lighter" | null;
  includesSupplemental: boolean;
}

/**
 * Optional check-in plus a heads-up when today might be too much. It only ever recommends:
 * "Keep today's plan" is always available, and the session's Start button is never disabled.
 */
export function ReadinessCard({
  alreadyCheckedIn,
  advisory,
  todayDayId,
  showCheckin = true,
}: {
  alreadyCheckedIn: { score: number } | null;
  advisory: AdvisoryView | null;
  todayDayId: string | null;
  /** false: only the heads-up and swap buttons (the check-in lives once at the top of the page). */
  showCheckin?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(submitReadinessAction, initialState);
  const [score, setScore] = useState<number | null>(alreadyCheckedIn?.score ?? null);
  const [submitted, setSubmitted] = useState(!!alreadyCheckedIn);
  const [checkinDate, setCheckinDate] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [swapping, startSwap] = useTransition();

  useEffect(() => {
    // The athlete's local calendar date is only known in the browser; computed after mount
    // so the server render and first client render agree on the empty default.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckinDate(new Date().toLocaleDateString("en-CA"));
  }, []);
  useEffect(() => {
    // Reacts to the server action's result, not to a render input.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setSubmitted(true);
  }, [state]);

  function swap(mode: "recovery" | "lighter") {
    if (!todayDayId) return;
    startSwap(async () => {
      const res = await swapDayAction(todayDayId, mode);
      if (res.error) toast.error(res.error);
      else toast.success(mode === "recovery" ? "Swapped to a recovery session" : "Switched to a lighter version");
    });
  }

  const showAdvisory = !!advisory?.flagged && !dismissed;

  return (
    <div className="flex flex-col gap-3">
      {!showCheckin ? null : !submitted ? (
        <form action={formAction} className="flex flex-col gap-2.5 surface-card p-4">
          <input type="hidden" name="checkinDate" value={checkinDate} />
          <input type="hidden" name="score" value={score ?? ""} />
          <p className="text-heading">
            How are you feeling today? <span className="text-label ml-1 text-muted">optional</span>
          </p>
          <div className="flex gap-2">
            {SCORES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setScore(s.value)}
                aria-pressed={score === s.value}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-control border py-2.5 transition",
                  score === s.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-surface-raised",
                )}
              >
                <span className="text-stat">{s.value}</span>
                <span className={cn("text-label-sm", score === s.value ? "text-primary-foreground" : "text-muted")}>{s.label}</span>
              </button>
            ))}
          </div>
          {state.error && (
            <p className="text-caption text-danger" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" size="sm" disabled={!score} loading={isPending} className="self-end">
            Check in
          </Button>
        </form>
      ) : (
        <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-4 py-2.5 text-body text-muted">
          <Check size={15} className="text-success" />
          Checked in{score ? ` · feeling ${SCORES.find((s) => s.value === score)?.label.toLowerCase()}` : ""}
        </div>
      )}

      {showAdvisory && advisory && (
        <div className="flex flex-col gap-3 rounded-control border border-warning/40 bg-warning/10 p-4" role="status">
          <div className="flex items-start gap-2">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-warning" />
            <div className="flex flex-col gap-1">
              <p className="text-body font-semibold">Today might be a lot</p>
              <ul className="text-caption text-muted">
                {advisory.reasons.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
              <p className="mt-1 text-caption text-muted">This is a suggestion, not a rule. You can do today&apos;s session exactly as planned.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {advisory.suggestion === "recovery" && todayDayId && (
              <Button size="sm" variant="secondary" loading={swapping} onClick={() => swap("recovery")}>
                Swap to a recovery session
              </Button>
            )}
            {advisory.suggestion === "lighter" && todayDayId && (
              <Button size="sm" variant="secondary" loading={swapping} onClick={() => swap("lighter")}>
                Do a lighter version
              </Button>
            )}
            {advisory.suggestion === "recovery" && todayDayId && (
              <Button size="sm" variant="ghost" loading={swapping} onClick={() => swap("lighter")}>
                Lighter version instead
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Keep today&apos;s plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
