"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setTrainingPhaseAction } from "@/app/(app)/program/actions";
import { SeasonPicker } from "@/components/program/season-picker";
import { Label } from "@/components/ui/label";
import { PHASE_LABEL } from "@/lib/training";
import type { TrainingPhase } from "@/lib/database.types";

export function PhasePicker({ initial }: { initial: TrainingPhase }) {
  const [phase, setPhase] = useState<TrainingPhase>(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: TrainingPhase) {
    const prev = phase;
    setPhase(next);
    startTransition(async () => {
      try {
        await setTrainingPhaseAction(next);
        toast.success(`Training set to ${PHASE_LABEL[next].toLowerCase()}`);
      } catch {
        setPhase(prev);
        toast.error("Couldn't update your season.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 surface-card p-card-sm">
      <div>
        <Label>Season</Label>
        <p className="text-caption text-muted">Change anytime; your remaining sessions re-plan around it.</p>
      </div>
      <SeasonPicker value={phase} onChange={handleChange} disabled={isPending} />
    </div>
  );
}
