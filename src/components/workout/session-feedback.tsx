"use client";

import { ArrowDown, ArrowUp, Bolt, Check } from "@/components/icons";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitFeedbackAction } from "@/app/(app)/log/[progressLogId]/actions";
import { cn } from "@/lib/utils";
import type { SessionFeedback as Feedback } from "@/lib/database.types";

const OPTIONS: { value: Feedback; icon: typeof Check; label: string }[] = [
  { value: "too_easy", icon: ArrowDown, label: "Too easy" },
  { value: "just_right", icon: Check, label: "Just right" },
  { value: "too_hard", icon: ArrowUp, label: "Too hard" },
];

/** One-tap post-session rating. Separate from the pre-workout readiness check-in. */
export function SessionFeedback({ progressLogId, initial }: { progressLogId: string; initial: Feedback | null }) {
  const [value, setValue] = useState<Feedback | null>(initial);
  const [adapted, setAdapted] = useState<string[]>([]);
  const [pending, start] = useTransition();

  function pick(v: Feedback) {
    const prev = value;
    setValue(v);
    start(async () => {
      const res = await submitFeedbackAction(progressLogId, v);
      if (res.error) {
        setValue(prev);
        toast.error(res.error);
        return;
      }
      setAdapted(res.adapted ?? []);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How did that session feel?">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={pending}
            onClick={() => pick(o.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-control border py-5 transition disabled:opacity-60",
              value === o.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-surface-raised",
            )}
          >
            <o.icon size={26} />
            <span className="text-heading">{o.label}</span>
          </button>
        ))}
      </div>
      {value && !pending && (
        <p className="text-caption text-muted" role="status">
          Thanks, noted. {adapted.length === 0 ? "Your next sessions use this when setting your weights." : ""}
        </p>
      )}
      {adapted.map((a) => (
        <p key={a} className="flex items-start gap-2 rounded-control border border-primary px-3 py-2 text-body">
          <Bolt size={15} className="mt-0.5 shrink-0 text-primary" /> {a}
        </p>
      ))}
    </div>
  );
}
