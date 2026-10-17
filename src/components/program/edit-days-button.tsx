"use client";

import { Pencil } from "@/components/icons";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { setTrainingDaysAction, type ActionResult } from "@/app/(app)/program/actions";
import { DayChips } from "@/components/program/day-chips";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const initialState: ActionResult = {};

/**
 * The small "Edit days" button next to the week strip. Saving moves only today-and-later sessions
 * onto the new pattern; anything done, started or already past keeps its day exactly as it was.
 */
export function EditDaysButton({ trainingDays }: { trainingDays: number[] }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(trainingDays);
  const [state, formAction, isPending] = useActionState(setTrainingDaysAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Days updated. Today and later sessions moved to match.");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setDays(trainingDays);
      }}
    >
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil size={12} /> Edit days
      </Button>
      <DialogContent>
        <DialogTitle>Which days can you train?</DialogTitle>
        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <DayChips value={days} onChange={setDays} />
          {state.error && (
            <p className="text-body text-danger" role="alert">
              {state.error}
            </p>
          )}
          <p className="text-caption text-muted">Moves today-and-later sessions onto the new days, keeping their content and order. Anything done, started or in the past stays put.</p>
          <Button type="submit" loading={isPending} disabled={days.join() === trainingDays.join()}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
