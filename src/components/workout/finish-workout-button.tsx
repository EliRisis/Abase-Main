"use client";

import { useFormStatus } from "react-dom";
import { finishWorkoutAction } from "@/app/(app)/log/[progressLogId]/actions";
import { Button } from "@/components/ui/button";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {label}
    </Button>
  );
}

export function FinishWorkoutButton({ progressLogId, label = "Finish workout" }: { progressLogId: string; label?: string }) {
  return (
    <form action={finishWorkoutAction.bind(null, progressLogId)}>
      <SubmitButton label={label} />
    </form>
  );
}
