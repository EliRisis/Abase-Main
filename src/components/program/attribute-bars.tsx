import { ATTRIBUTE_ICON } from "@/components/icons";
import { ATTRIBUTES, ATTRIBUTE_LABEL } from "@/lib/training";
import type { TrainingAttribute } from "@/lib/database.types";

type Vec = Record<TrainingAttribute, number>;

/** 7-attribute bar chart on a 0-10 scale. `marks` draws a small tick per attribute (e.g. the target). */
export function AttributeBars({
  values,
  highlight = [],
  compact = false,
}: {
  values: Partial<Vec>;
  highlight?: TrainingAttribute[];
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {ATTRIBUTES.map((a) => {
        const v = Math.max(0, Math.min(10, values[a] ?? 0));
        const on = highlight.includes(a);
        return (
          <div key={a} className="flex items-center gap-2 text-caption">
            <span className={compact ? "flex w-24 shrink-0 items-center gap-1.5" : "flex w-32 shrink-0 items-center gap-1.5"}>
              {(() => {
                const Icon = ATTRIBUTE_ICON[a];
                return <Icon size={14} className={on ? "text-primary" : "text-muted"} />;
              })()}
              <span className="text-label text-foreground">{ATTRIBUTE_LABEL[a]}</span>
            </span>
            <div className="h-2.5 flex-1 overflow-hidden bg-surface-raised" role="img" aria-label={`${ATTRIBUTE_LABEL[a]} ${v.toFixed(1)} out of 10`}>
              <div className={on ? "h-full bg-primary" : "h-full bg-foreground/70"} style={{ width: `${v * 10}%` }} />
            </div>
            <span className="w-9 shrink-0 text-right text-stat-xs">{v.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}
