"use client";

import { Check, Clock } from "@/components/icons";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateSetAction } from "@/app/(app)/log/[progressLogId]/actions";
import { clock, type FieldSpec } from "@/lib/program/sessions";
import { cn } from "@/lib/utils";

export interface FieldSet {
  id: string;
  setNumber: number;
  completed: boolean;
  resultSeconds: number | null;
}

const UNIT_LABEL = { yd: "yd", m: "m", s: "sec", min: "min" } as const;

/**
 * Field logging is distance / time / rest first: one big tile per rep, a stopwatch-style time box for
 * distance work, and a rest countdown that starts as soon as a rep is ticked.
 */
export function FieldLogger({
  name,
  spec,
  restSeconds,
  note,
  best,
  sets: initial,
}: {
  name: string;
  spec: FieldSpec;
  restSeconds: number | null;
  note: string | null;
  /** Fastest time this athlete has logged for this drill before, in seconds. */
  best: number | null;
  sets: FieldSet[];
}) {
  const [sets, setSets] = useState(initial);
  const [rest, setRest] = useState<number | null>(null);
  const [text, setText] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((s) => [s.id, s.resultSeconds != null ? String(s.resultSeconds) : ""])));
  const running = rest !== null && rest > 0;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setRest((r) => (r === null ? null : r - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (rest !== 0) return;
    const t = setTimeout(() => setRest(null), 1200);
    return () => clearTimeout(t);
  }, [rest]);

  const parse = (id: string): number | null => {
    const v = Number(text[id]);
    return Number.isFinite(v) && v > 0 && v <= 3600 ? v : null;
  };

  function toggle(s: FieldSet) {
    const next = !s.completed;
    const time = spec.timed ? parse(s.id) : null;
    setSets((prev) => prev.map((x) => (x.id === s.id ? { ...x, completed: next, resultSeconds: time } : x)));
    if (next && restSeconds && sets.some((x) => x.id !== s.id && !x.completed)) setRest(restSeconds);
    if (!next) setRest(null);
    void updateSetAction(s.id, next ? { completed: true, resultSeconds: time } : { completed: false }).catch(() => {
      toast.error("Couldn't save that rep. Check your connection.");
      setSets((prev) => prev.map((x) => (x.id === s.id ? { ...x, completed: !next } : x)));
    });
  }

  function saveTime(s: FieldSet) {
    const time = parse(s.id);
    setSets((prev) => prev.map((x) => (x.id === s.id ? { ...x, resultSeconds: time } : x)));
    if (s.completed) void updateSetAction(s.id, { resultSeconds: time }).catch(() => toast.error("Couldn't save that time."));
  }

  const isPr = (s: FieldSet) => spec.timed && s.completed && s.resultSeconds != null && best != null && s.resultSeconds < best;
  const done = sets.filter((s) => s.completed).length;

  return (
    <div className="surface-card overflow-hidden border-l-[4px] border-l-primary">
      <div className="lane-stripes flex items-start justify-between gap-3 border-b border-border px-card-sm py-3">
        <div className="min-w-0">
          <h2 className="text-heading">{name}</h2>
          {note && <p className="mt-1 text-caption text-muted">{note}</p>}
        </div>
        <div className="shrink-0 text-right">
          {spec.amount ? (
            <div className="text-stat leading-none">
              {spec.amount}
              {spec.unit && <span className="ml-1 text-heading text-muted">{UNIT_LABEL[spec.unit]}</span>}
            </div>
          ) : (
            <div className="text-title leading-none">{spec.label}</div>
          )}
          <div className="text-label-sm mt-1 text-muted">
            {done}/{sets.length} reps
          </div>
        </div>
      </div>

      {(best != null || restSeconds) && (
        <div className="flex items-center gap-4 border-b border-border px-card-sm py-2 text-label text-muted">
          {best != null && spec.timed && (
            <span>
              Best <span className="text-stat-xs text-foreground">{best}</span> sec
            </span>
          )}
          {restSeconds ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} strokeWidth={3} /> Rest {clock(restSeconds)}
            </span>
          ) : null}
        </div>
      )}

      {rest !== null && (
        <div className="border-b border-border bg-primary px-card-sm py-3 text-primary-foreground" role="timer" aria-live="off">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-label-sm">{rest > 0 ? "Rest" : "Go"}</p>
              <p className="text-stat-xl">{rest > 0 ? clock(rest) : "GO"}</p>
            </div>
            <button type="button" onClick={() => setRest(null)} className="border-2 border-primary-foreground px-4 py-2 text-label">
              Skip
            </button>
          </div>
          <div className="mt-2 h-1.5 bg-primary-foreground/25">
            <div className="h-full bg-primary-foreground transition-[width] duration-1000 ease-linear" style={{ width: `${restSeconds ? (Math.max(rest, 0) / restSeconds) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <ul className="flex flex-col divide-y divide-border">
        {sets.map((s) => (
          <li key={s.id} className={cn("flex items-center gap-3 px-card-sm py-2.5", s.completed && "bg-surface-raised")}>
            <span className="text-stat-sm w-9 shrink-0 text-muted">{String(s.setNumber).padStart(2, "0")}</span>
            {spec.timed ? (
              <label className="flex flex-1 items-baseline gap-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  aria-label={`Rep ${s.setNumber} time in seconds`}
                  value={text[s.id] ?? ""}
                  onChange={(e) => setText((t) => ({ ...t, [s.id]: e.target.value }))}
                  onBlur={() => saveTime(s)}
                  className="text-stat h-12 w-full min-w-0 max-w-32 border-b-2 border-border bg-transparent outline-none placeholder:text-border focus:border-primary"
                />
                <span className="text-label text-muted">sec</span>
                {isPr(s) && <span className="text-label-sm bg-primary px-1.5 py-1 text-primary-foreground">PR</span>}
              </label>
            ) : (
              <span className="flex-1 text-heading text-muted">{spec.label}</span>
            )}
            <button
              type="button"
              onClick={() => toggle(s)}
              aria-pressed={s.completed}
              aria-label={`Mark rep ${s.setNumber} done`}
              className={cn(
                "flex h-12 w-16 shrink-0 items-center justify-center rounded-control border-2 transition",
                s.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted hover:border-foreground hover:text-foreground",
              )}
            >
              <Check size={22} strokeWidth={3} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
