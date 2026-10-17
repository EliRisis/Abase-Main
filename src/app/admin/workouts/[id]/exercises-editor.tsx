"use client";

import { SessionIcon } from "@/components/session/session-ui";
import { SESSION_SHORT, type Session } from "@/lib/program/sessions";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  addWorkoutExerciseAction,
  moveWorkoutExerciseAction,
  removeWorkoutExerciseAction,
  updateWorkoutExerciseAction,
  type ExerciseRowResult,
} from "../actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/database.types";

type WorkoutExerciseRow = Tables<"workout_exercises"> & {
  exercise: Pick<Tables<"exercises">, "id" | "name"> | null;
};

const emptyState: ExerciseRowResult = {};

export function ExercisesEditor({
  workoutId,
  workoutExercises,
  exercises,
  sessionOf,
}: {
  workoutId: string;
  workoutExercises: WorkoutExerciseRow[];
  exercises: Tables<"exercises">[];
  /** Which session each row lands in when an athlete runs this workout (weight room / field / recovery). */
  sessionOf: Record<string, Session>;
}) {
  const [editing, setEditing] = useState<WorkoutExerciseRow | null>(null);
  const sorted = [...workoutExercises].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex flex-col divide-y divide-border surface-card">
        {sorted.length === 0 && (
          <p className="p-6 text-center text-body text-muted">
            No exercises yet — add the first one below.
          </p>
        )}
        {sorted.map((we, i) => (
          <div key={we.id} className="flex items-center gap-3 p-4">
            <div className="flex flex-col">
              <button
                type="button"
                disabled={i === 0}
                onClick={() =>
                  void moveWorkoutExerciseAction(
                    workoutId,
                    we.id,
                    we.order_index,
                    sorted[i - 1].id,
                    sorted[i - 1].order_index,
                  )
                }
                className="text-muted hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={i === sorted.length - 1}
                onClick={() =>
                  void moveWorkoutExerciseAction(
                    workoutId,
                    we.id,
                    we.order_index,
                    sorted[i + 1].id,
                    sorted[i + 1].order_index,
                  )
                }
                className="text-muted hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body flex flex-wrap items-center gap-2 font-semibold">
                {we.exercise?.name}
                {sessionOf[we.id] && (
                  <span className="text-label-sm inline-flex items-center gap-1 border border-border px-1.5 py-1 text-muted">
                    <SessionIcon session={sessionOf[we.id]} size={11} /> {SESSION_SHORT[sessionOf[we.id]]}
                  </span>
                )}
              </p>
              <p className="text-caption text-muted">
                {we.sets} sets × {we.reps}
                {we.rest_seconds ? ` · rest ${we.rest_seconds}s` : ""}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setEditing(we)}>
              <Pencil size={15} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                void removeWorkoutExerciseAction(we.id, workoutId);
                toast.success("Removed");
              }}
            >
              <Trash2 size={15} className="text-danger" />
            </Button>
          </div>
        ))}
      </div>

      <AddExerciseForm workoutId={workoutId} exercises={exercises} />

      {editing && (
        <EditExerciseDialog
          workoutId={workoutId}
          workoutExercise={editing}
          exercises={exercises}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}

function AddExerciseForm({
  workoutId,
  exercises,
}: {
  workoutId: string;
  exercises: Tables<"exercises">[];
}) {
  const [state, formAction, isPending] = useActionState(
    addWorkoutExerciseAction.bind(null, workoutId),
    emptyState,
  );
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.success("Added");
    }
  }, [state]);

  if (exercises.length === 0) {
    return (
      <p className="text-body text-muted">
        Add exercises to the library first before building this workout.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-card border border-dashed border-border p-4"
    >
      <p className="text-body font-semibold">Add exercise</p>
      <div>
        <Label>Exercise</Label>
        <Select value={exerciseId} onValueChange={setExerciseId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an exercise" />
          </SelectTrigger>
          <SelectContent>
            {exercises.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="exerciseId" value={exerciseId} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="sets">Sets</Label>
          <Input id="sets" name="sets" type="number" min={1} max={20} defaultValue={3} required />
        </div>
        <div>
          <Label htmlFor="reps">Reps</Label>
          <Input id="reps" name="reps" defaultValue="8-10" required />
        </div>
        <div>
          <Label htmlFor="restSeconds">Rest (sec)</Label>
          <Input id="restSeconds" name="restSeconds" type="number" min={0} max={1800} />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      {state.error && (
        <p className="text-body text-danger" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" loading={isPending} className="self-start">
        <Plus size={16} /> Add to workout
      </Button>
    </form>
  );
}

function EditExerciseDialog({
  workoutId,
  workoutExercise,
  exercises,
  onOpenChange,
}: {
  workoutId: string;
  workoutExercise: WorkoutExerciseRow;
  exercises: Tables<"exercises">[];
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateWorkoutExerciseAction.bind(null, workoutExercise.id, workoutId),
    emptyState,
  );
  const [exerciseId, setExerciseId] = useState(workoutExercise.exercise_id);

  useEffect(() => {
    if (state.success) {
      toast.success("Saved");
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit exercise</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-section">
          <div>
            <Label>Exercise</Label>
            <Select value={exerciseId} onValueChange={setExerciseId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="exerciseId" value={exerciseId} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                name="sets"
                type="number"
                min={1}
                max={20}
                defaultValue={workoutExercise.sets}
                required
              />
            </div>
            <div>
              <Label htmlFor="reps">Reps</Label>
              <Input id="reps" name="reps" defaultValue={workoutExercise.reps} required />
            </div>
            <div>
              <Label htmlFor="restSeconds">Rest (sec)</Label>
              <Input
                id="restSeconds"
                name="restSeconds"
                type="number"
                min={0}
                max={1800}
                defaultValue={workoutExercise.rest_seconds ?? ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={workoutExercise.notes ?? ""} />
          </div>
          {state.error && (
            <p className="text-body text-danger" role="alert">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
