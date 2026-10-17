"use client";

import { Check } from "@/components/icons";
import { useState } from "react";
import { toast } from "sonner";
import { updateSetAction } from "@/app/(app)/log/[progressLogId]/actions";
import { cn } from "@/lib/utils";

export interface RecoverySet {
  id: string;
  setNumber: number;
  completed: boolean;
}

/** Recovery logging is a checklist: one line per movement, one tick per round. No numbers to enter. */
export function RecoveryLogger({ name, prescription, note, sets: initial }: { name: string; prescription: string; note: string | null; sets: RecoverySet[] }) {
  const [sets, setSets] = useState(initial);

  function toggle(s: RecoverySet) {
    const next = !s.completed;
    setSets((prev) => prev.map((x) => (x.id === s.id ? { ...x, completed: next } : x)));
    void updateSetAction(s.id, { completed: next }).catch(() => {
      toast.error("Couldn't save that. Check your connection.");
      setSets((prev) => prev.map((x) => (x.id === s.id ? { ...x, completed: !next } : x)));
    });
  }

  return (
    <div className="surface-card flex items-center justify-between gap-3 px-card-sm py-3">
      <div className="min-w-0">
        <h2 className="text-subheading">{name}</h2>
        <p className="text-caption text-muted">
          {prescription}
          {note ? ` · ${note}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {sets.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s)}
            aria-pressed={s.completed}
            aria-label={`Round ${s.setNumber} of ${name}`}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-control border-2 transition",
              s.completed ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted hover:border-foreground",
            )}
          >
            {s.completed ? <Check size={18} strokeWidth={3} /> : <span className="text-stat-xs">{s.setNumber}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
