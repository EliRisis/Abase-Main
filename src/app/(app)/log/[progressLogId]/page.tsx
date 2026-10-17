import { Clock, Info, X } from "@/components/icons";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SessionIcon } from "@/components/session/session-ui";
import { CompleteAllButton } from "@/components/workout/complete-all-button";
import { ExerciseLogger, type LoggerSet } from "@/components/workout/exercise-logger";
import { FieldLogger } from "@/components/workout/field-logger";
import { FinishWorkoutButton } from "@/components/workout/finish-workout-button";
import { RecoveryLogger } from "@/components/workout/recovery-logger";
import { parseRepRange } from "@/lib/program/overload";
import { fieldSpec, SESSION_HINT, SESSION_LABEL, type Session } from "@/lib/program/sessions";
import { lastLogged } from "@/lib/program/service";
import { whyNoteFor } from "@/lib/program/why";
import { createClient } from "@/lib/supabase/server";
import type { PrescriptionMode, Tables, TrainingSetting } from "@/lib/database.types";

export const metadata = { title: "Log Session" };

type ProgressLogWithWorkout = Tables<"progress_logs"> & {
  workout: Pick<Tables<"workouts">, "id" | "name" | "description" | "estimated_minutes" | "why_note"> | null;
  day: Pick<Tables<"user_program_days">, "id" | "title" | "why_note" | "est_minutes" | "note"> | null;
};
type ExerciseMeta = { id: string; name: string; prescription_mode: PrescriptionMode; setting: TrainingSetting } | null;
type SetLog = Tables<"exercise_logs">;

interface Card {
  key: string;
  exerciseId: string | null;
  name: string;
  sets: number;
  reps: string;
  rest: number | null;
  note: string | null;
  target: number | null;
  unit: string;
  mode: PrescriptionMode | null;
  session: Session;
  logs: SetLog[];
}

export default async function LogWorkoutPage({ params }: { params: Promise<{ progressLogId: string }> }) {
  const { progressLogId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: progressLog } = (await supabase
    .from("progress_logs")
    .select("*, workout:workouts(id,name,description,estimated_minutes,why_note), day:user_program_days(id,title,why_note,est_minutes,note)")
    .eq("id", progressLogId)
    .eq("user_id", user.id)
    .single()) as unknown as { data: ProgressLogWithWorkout | null };

  if (!progressLog || (!progressLog.workout && !progressLog.day)) notFound();
  if (progressLog.completed_at) redirect(`/log/${progressLogId}/done`);

  const { data: exerciseLogs } = await supabase.from("exercise_logs").select("*").eq("progress_log_id", progressLogId);
  const logs = (exerciseLogs ?? []) as SetLog[];

  const isProgramSession = !!progressLog.day && !progressLog.workout;
  const title = progressLog.workout?.name ?? progressLog.day?.title ?? "Session";
  const minutes = progressLog.workout?.estimated_minutes ?? progressLog.day?.est_minutes ?? null;
  let why = progressLog.day?.why_note ?? progressLog.workout?.why_note ?? null;
  if (!why && progressLog.workout) {
    const { data: prof } = await supabase.from("profiles").select("position_id").eq("id", user.id).maybeSingle();
    why = (await whyNoteFor(supabase, { override: null, workoutIds: [progressLog.workout.id], positionId: prof?.position_id ?? null }))?.text ?? null;
  }

  // A session log holds only its own exercises. Logs from before sessions existed (setting null) hold the whole day.
  const logSession = (progressLog.setting as Session | null) ?? null;
  const sessionOf = (ex: ExerciseMeta): Session => logSession ?? (ex?.setting === "field" ? "field" : "weight_room");

  let cards: Card[] = [];
  if (isProgramSession) {
    const { data: rows } = await supabase
      .from("user_program_day_exercises")
      .select("*, exercise:exercises(id, name, prescription_mode, setting)")
      .eq("program_day_id", progressLog.day!.id)
      .order("order_index");
    cards = (rows ?? []).map((r) => ({
      key: r.id,
      exerciseId: r.exercise_id,
      name: r.exercise_name,
      sets: r.sets,
      reps: r.reps,
      rest: r.rest_seconds,
      note: r.rx_note,
      target: r.target_weight != null ? Number(r.target_weight) : null,
      unit: r.weight_unit,
      mode: (r.exercise as unknown as ExerciseMeta)?.prescription_mode ?? null,
      session: logSession ?? (r.setting === "field" ? "field" : r.setting === "recovery" ? "recovery" : "weight_room"),
      logs: logs.filter((l) => l.program_day_exercise_id === r.id).sort((a, b) => a.set_number - b.set_number),
    }));
  } else {
    const { data: workoutExercises } = await supabase
      .from("workout_exercises")
      .select("*, exercise:exercises(id, name, prescription_mode, setting)")
      .eq("workout_id", progressLog.workout!.id)
      .order("order_index");
    cards = (workoutExercises ?? []).map((we) => {
      const ex = we.exercise as unknown as ExerciseMeta;
      const own = logs.filter((l) => l.workout_exercise_id === we.id).sort((a, b) => a.set_number - b.set_number);
      const firstWeight = own.find((l) => l.weight != null)?.weight;
      return {
        key: we.id,
        exerciseId: we.exercise_id,
        name: ex?.name ?? "Exercise",
        sets: we.sets,
        reps: we.reps,
        rest: we.rest_seconds,
        note: we.notes,
        target: firstWeight != null ? Number(firstWeight) : null,
        unit: own[0]?.weight_unit ?? "lb",
        mode: ex?.prescription_mode ?? null,
        session: sessionOf(ex),
        logs: own,
      };
    });
  }
  cards = cards.filter((c) => c.logs.length > 0);

  const session: Session = logSession ?? (cards.every((c) => c.session === "field") && cards.length > 0 ? "field" : "weight_room");
  const exerciseIds = cards.map((c) => c.exerciseId).filter((x): x is string => !!x);

  // "Last time" per exercise, and the fastest logged time per drill, from the athlete's own history
  const last = await lastLogged(supabase, user.id, exerciseIds);
  const best = new Map<string, number>();
  if (session === "field" && exerciseIds.length) {
    const { data: timed } = await supabase
      .from("exercise_logs")
      .select("exercise_id, result_seconds")
      .eq("user_id", user.id)
      .in("exercise_id", exerciseIds)
      .not("result_seconds", "is", null)
      .neq("progress_log_id", progressLogId);
    for (const t of timed ?? []) {
      const v = Number(t.result_seconds);
      if (t.exercise_id && (!best.has(t.exercise_id) || v < best.get(t.exercise_id)!)) best.set(t.exercise_id, v);
    }
  }
  const remaining = logs.filter((l) => !l.completed).length;
  const finishLabel = session === "weight_room" ? "Finish weight room" : session === "field" ? "Finish field session" : "Finish recovery";

  return (
    <div className="flex flex-col gap-page pb-28">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
            <SessionIcon session={session} size={28} />
          </span>
          <div className="min-w-0">
            <p className="text-label text-primary">{SESSION_LABEL[session]}</p>
            <h1 className="text-title mt-1">{title}</h1>
            <span className="mt-1.5 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted">
              {minutes && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> ~{minutes} min
                </span>
              )}
              <span>{SESSION_HINT[session]}</span>
              {progressLog.supplemental ? <span>Extra session</span> : null}
            </span>
          </div>
        </div>
        <Link href={isProgramSession ? "/today" : "/dashboard"} className="rounded-control p-2 text-muted transition hover:text-foreground" aria-label="Cancel and go back">
          <X size={22} />
        </Link>
      </div>

      {why && (
        <p className="flex items-start gap-2 border-l-[3px] border-l-primary bg-surface px-3 py-2 text-caption">
          <Info size={14} className="mt-0.5 shrink-0 text-primary" />
          <span>
            <span className="font-semibold">Why this matters:</span> {why}
          </span>
        </p>
      )}

      <p className="-mt-2 text-caption text-muted">
        {session === "weight_room"
          ? "Weights are filled in from your plan and your last session. Tick each set when it's done and only change a number when yours was different."
          : session === "field"
            ? "Tick each rep as you finish it. Type your time on timed runs and Abase keeps your best. The rest clock starts when you tick."
            : "Tick each round. Nothing to enter, keep it easy."}
      </p>

      {session !== "field" && <CompleteAllButton progressLogId={progressLog.id} remaining={remaining} />}

      <div className="flex flex-col gap-section">
        {cards.map((c) => {
          const range = parseRepRange(c.reps);
          const prev = c.exerciseId ? last.get(c.exerciseId) : undefined;
          const loaded = c.mode === "loaded" || c.logs.some((l) => l.weight != null);
          const ticked = c.logs.filter((l) => l.completed).length;

          if (c.session === "field") {
            const spec = fieldSpec(c.reps);
            return (
              <FieldLogger
                key={`${c.key}:${ticked}`}
                name={c.name}
                spec={spec}
                restSeconds={c.rest}
                note={c.note}
                best={c.exerciseId ? (best.get(c.exerciseId) ?? null) : null}
                sets={c.logs.map((l) => ({ id: l.id, setNumber: l.set_number, completed: l.completed, resultSeconds: l.result_seconds != null ? Number(l.result_seconds) : null }))}
              />
            );
          }
          if (c.session === "recovery") {
            return (
              <RecoveryLogger
                key={`${c.key}:${ticked}`}
                name={c.name}
                prescription={`${c.sets} × ${c.reps}`}
                note={c.note}
                sets={c.logs.map((l) => ({ id: l.id, setNumber: l.set_number, completed: l.completed }))}
              />
            );
          }
          const sets: LoggerSet[] = c.logs.map((l) => ({
            id: l.id,
            setNumber: l.set_number,
            reps: l.reps_completed ?? range?.max ?? null,
            weight: l.weight != null ? Number(l.weight) : c.target,
            completed: l.completed,
          }));
          return (
            <ExerciseLogger
              key={`${c.key}:${ticked}`}
              name={c.name}
              prescription={`${c.sets} sets × ${c.reps}${c.target ? ` @ ${c.target} ${c.unit}` : ""}`}
              note={c.note}
              restSeconds={c.rest}
              lastTime={
                prev
                  ? `Last time: ${prev.weight} ${prev.unit} × ${prev.reps.join(", ")}`
                  : loaded && c.target == null
                    ? "First time: pick a weight you can lift for all the reps with about 2 left in the tank. Abase remembers it and builds from there."
                    : null
              }
              countsReps={!!range}
              showWeight={loaded}
              unit={prev?.unit ?? c.unit}
              sets={sets}
            />
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 safe-bottom sm:sticky sm:border-t-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto max-w-5xl">
          <FinishWorkoutButton progressLogId={progressLog.id} label={finishLabel} />
        </div>
      </div>
    </div>
  );
}
