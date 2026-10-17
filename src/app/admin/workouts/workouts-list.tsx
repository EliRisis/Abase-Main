"use client";

import { SportLabel } from "@/components/icons/app-icon";
import { Trash2 } from "@/components/icons";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { deleteWorkoutAction } from "./actions";
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

type WorkoutRow = Tables<"workouts"> & {
  sport: Pick<Tables<"sports">, "name" | "slug"> | null;
  position: Pick<Tables<"positions">, "name"> | null;
};

export function WorkoutsList({ workouts }: { workouts: WorkoutRow[] }) {
  return (
    <div className="flex flex-col divide-y divide-border surface-card">
      {workouts.length === 0 && (
        <p className="p-6 text-center text-body text-muted">No workouts yet.</p>
      )}
      {workouts.map((workout) => (
        <div key={workout.id} className="flex items-center justify-between p-4">
          <Link href={`/admin/workouts/${workout.id}`} className="min-w-0 flex-1">
            <p className="text-body font-semibold">{workout.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {workout.sport && (
                <Badge variant="primary">
                  <SportLabel slug={workout.sport.slug} name={workout.sport.name} size={16} />
                </Badge>
              )}
              {workout.position && <Badge>{workout.position.name}</Badge>}
              {workout.level && <Badge variant="default">{workout.level}</Badge>}
            </div>
          </Link>
          <DeleteButton id={workout.id} name={workout.name} />
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
    const result = await deleteWorkoutAction(id);
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
            Workouts used in a plan can&apos;t be deleted until removed from
            that plan&apos;s schedule.
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
