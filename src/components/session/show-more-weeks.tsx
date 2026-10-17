"use client";

import { useState } from "react";

/** "This week" and "Next week" show by default; the rest of the block hides behind one row. */
export function ShowMoreWeeks({ initial, more }: { initial: React.ReactNode; more: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      {initial}
      {expanded ? (
        more
      ) : (
        <button type="button" onClick={() => setExpanded(true)} className="text-label py-1 text-left text-muted hover:text-foreground">
          Show full block
        </button>
      )}
    </>
  );
}
