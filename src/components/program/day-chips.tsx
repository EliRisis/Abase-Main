"use client";

import { Check } from "@/components/icons";
import { MAX_TRAINING_DAYS, MIN_TRAINING_DAYS } from "@/lib/program/schedule";
import { cn } from "@/lib/utils";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** The 7-chip "which days can you train?" picker: onboarding, Adjust program, Start a new block and Edit days all share this. */
export function DayChips({
  value,
  onChange,
  name = "trainingDays",
}: {
  /** ISO weekdays, 1=Mon..7=Sun. */
  value: number[];
  onChange: (days: number[]) => void;
  /** Form field name for the hidden inputs this renders (one per selected day). */
  name?: string;
}) {
  const atMax = value.length >= MAX_TRAINING_DAYS;
  function toggle(d: number) {
    if (value.includes(d)) {
      if (value.length <= MIN_TRAINING_DAYS) return;
      onChange(value.filter((x) => x !== d).sort((a, b) => a - b));
    } else {
      if (atMax) return;
      onChange([...value, d].sort((a, b) => a - b));
    }
  }
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Which days can you train?">
        {LETTERS.map((letter, i) => {
          const d = i + 1;
          const on = value.includes(d);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              aria-label={NAMES[i]}
              onClick={() => toggle(d)}
              disabled={(!on && atMax) || (on && value.length <= MIN_TRAINING_DAYS)}
              className={cn(
                "flex h-11 flex-col items-center justify-center gap-0.5 rounded-control border text-label transition disabled:opacity-40",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-surface-raised",
              )}
            >
              {on ? <Check size={14} strokeWidth={3} /> : letter}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-caption text-muted">
        {value.length} day{value.length === 1 ? "" : "s"} a week. Pick {MIN_TRAINING_DAYS} to {MAX_TRAINING_DAYS}.
      </p>
      {value.map((d) => (
        <input key={d} type="hidden" name={name} value={d} />
      ))}
    </div>
  );
}
