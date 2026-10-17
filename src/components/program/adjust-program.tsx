"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { adjustProgramAction, type ActionResult } from "@/app/(app)/program/actions";
import { DayChips } from "@/components/program/day-chips";
import { FocusPicker, PositionPicker, type PositionOption } from "@/components/program/program-fields";
import { SeasonPicker } from "@/components/program/season-picker";
import { Button } from "@/components/ui/button";
import { adjustProgramSchema } from "@/lib/validations/program";
import type { TrainingAttribute, TrainingPhase } from "@/lib/database.types";

const initialState: ActionResult = {};

/**
 * ADJUST PROGRAM. Lightweight changes (position, season phase, extra focus) applied to the running
 * program straight away. Nothing is archived and nothing you logged changes: days that are done,
 * started or already past stay exactly as they were, and only the days still ahead are re-planned.
 */
export function AdjustProgram({
  positions,
  initial,
  onDone,
}: {
  positions: PositionOption[];
  initial: { positionId: string; secondaryId: string | null; phase: TrainingPhase; focus: TrainingAttribute[]; trainingDays: number[] };
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(adjustProgramAction, initialState);
  const [positionId, setPositionId] = useState(initial.positionId);
  const [secondaryId, setSecondaryId] = useState<string | null>(initial.secondaryId);
  const [phase, setPhase] = useState<TrainingPhase>(initial.phase);
  const [focus, setFocus] = useState<TrainingAttribute[]>(initial.focus);
  const [trainingDays, setTrainingDays] = useState<number[]>(initial.trainingDays);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    // Reacts to the server action's result, not to a render input.
    if (state.success) {
      toast.success("Program adjusted. Your history and progress are untouched.");
      onDone();
    }
  }, [state, onDone]);

  const changed =
    positionId !== initial.positionId ||
    secondaryId !== initial.secondaryId ||
    phase !== initial.phase ||
    focus.join() !== initial.focus.join() ||
    trainingDays.join() !== initial.trainingDays.join();

  function validate(e: React.FormEvent<HTMLFormElement>) {
    const parsed = adjustProgramSchema.safeParse({ phase, positionId, secondaryPositionId: secondaryId, trainingDays, emphasis: focus });
    const msg = !parsed.success ? parsed.error.issues[0]?.message : secondaryId && secondaryId === positionId ? "Your second position has to be different from your main one." : null;
    setClientError(msg ?? null);
    if (msg) e.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={validate} className="flex flex-col gap-section surface-card p-card">
      <div>
        <h2 className="text-heading">Adjust program</h2>
        <p className="mt-1 text-caption text-muted">
          Applied instantly to the days still ahead. Sessions you have done, started or missed stay exactly as they are, and your logged weights keep driving your targets.
        </p>
      </div>

      <PositionPicker positions={positions} positionId={positionId} setPositionId={setPositionId} secondaryId={secondaryId} setSecondaryId={setSecondaryId} />

      <div className="flex flex-col gap-1.5">
        <span className="text-label text-muted">Where are you in your season?</span>
        <SeasonPicker value={phase} onChange={setPhase} />
        <input type="hidden" name="phase" value={phase} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-label text-muted">Which days can you train?</span>
        <DayChips value={trainingDays} onChange={setTrainingDays} />
      </div>

      <FocusPicker focus={focus} setFocus={setFocus} />

      {(clientError || state.error) && (
        <p className="text-body text-danger" role="alert">
          {clientError ?? state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={isPending} disabled={!changed}>
          Apply changes
        </Button>
        <button type="button" onClick={onDone} className="text-label text-muted hover:text-foreground">
          Cancel
        </button>
        {!changed && <span className="text-caption text-muted">Nothing changed yet.</span>}
      </div>
    </form>
  );
}
