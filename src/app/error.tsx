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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <AlertTriangle size={36} className="text-danger" />
      <h1 className="text-title">Something went wrong</h1>
      <p className="max-w-sm text-body text-muted">
        That&apos;s on us — try again, and if it keeps happening let us know.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
