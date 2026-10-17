import { CheckCircle2 } from "@/components/icons";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startWorkoutAction } from "@/app/(app)/dashboard/actions";
import { SessionIcon } from "@/components/session/session-ui";
import { SessionFeedback } from "@/components/workout/session-feedback";
import { Button } from "@/components/ui/button";
import { assignModuleSessions, groupSessions, SESSION_LABEL, SESSION_SHORT, sessionsDoneFor, type Session } from "@/lib/program/sessions";
import { createClient } from "@/lib/supabase/server";
import type { TrainingSetting } from "@/lib/database.types";

export const metadata = { title: "Session done" };

export default async function SessionDonePage({ params }: { params: Promise<{ progressLogId: string }> }) {
  const { progressLogId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: log } = await supabase
    .from("progress_logs")
    .select("id, created_at, completed_at, feedback, setting, program_day_id, plan_workout_id, workout_id, user_plan_id, week_number, day_number, workout:workouts(name), day:user_program_days(title)")
    .eq("id", progressLogId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!log) notFound();
  if (!log.completed_at) redirect(`/log/${progressLogId}`);

  const { data: sets } = await supabase.from("exercise_logs").select("weight, reps_completed, result_seconds").eq("progress_log_id", progressLogId).eq("completed", true);
  const done = sets ?? [];
  const volume = Math.round(done.reduce((s, x) => s + (x.weight != null && x.reps_completed != null ? Number(x.weight) * x.reps_completed : 0), 0));
  const times = done.map((x) => (x.result_seconds != null ? Number(x.result_seconds) : null)).filter((x): x is number => x != null);
  const minutes = Math.max(1, Math.round((new Date(log.completed_at).getTime() - new Date(log.created_at).getTime()) / 60000));
  const session = (log.setting as Session | null) ?? null;

  // Is there another session left today (program day or module workout)?
  let next: { setting: Session; start: () => Promise<void> } | null = null;
  // A program day is a single session in one track. Only a module workout can have another session left to run.
  if (log.plan_workout_id && log.workout_id && log.user_plan_id) {
    const [{ data: rows }, { data: dayLogs }] = await Promise.all([
      supabase.from("workout_exercises").select("order_index, exercise:exercises(setting)").eq("workout_id", log.workout_id).order("order_index"),
      supabase.from("progress_logs").select("setting, completed_at").eq("user_id", user.id).eq("plan_workout_id", log.plan_workout_id),
    ]);
    const items = (rows ?? []).map((r) => ({ setting: ((r.exercise as unknown as { setting: TrainingSetting } | null)?.setting ?? "either") as TrainingSetting }));
    const sessions = groupSessions(assignModuleSessions(items).map((i) => ({ setting: i.session }))).map((g) => g.setting);
    const doneSet = sessionsDoneFor((dayLogs ?? []) as { setting: Session | null; completed_at: string | null }[], sessions);
    const left = sessions.find((s) => !doneSet.has(s));
    if (left) {
      next = {
        setting: left,
        start: startWorkoutAction.bind(null, { userPlanId: log.user_plan_id, planWorkoutId: log.plan_workout_id, workoutId: log.workout_id, weekNumber: log.week_number ?? 1, dayNumber: log.day_number ?? 1, setting: left }),
      };
    }
  }

  const title = (log.day as unknown as { title: string | null } | null)?.title ?? (log.workout as unknown as { name: string } | null)?.name ?? "Session";
  const stats: [string, string][] = [
    [String(done.length), done.length === 1 ? "set" : "sets"],
    session === "field" && times.length ? [String(Math.min(...times)), "best sec"] : session === "weight_room" && volume > 0 ? [volume.toLocaleString(), "volume"] : [String(minutes), "min"],
    [String(minutes), "min"],
  ];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-page py-6">
      <div className="flex flex-col gap-2">
        <p className="text-label flex items-center gap-2 text-primary">
          {session ? <SessionIcon session={session} size={18} /> : <CheckCircle2 size={18} />} {session ? `${SESSION_LABEL[session]} done` : "Session done"}
        </p>
        <h1 className="text-display">{title}</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map(([n, u], i) => (
          <div key={i} className={i === 0 ? "bg-primary p-3 text-primary-foreground" : "surface-card p-3"}>
            <div className="text-stat">{n}</div>
            <div className={i === 0 ? "text-label-sm mt-1" : "text-label-sm mt-1 text-muted"}>{u}</div>
          </div>
        ))}
      </div>

      {next && (
        <form action={next.start} className="surface-card flex flex-col gap-3 p-card">
          <div className="flex items-center gap-3">
            <SessionIcon session={next.setting} size={26} className="text-primary" />
            <div>
              <p className="text-heading">Next: {SESSION_SHORT[next.setting]}</p>
              <p className="text-caption text-muted">Today has another session. Start it now or come back to it later.</p>
            </div>
          </div>
          <Button type="submit" size="lg">
            Start {SESSION_SHORT[next.setting].toLowerCase()}
          </Button>
        </form>
      )}

      <section className="flex flex-col gap-3 surface-card p-card">
        <h2 className="text-heading">How did that feel?</h2>
        <SessionFeedback progressLogId={log.id} initial={log.feedback} />
      </section>

      <Button asChild size="lg" variant={next ? "outline" : "primary"}>
        <Link href={log.program_day_id ? "/today" : "/dashboard"}>{next ? "Not now" : "Done"}</Link>
      </Button>
    </div>
  );
}
