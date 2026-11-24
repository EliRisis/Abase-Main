"use client";

import { AlertTriangle } from "@/components/icons";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-section px-6 py-20 text-center">
      <AlertTriangle size={36} className="text-danger" />
      <h1 className="text-title">That didn&apos;t load</h1>
      <p className="max-w-sm text-body text-muted">
        Nothing you did caused this, and your logged sets are safe. Try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
