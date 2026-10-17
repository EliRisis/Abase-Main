"use client";

import { CheckCheck } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { completeAllAsPrescribedAction } from "@/app/(app)/log/[progressLogId]/actions";
import { Button } from "@/components/ui/button";

/** One tap for the common case: every set not yet ticked off, done exactly as prescribed. */
export function CompleteAllButton({ progressLogId, remaining }: { progressLogId: string; remaining: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (remaining === 0) return null;
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      loading={pending}
      onClick={() =>
        start(async () => {
          try {
            const n = await completeAllAsPrescribedAction(progressLogId);
            toast.success(`${n} set${n === 1 ? "" : "s"} marked done as prescribed`);
            router.refresh();
          } catch {
            toast.error("Couldn't save. Check your connection.");
          }
        })
      }
    >
      <CheckCheck size={16} /> Everything as prescribed ({remaining} set{remaining === 1 ? "" : "s"} left)
    </Button>
  );
}
