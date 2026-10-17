"use client";

import { SportLabel } from "@/components/icons/app-icon";
import { EyeOff, Trash2 } from "@/components/icons";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deletePlanAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tables } from "@/lib/database.types";

type PlanRow = Tables<"plans"> & {
  sport: Pick<Tables<"sports">, "name" | "slug"> | null;
  position: Pick<Tables<"positions">, "name"> | null;
};

export function PlansList({ plans }: { plans: PlanRow[] }) {
  return (
    <div className="flex flex-col divide-y divide-border surface-card">
      {plans.length === 0 && (
        <p className="p-6 text-center text-body text-muted">No plans yet.</p>
      )}
      {plans.map((plan) => (
        <div key={plan.id} className="flex items-center justify-between p-4">
          <Link href={`/admin/plans/${plan.id}`} className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-body font-semibold">
              {plan.name}
              {!plan.published && (
                <span title="Unpublished (draft)">
                  <EyeOff size={13} className="text-muted" />
                </span>
              )}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {plan.sport && (
                <Badge variant="primary">
                  <SportLabel slug={plan.sport.slug} name={plan.sport.name} size={16} />
                </Badge>
              )}
              {plan.position && <Badge>{plan.position.name}</Badge>}
              <Badge variant="default">
                {plan.weeks}w × {plan.days_per_week}/wk
              </Badge>
            </div>
          </Link>
          <DeleteButton id={plan.id} name={plan.name} />
        </div>
      ))}
    </div>
  );
}

function DeleteButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deletePlanAction(id);
    setPending(false);
    setOpen(false);
    if (result?.error) toast.error(result.error);
    else toast.success(`${name} deleted`);
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 size={15} className="text-danger" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
          </DialogHeader>
          <p className="text-body text-muted">
            This removes the plan and its weekly schedule. Athletes currently
            enrolled will lose access to it.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
