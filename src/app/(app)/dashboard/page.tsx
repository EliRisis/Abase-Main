import { PositionIcon } from "@/components/icons/app-icon";
import { CheckCircle2, Flame, RecoveryIcon, Trophy, WeightRoomIcon } from "@/components/icons";
import Link from "next/link";
import { redirect } from "next/navigation";
import { startWorkoutAction } from "./actions";
import { SessionCard } from "@/components/session/session-card";
import type { ExerciseLine } from "@/components/session/session-exercises";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { effectiveWeekNumber, isPlanFinished, isoWeekday, WEEKDAY_SHORT } from "@/lib/plan-schedule";
import { assignModuleSessions, equipmentFor, groupSessions, SESSION_SHORT, sessionsDoneFor, type Session } from "@/lib/program/sessions";
import { computeStreak } from "@/lib/progress-stats";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";
import { cn } from "@/lib/utils";
import type { Tables, TrainingSetting } from "@/lib/database.types";
import { SessionIcon } from "@/components/session/session-ui";

export const metadata = { title: "Today" };

type UserPlanWithPlan = Tables<"user_plans"> & {
  plan: (Pick<Tables<"plans">, "id" | "name" | "slug" | "weeks" | "days_per_week"> & { sport: Pick<Tables<"sports">, "name"> | null }) | null;
};

type PlanWorkoutWithWorkout = Tables<"plan_workouts"> & {
  workout: Pick<Tables<"workouts">, "id" | "name" | "description" | "estimated_minutes"> | null;
};

type WorkoutExerciseWithExercise = Tables<"workout_exercises"> & {
  exercise: Pick<Tables<"exercises">, "name" | "setting" | "equipment" | "movement_pattern"> | null;
};

type WeekLog = { plan_workout_id: string | null; setting: Session | null; completed_at: string | null };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const { supabase, user, profile } = await requireOnboardedProfile();

  // The assembled weekly program is the default, better path once an athlete
  // has built one. Legacy single-module enrollment (below) still works for
  // anyone who hasn't, or who prefers to browse modules on their own.
  const { data: activeProgram } = await supabase.from("user_programs").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  // Standalone modules stay usable next to the program (`?view=module`): they are logged
  // as extra sessions and count toward readiness and history like everything else.
  if (activeProgram && view !== "module") redirect("/today");

  const { data: userPlan } = (await supabase
    .from("user_plans")
    .select("*, plan:plans(id,name,slug,weeks,days_per_week,sport:sports(name))")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()) as unknown as { data: UserPlanWithPlan | null };

  const { data: streakLogs } = await supabase.from("progress_logs").select("completed_at").eq("user_id", user.id).not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(200);
  const streak = computeStreak((streakLogs ?? []).map((l) => l.completed_at!));

  if (!userPlan) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <WeightRoomIcon size={56} className="text-primary" />
        <h1 className="text-display">{profile.display_name ? `Let's go, ${profile.display_name.split(" ")[0]}` : "Let's go"}</h1>
        <p className="max-w-sm text-body text-muted">Build a training week for your position, split into weight-room and field sessions, or pick a single module from the library.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/program">Build my training week</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/plans">Browse modules</Link>
          </Button>
        </div>
      </div>
    );
  }

  const finished = isPlanFinished(userPlan.started_at, userPlan.plan!.weeks);

  if (finished) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <Trophy size={48} className="text-primary" />
        <h1 className="text-display">Plan complete</h1>
        <p className="max-w-sm text-body text-muted">
          You finished all {userPlan.plan!.weeks} weeks of <strong>{userPlan.plan!.name}</strong>. Time to pick your next one.
        </p>
        <Button asChild size="lg">
          <Link href="/plans">Browse plans</Link>
        </Button>
      </div>
    );
  }

  const { data: myPosition } = profile.position_id ? await supabase.from("positions").select("name, slug").eq("id", profile.position_id).maybeSingle() : { data: null };
  const weekNumber = effectiveWeekNumber(userPlan.started_at, userPlan.plan!.weeks);
  const todayDayNumber = isoWeekday(new Date());

  const { data: weekWorkouts } = (await supabase
    .from("plan_workouts")
    .select("*, workout:workouts(id,name,description,estimated_minutes)")
    .eq("plan_id", userPlan.plan_id)
    .eq("week_number", weekNumber)
    .order("day_number")) as unknown as { data: PlanWorkoutWithWorkout[] | null };

  const planWorkoutIds = (weekWorkouts ?? []).map((w) => w.id);
  const { data: weekLogs } = planWorkoutIds.length
    ? ((await supabase.from("progress_logs").select("plan_workout_id, setting, completed_at").eq("user_plan_id", userPlan.id).in("plan_workout_id", planWorkoutIds)) as unknown as { data: WeekLog[] | null })
    : { data: [] as WeekLog[] };

  const today = (weekWorkouts ?? []).find((w) => w.day_number === todayDayNumber);

  const { data: todayExercises } = today?.workout
    ? ((await supabase
        .from("workout_exercises")
        .select("*, exercise:exercises(name, setting, equipment, movement_pattern)")
        .eq("workout_id", today.workout.id)
        .order("order_index")) as unknown as { data: WorkoutExerciseWithExercise[] | null })
    : { data: [] as WorkoutExerciseWithExercise[] };

  // Split the flat module workout into its weight-room / field / recovery sessions.
  const assigned = assignModuleSessions((todayExercises ?? []).map((we) => ({ we, setting: (we.exercise?.setting ?? "either") as TrainingSetting })));
  const todaySessions = groupSessions(assigned.map((a) => ({ ...a, setting: a.session })));
  const logsFor = (planWorkoutId: string) => (weekLogs ?? []).filter((l) => l.plan_workout_id === planWorkoutId);
  const sessionsOfEntry = (w: PlanWorkoutWithWorkout) => (w.id === today?.id ? todaySessions.map((s) => s.setting) : []);
  const isDayDone = (w: PlanWorkoutWithWorkout) => {
    if (w.id === today?.id) {
      const s = todaySessions.map((x) => x.setting);
      return s.length > 0 && sessionsDoneFor(logsFor(w.id), s).size === s.length;
    }
    return logsFor(w.id).some((l) => l.completed_at);
  };
  const todayLogs = today ? logsFor(today.id) : [];
  const todayDoneSet = sessionsDoneFor(todayLogs, todaySessions.map((s) => s.setting));
  const todayAllDone = todaySessions.length > 0 && todayDoneSet.size === todaySessions.length;
  const startInput = today?.workout ? { userPlanId: userPlan.id, planWorkoutId: today.id, workoutId: today.workout.id, weekNumber, dayNumber: todayDayNumber } : null;

  const line = (a: (typeof assigned)[number]): ExerciseLine => ({
    id: a.we.id,
    name: a.we.exercise?.name ?? "Exercise",
    block: "main",
    sets: a.we.sets,
    reps: a.we.reps,
    restSeconds: a.we.rest_seconds,
    targetWeight: null,
    unit: "lb",
    note: a.we.notes,
    pattern: a.we.exercise?.movement_pattern ?? null,
  });

  return (
    <div className="flex flex-col gap-page">
      {activeProgram && (
        <div className="flex items-center justify-between gap-3 border-l-[4px] border-l-primary bg-surface px-4 py-3 text-caption">
          <span>
            <strong>Extra session.</strong> This module is on top of your program. It still counts toward your history and readiness.
          </span>
          <Link href="/program" className="text-label shrink-0 text-primary">
            Back to program
          </Link>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-label text-primary">
            {userPlan.plan?.name} · Week {weekNumber} of {userPlan.plan?.weeks}
          </p>
          <h1 className="text-display mt-2">{today?.workout ? (today.title ?? today.workout.name) : "Rest day"}</h1>
          {myPosition && (
            <p className="mt-3 flex items-center gap-2 text-body text-muted">
              <PositionIcon slug={myPosition.slug} name={myPosition.name} size={32} className="rounded-control" /> {myPosition.name}
            </p>
          )}
        </div>
        {streak > 0 && (
          <Badge variant="primary" className="shrink-0">
            <Flame size={13} /> {streak} day{streak === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      <div className="flex gap-1.5">
        {WEEKDAY_SHORT.map((label, i) => {
          const dayNumber = i + 1;
          const entry = (weekWorkouts ?? []).find((w) => w.day_number === dayNumber);
          const isToday = dayNumber === todayDayNumber;
          const isDone = entry ? isDayDone(entry) : false;
          const sess = entry ? sessionsOfEntry(entry) : [];
          return (
            <div key={dayNumber} className={cn("relative flex flex-1 flex-col items-center gap-1 rounded-control border px-1 pb-2.5 pt-3.5", isToday ? "border-foreground bg-surface-raised" : "border-border bg-surface")}>
              {isToday && <span className="absolute inset-x-0 top-0 h-[3px] bg-primary" />}
              <span className="text-label text-foreground">{label}</span>
              {isDone ? (
                <CheckCircle2 size={18} className="text-primary" />
              ) : sess.length > 0 ? (
                <span className="flex gap-0.5">
                  {sess.map((s) => (
                    <SessionIcon key={s} session={s} size={14} />
                  ))}
                </span>
              ) : entry?.workout ? (
                <span className="h-2 w-2 bg-primary" />
              ) : (
                <span className="h-1.5 w-1.5 bg-border" />
              )}
            </div>
          );
        })}
      </div>

      {!today?.workout ? (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border p-10 text-center">
          <RecoveryIcon size={40} className="text-muted" />
          <p className="text-heading mt-1">Nothing scheduled today</p>
          <p className="text-body text-muted">Recover, eat well, and come back tomorrow.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-section">
          {today.workout.description && <p className="text-body text-muted">{today.workout.description}</p>}
          {todaySessions.length > 1 && (
            <p className="text-caption text-muted">
              Two separate sessions today: {todaySessions.map((s) => SESSION_SHORT[s.setting]).join(" and ")}. Do them in any order.
            </p>
          )}
          {todaySessions.map((s, i) => (
            <SessionCard
              key={s.setting}
              session={s.setting}
              lines={s.rows.map(line)}
              minutes={todaySessions.length === 1 ? today.workout!.estimated_minutes : null}
              equipment={equipmentFor(s.rows.map((r) => ({ equipment: r.we.exercise?.equipment ?? null })))}
              positionSlug={myPosition?.slug}
              position={todaySessions.length > 1 ? `${i + 1} of ${todaySessions.length}` : undefined}
              status={todayDoneSet.has(s.setting) ? "done" : todayLogs.some((l) => l.setting === s.setting || l.setting === null) ? "started" : "todo"}
              action={startInput ? startWorkoutAction.bind(null, { ...startInput, setting: s.setting }) : undefined}
              startLabel={`Start ${SESSION_SHORT[s.setting].toLowerCase()}`}
            />
          ))}
          {todayAllDone && startInput && (
            <form action={startWorkoutAction.bind(null, startInput)}>
              <Button type="submit" variant="outline" className="w-full">
                Do it again
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
