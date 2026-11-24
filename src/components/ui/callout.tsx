import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A short note inside a screen: a small muted lead-in ("Why this matters", "Heads up") over the text.
 * One quiet box, no coloured edge and no tint, so it never competes with the screen's primary action.
 */
export function Callout({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("surface-inset flex flex-col gap-1 px-card-sm py-3", className)}>
      <p className="text-label-sm text-muted">{label}</p>
      <div className="text-caption text-foreground">{children}</div>
    </div>
  );
}
