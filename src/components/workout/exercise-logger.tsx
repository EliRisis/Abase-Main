"use client";

import { Check, CheckCheck, Minus, Plus } from "@/components/icons";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSetsAction, updateSetAction } from "@/app/(app)/log/[progressLogId]/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LoggerSet {
  id: string;
  setNumber: number;
  /** Pre-filled: what they logged, else the prescription. */
  reps: number | null;
  weight: number | null;
  completed: boolean;
}

export interface ExerciseLoggerProps {
  name: string;
  prescription: string;
  note: string | null;
  restSeconds: number | null;
  /** "Last time: 185 lb × 5, 5, 5" */
  lastTime: string | null;
  /** Show reps as a number to adjust (false for "20 yd", "30 s"...). */
  countsReps: boolean;
  /** Show a weight to adjust (loaded work, or anything already logged with weight). */
  showWeight: boolean;
  unit: string;
  sets: LoggerSet[];
}

function Stepper({ value, onChange, step, min, label }: { value: number | null; onChange: (v: number) => void; step: number; min: number; label: string }) {
  const v = value ?? 0;
  return (
    <div className="flex h-12 w-[6.25rem] shrink-0 items-center rounded-control border border-border bg-background">
      <button type="button" aria-label={`Less ${label}`} onClick={() => onChange(Math.max(min, +(v - step).toFixed(2)))} className="flex h-full w-7 items-center justify-center text-muted hover:text-foreground">
        <Minus size={14} />
      </button>
      <input
        type="number"
        inputMode="decimal"
        aria-label={label}
        value={value ?? ""}
        placeholder="0"
        onChange={(e) => onChange(e.target.value === "" ? min : Number(e.target.value))}
        className="text-stat-sm h-full w-11 min-w-0 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" aria-label={`More ${label}`} onClick={() => onChange(+(v + step).toFixed(2))} className="flex h-full w-7 items-center justify-center text-muted hover:text-foreground">
        <Plus size={14} />
      </button>
    </div>
  );
}

export function ExerciseLogger(props: ExerciseLoggerProps) {
  const [sets, setSets] = useState(props.sets);
  const [pending, start] = useTransition();
  const step = props.unit === "kg" ? 2.5 : 5;
  const allDone = sets.every((s) => s.completed);

  function patch(id: string, change: Partial<LoggerSet>) {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, ...change } : s)));
    const target = sets.find((s) => s.id === id);
    // values on a set already ticked off are saved as they change; unticked sets save when ticked
    if (target?.completed && (change.reps !== undefined || change.weight !== undefined)) {
      void updateSetAction(id, { repsCompleted: change.reps ?? undefined, weight: change.weight ?? undefined }).catch(() => toast.error("Couldn't save that change."));
    }
  }

  function toggle(s: LoggerSet) {
    const next = !s.completed;
    setSets((prev) => prev.map((x) => (x.id === s.id ? { ...x, completed: next } : x)));
    void updateSetAction(s.id, next ? { completed: true, repsCompleted: props.countsReps ? s.reps : null, weight: props.showWeight ? s.weight : null } : { completed: false }).catch(() => {
      toast.error("Couldn't save that set. Check your connection.");
      setSets((prev) => prev.map((x) => (x.id === s.id ? { ...x, completed: !next } : x)));
    });
  }

  function allAsPrescribed() {
    const todo = sets.filter((s) => !s.completed);
    if (todo.length === 0) return;
    setSets((prev) => prev.map((s) => ({ ...s, completed: true })));
    start(async () => {
      try {
        await saveSetsAction(todo.map((s) => ({ id: s.id, repsCompleted: props.countsReps ? s.reps : null, weight: props.showWeight ? s.weight : null, completed: true })));
      } catch {
        toast.error("Couldn't save. Check your connection.");
        setSets((prev) => prev.map((s) => (todo.some((t) => t.id === s.id) ? { ...s, completed: false } : s)));
      }
    });
  }

  return (
    <div className="surface-card flex flex-col overflow-hidden">
      <div className="plate flex items-start justify-between gap-3 px-card-sm py-3">
        <div className="min-w-0">
          <h2 className="text-heading">{props.name}</h2>
          <p className="mt-1 text-caption text-muted">
            {props.prescription}
            {props.restSeconds ? ` · rest ${props.restSeconds}s` : ""}
          </p>
          {props.lastTime && <p className="text-caption text-muted">{props.lastTime}</p>}
          {props.note && <p className="mt-1 text-caption text-muted">{props.note}</p>}
        </div>
        <Button type="button" size="sm" variant={allDone ? "ghost" : "secondary"} disabled={allDone || pending} onClick={allAsPrescribed} className="shrink-0">
          <CheckCheck size={14} /> {allDone ? "Done" : "As prescribed"}
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-card-sm">
        <div className="text-label-sm flex items-center gap-1.5 text-muted">
          <span className="w-7 shrink-0 text-center">Set</span>
          {props.countsReps && <span className="w-[6.25rem] shrink-0 text-center">Reps</span>}
          {props.showWeight && <span className="w-[6.25rem] shrink-0 text-center">Weight ({props.unit})</span>}
        </div>
        {sets.map((s) => (
          <div key={s.id} className={cn("flex items-center gap-1.5", s.completed && "[&>*:not(button)]:opacity-60")}>
            <span className="text-stat-sm w-7 shrink-0 text-center text-muted">{s.setNumber}</span>
            {props.countsReps ? (
              <Stepper label={`Set ${s.setNumber} reps`} value={s.reps} step={1} min={0} onChange={(v) => patch(s.id, { reps: Math.round(v) })} />
            ) : (
              <span className="text-heading flex h-12 items-center text-muted">{props.prescription.split("×").pop()?.trim()}</span>
            )}
            {props.showWeight && <Stepper label={`Set ${s.setNumber} weight`} value={s.weight} step={step} min={0} onChange={(v) => patch(s.id, { weight: v })} />}
            <button
              type="button"
              onClick={() => toggle(s)}
              aria-pressed={s.completed}
              aria-label={`Mark set ${s.setNumber} complete`}
              className={cn(
                "ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-control border-2 transition",
                s.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted hover:border-foreground hover:text-foreground",
              )}
            >
              <Check size={20} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
