"use client";

import { Plus } from "@/components/icons";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { logMetricAction, type ActionResult } from "@/app/(app)/metrics/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/database.types";

const initialState: ActionResult = {};

export function LogMetricDialog({ metric }: { metric: Tables<"metric_definitions"> }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(logMetricAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(`${metric.name} logged`);
      // Closes the dialog in response to the server action's result, not a
      // local render input - a legitimate effect, not a derivable value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} /> Log
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log {metric.name}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="flex flex-col gap-section">
            <input type="hidden" name="metricId" value={metric.id} />
            <div>
              <Label htmlFor={`value-${metric.id}`}>
                Value ({metric.unit}) — between {metric.min_value} and {metric.max_value}
              </Label>
              <Input
                id={`value-${metric.id}`}
                name="value"
                type="number"
                step="0.01"
                min={metric.min_value}
                max={metric.max_value}
                required
              />
            </div>
            <div>
              <Label htmlFor={`date-${metric.id}`}>Date tested</Label>
              <Input
                id={`date-${metric.id}`}
                name="loggedOn"
                type="date"
                defaultValue={new Date().toLocaleDateString("en-CA")}
                max={new Date().toLocaleDateString("en-CA")}
                required
              />
            </div>
            <div>
              <Label htmlFor={`note-${metric.id}`}>Note (optional)</Label>
              <Textarea id={`note-${metric.id}`} name="note" rows={2} maxLength={200} />
            </div>
            {state.error && (
              <p className="text-body text-danger" role="alert">
                {state.error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
