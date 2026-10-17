"use client";

import { Settings2 } from "@/components/icons";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWeightsAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CATEGORIES, CATEGORY_SHORT, PHASES, PHASE_LABEL } from "@/lib/training";
import type { Tables } from "@/lib/database.types";

export function WeightsDialog({
  archetype,
  weights,
}: {
  archetype: Tables<"position_archetypes">;
  weights: Tables<"archetype_category_weights">[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initial: Record<string, number> = {};
  for (const w of weights) initial[`${w.phase}:${w.category}`] = Number(w.weight);
  const [values, setValues] = useState(initial);

  function handleSave() {
    startTransition(async () => {
      const result = await saveWeightsAction(archetype.id, values);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Weights saved");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Settings2 size={14} /> Weights
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{archetype.name} — category weights</DialogTitle>
            <DialogDescription>
              Relative emphasis (0-20) per training phase. The assembler turns these into a
              proportional share of the week&apos;s sessions.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr>
                  <th className="p-1.5 text-left text-caption font-medium text-muted">Phase</th>
                  {CATEGORIES.map((c) => (
                    <th key={c} className="p-1.5 text-center text-caption font-medium text-muted">
                      {CATEGORY_SHORT[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PHASES.map((p) => (
                  <tr key={p}>
                    <td className="p-1.5 text-caption font-semibold">{PHASE_LABEL[p]}</td>
                    {CATEGORIES.map((c) => {
                      const key = `${p}:${c}`;
                      return (
                        <td key={key} className="p-1">
                          <Input
                            type="number"
                            step="0.5"
                            min={0}
                            max={20}
                            className="h-9 w-16 px-2 text-center"
                            value={values[key] ?? 0}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [key]: Number(e.target.value) }))
                            }
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" loading={isPending} onClick={handleSave}>
              Save weights
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
