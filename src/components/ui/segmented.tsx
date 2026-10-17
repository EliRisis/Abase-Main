"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  hint?: string;
}

/** A compact single-choice picker (radio group) built on the design tokens. */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  columns,
}: {
  label: string;
  value: T | null;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label text-muted">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={on}
              title={o.hint}
              onClick={() => onChange(o.value)}
              className={cn(
                "min-h-11 rounded-control border px-2 py-2 text-center text-body font-semibold transition",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted hover:bg-surface-raised hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
