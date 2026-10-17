import { PositionIcon, SportIcon } from "@/components/icons/app-icon";
import { Clock, Info } from "@/components/icons";
import { SessionIcon } from "@/components/session/session-ui";
import { assignModuleSessions, groupSessions, SESSION_SHORT, type Session } from "@/lib/program/sessions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { enrollInPlanAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnrollButton } from "@/components/plans/enroll-button";
import { AttributeBars } from "@/components/program/attribute-bars";
import { whyNoteFor } from "@/lib/program/why";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { WEEKDAY_LABELS } from "@/lib/plan-schedule";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TrainingSetting } from "@/lib/database.types";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

type PlanWithSportPosition = Tables<"plans"> & {
  sport: Pick<Tables<"sports">, "id" | "name" | "slug"> | null;
  position: Pick<Tables<"positions">, "id" | "name" | "slug"> | null;
};

type PlanWorkoutWithWorkout = Tables<"plan_workouts"> & {
  workout: Pick<Tables<"workouts">, "id" | "name" | "slug" | "level" | "estimated_minutes"> | null;
};

type UserPlanWithPlanName = Pick<Tables<"user_plans">, "plan_id" | "status"> & {
  plans: Pick<Tables<"plans">, "name"> | null;
};

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plan } = (await supabase
    .from("plans")
    .select("*, sport:sports(id,name,slug), position:positions(id,name,slug)")
    .eq("slug", slug)
    .single()) as unknown as { data: PlanWithSportPosition | null };

  if (!plan) notFound();

  const { data: planWorkouts } = (await supabase
    .from("plan_workouts")
    .select("*, workout:workouts(id,name,slug,level,estimated_minutes)")
    .eq("plan_id", plan.id)
    .order("week_number")
    .order("day_number")) as unknown as { data: PlanWorkoutWithWorkout[] | null };

  let activeEnrollment: { plan_id: string; plan_name: string } | null = null;
  let enrolledInThisPlan = false;

  if (user) {
    const { data: userPlans } = (await supabase
      .from("user_plans")
      .select("plan_id, status, plans(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()) as unknown as { data: UserPlanWithPlanName | null };

    if (userPlans) {
      activeEnrollment = {
        plan_id: userPlans.plan_id,
        plan_name: userPlans.plans?.name ?? "your current plan",
      };
      enrolledInThisPlan = userPlans.plan_id === plan.id;
    }
  }

  // "Why this matters for your position", derived from what the module actually trains.
  let positionId: string | null = plan.position_id;
  if (user) {
    const { data: prof } = await supabase.from("profiles").select("position_id").eq("id", user.id).maybeSingle();
    positionId = prof?.position_id ?? plan.position_id;
  }
  const { data: athletePosition } = positionId ? await supabase.from("positions").select("id, name, slug").eq("id", positionId).maybeSingle() : { data: null };
  const why = await whyNoteFor(supabase, {
    override: plan.why_note,
    workoutIds: [...new Set((planWorkouts ?? []).map((pw) => pw.workout?.id).filter((id): id is string => !!id))],
    positionId,
  });

  // Which sessions (weight room / field / recovery) each workout is made of
  const workoutIds = [...new Set((planWorkouts ?? []).map((pw) => pw.workout?.id).filter((id): id is string => !!id))];
  const { data: weRows } = workoutIds.length
    ? await supabase.from("workout_exercises").select("workout_id, order_index, exercise:exercises(setting)").in("workout_id", workoutIds).order("order_index")
    : { data: [] as { workout_id: string; order_index: number; exercise: { setting: TrainingSetting } | null }[] };
  const sessionsByWorkout = new Map<string, Session[]>();
  for (const id of workoutIds) {
    const items = (weRows ?? []).filter((r) => r.workout_id === id).map((r) => ({ setting: ((r.exercise as unknown as { setting: TrainingSetting } | null)?.setting ?? "either") as TrainingSetting }));
    sessionsByWorkout.set(id, groupSessions(assignModuleSessions(items).map((i) => ({ setting: i.session }))).map((g) => g.setting));
  }

  const weeks = Array.from({ length: plan.weeks }, (_, i) => i + 1);
  const byWeek = new Map<number, PlanWorkoutWithWorkout[]>();
  for (const pw of planWorkouts ?? []) {
    const list = byWeek.get(pw.week_number) ?? [];
    list.push(pw);
    byWeek.set(pw.week_number, list);
  }

  return (
    <div className="flex flex-col gap-page pb-10">
      <div className="lane-stripes flex h-40 items-end justify-between gap-3 rounded-card border border-border p-card">
        <span className="text-display text-foreground/90">{plan.sport?.name ?? "Training"}</span>
        <span className="flex items-center gap-2">
          {(plan.position || athletePosition) && (
            <PositionIcon
              slug={(plan.position ?? athletePosition)!.slug}
              sportSlug={plan.sport?.slug}
              name={(plan.position ?? athletePosition)!.name}
              size={64}
              className="rounded-card"
            />
          )}
          <SportIcon slug={plan.sport?.slug} name={plan.sport?.name} size={plan.position || athletePosition ? 40 : 64} className="rounded-card" />
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {plan.sport && <Badge variant="primary"><SportIcon slug={plan.sport.slug} name={plan.sport.name} size={18} decorative />{plan.sport.name}</Badge>}
          {plan.position && <Badge><PositionIcon slug={plan.position.slug} sportSlug={plan.sport?.slug} name={plan.position.name} size={18} decorative />{plan.position.name}</Badge>}
          {plan.level && <Badge variant="default">{LEVEL_LABEL[plan.level]}</Badge>}
        </div>
        <h1 className="text-display">{plan.name}</h1>
        {plan.description && <p className="text-muted">{plan.description}</p>}
        <p className="text-body text-muted">
          {plan.weeks} weeks · {plan.days_per_week} workouts / week
        </p>
      </div>

      {why && (
        <div className="flex flex-col gap-3 surface-card p-card-sm">
          <p className="flex items-start gap-2 text-body">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" />
            <span>
              <span className="font-semibold">Why this matters:</span> {why.text}
            </span>
          </p>
          {why.profile && (
            <div>
              <p className="text-label mb-2 text-muted">What this module trains</p>
              <AttributeBars values={why.profile} compact />
            </div>
          )}
        </div>
      )}

      {enrolledInThisPlan ? (
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/dashboard">Go to today&apos;s workout</Link>
        </Button>
      ) : (
        <EnrollButton
          planId={plan.id}
          planName={plan.name}
          activePlanName={activeEnrollment?.plan_name ?? null}
          enrollAction={enrollInPlanAction}
        />
      )}

      <div>
        <h2 className="mb-3 text-heading">Weekly schedule</h2>
        <Tabs defaultValue="1">
          <TabsList>
            {weeks.map((w) => (
              <TabsTrigger key={w} value={String(w)}>
                Week {w}
              </TabsTrigger>
            ))}
          </TabsList>
          {weeks.map((w) => (
            <TabsContent key={w} value={String(w)}>
              <div className="flex flex-col gap-2">
                {WEEKDAY_LABELS.map((label, i) => {
                  const dayNumber = i + 1;
                  const entry = byWeek
                    .get(w)
                    ?.find((pw) => pw.day_number === dayNumber);
                  return (
                    <div
                      key={dayNumber}
                      className="surface-card flex items-center justify-between p-4"
                    >
                      <div>
                        <p className="text-label text-muted">{label}</p>
                        <p className="text-heading mt-1">
                          {entry ? entry.title ?? entry.workout?.name : "Rest day"}
                        </p>
                      </div>
                      {entry?.workout && (
                        <div className="flex flex-col items-end gap-1.5 text-caption text-muted">
                          <span className="flex flex-wrap justify-end gap-1.5">
                            {(sessionsByWorkout.get(entry.workout.id) ?? []).map((st) => (
                              <span key={st} className="text-label-sm inline-flex items-center gap-1 border border-border px-1.5 py-1 text-foreground">
                                <SessionIcon session={st} size={12} /> {SESSION_SHORT[st]}
                              </span>
                            ))}
                          </span>
                          {entry.workout.estimated_minutes && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={13} />
                              {entry.workout.estimated_minutes}m
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
