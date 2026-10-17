import { notFound } from "next/navigation";
import { ExercisesEditor } from "./exercises-editor";
import { updateWorkoutAction } from "../actions";
import { WorkoutForm } from "../workout-form";
import { requireAdminProfile } from "@/lib/auth/require-profile";
import { SessionIcon } from "@/components/session/session-ui";
import { assignModuleSessions, groupSessions, SESSION_LABEL, type Session } from "@/lib/program/sessions";
import type { Tables, TrainingSetting } from "@/lib/database.types";

export const metadata = { title: "Edit Workout" };

type WorkoutExerciseRow = Tables<"workout_exercises"> & {
  exercise: Pick<Tables<"exercises">, "id" | "name" | "setting"> | null;
};

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdminProfile();

  const [{ data: workout }, { data: sports }, { data: positions }, { data: exercises }] =
    await Promise.all([
      supabase.from("workouts").select("*").eq("id", id).single(),
      supabase.from("sports").select("*").order("name"),
      supabase.from("positions").select("*").order("name"),
      supabase.from("exercises").select("*").order("name"),
    ]);

  if (!workout) notFound();

  const { data: workoutExercises } = (await supabase
    .from("workout_exercises")
    .select("*, exercise:exercises(id,name,setting)")
    .eq("workout_id", id)
    .order("order_index")) as unknown as { data: WorkoutExerciseRow[] | null };

  // How athletes will experience this workout: one session per room, each started and logged separately.
  const ordered = [...(workoutExercises ?? [])].sort((a, b) => a.order_index - b.order_index);
  const assigned = assignModuleSessions(ordered.map((we) => ({ we, setting: (we.exercise?.setting ?? "either") as TrainingSetting })));
  const sessionOf: Record<string, Session> = Object.fromEntries(assigned.map((a) => [a.we.id, a.session]));
  const sessions = groupSessions(assigned.map((a) => ({ setting: a.session }))).map((g) => g.setting);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-title">{workout.name}</h1>
        <p className="mt-1 text-body text-muted">Edit details and build the exercise list.</p>
        {sessions.length > 0 && (
          <p className="text-label mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-foreground">
            Runs as {sessions.length} session{sessions.length === 1 ? "" : "s"}:
            {sessions.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-primary">
                <SessionIcon session={s} size={14} /> {SESSION_LABEL[s]}
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="max-w-xl">
          <h2 className="mb-3 text-heading">Details</h2>
          <WorkoutForm
            workout={workout}
            sports={sports ?? []}
            positions={positions ?? []}
            action={updateWorkoutAction.bind(null, id)}
          />
        </div>

        <div>
          <h2 className="mb-3 text-heading">Exercises</h2>
          <ExercisesEditor
            workoutId={id}
            workoutExercises={workoutExercises ?? []}
            exercises={exercises ?? []}
            sessionOf={sessionOf}
          />
        </div>
      </div>
    </div>
  );
}
