"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function SubmitButton({
  onGate,
}: {
  onGate: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full sm:w-auto"
      loading={pending}
      onClick={onGate}
    >
      Enroll in this plan
    </Button>
  );
}

export function EnrollButton({
  planId,
  planName,
  activePlanName,
  enrollAction,
}: {
  planId: string;
  planName: string;
  activePlanName: string | null;
  enrollAction: (planId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleGate(e: React.MouseEvent<HTMLButtonElement>) {
    if (activePlanName && activePlanName !== planName) {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <>
      <form ref={formRef} action={enrollAction.bind(null, planId)}>
        <SubmitButton onGate={handleGate} />
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch plans?</DialogTitle>
            <DialogDescription>
              You&apos;re currently enrolled in &quot;{activePlanName}&quot;. Enrolling in
              &quot;{planName}&quot; will end that plan and start this one from week 1.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                formRef.current?.requestSubmit();
              }}
            >
              Switch plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
