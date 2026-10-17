"use client";

import { Check } from "@/components/icons";
import {
  SEASON_CHOICE_HINT,
  SEASON_CHOICE_LABEL,
  SEASON_REFINE_HINT,
  SEASON_REFINE_LABEL,
  choiceFromPhase,
  phaseFromChoice,
  type SeasonChoice,
} from "@/lib/training";
import { cn } from "@/lib/utils";
import type { TrainingPhase } from "@/lib/database.types";

/** In Season / Off Season, plus one optional refinement. Emits the underlying phase. */
export function SeasonPicker({ value, onChange, disabled }: { value: TrainingPhase; onChange: (phase: TrainingPhase) => void; disabled?: boolean }) {
  const { choice, refined } = choiceFromPhase(value);
  const choices: SeasonChoice[] = ["off", "in"];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Where are you in your season?">
        {choices.map((c) => {
          const on = c === choice;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange(phaseFromChoice(c, false))}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-control border p-3 text-left transition disabled:opacity-50",
                on ? "border-primary border-l-[4px] bg-surface-raised" : "border-border bg-background hover:bg-surface-raised",
              )}
            >
              <span className="text-subheading">{SEASON_CHOICE_LABEL[c]}</span>
              <span className="text-caption text-muted">{SEASON_CHOICE_HINT[c]}</span>
            </button>
          );
        })}
      </div>
      <label className={cn("flex cursor-pointer items-start gap-2.5 rounded-control px-1 py-1.5", disabled && "opacity-50")}>
        <button
          type="button"
          role="switch"
          aria-checked={refined}
          disabled={disabled}
          onClick={() => onChange(phaseFromChoice(choice, !refined))}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-chip border transition",
            refined ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
          )}
        >
          {refined && <Check size={13} strokeWidth={3} />}
        </button>
        <span className="flex flex-col">
          <span className="text-body font-medium">{SEASON_REFINE_LABEL[choice]} <span className="text-muted">(optional)</span></span>
          <span className="text-caption text-muted">{SEASON_REFINE_HINT[choice]}</span>
        </span>
      </label>
    </div>
  );
}
