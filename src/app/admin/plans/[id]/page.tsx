import { notFound } from "next/navigation";
import { ScheduleEditor } from "./schedule-editor";
import { updatePlanAction } from "../actions";
import { PlanForm } from "../plan-form";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "Edit Plan" };

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdminProfile();

  const [{ data: plan }, { data: sports }, { data: positions }, { data: workouts }] =
    await Promise.all([
      supabase.from("plans").select("*").eq("id", id).single(),
      supabase.from("sports").select("*").order("name"),
      supabase.from("positions").select("*").order("name"),
      supabase.from("workouts").select("*").order("name"),
    ]);

  if (!plan) notFound();

  const { data: planWorkouts } = await supabase
    .from("plan_workouts")
    .select("*")
    .eq("plan_id", id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-title">{plan.name}</h1>
        <p className="mt-1 text-body text-muted">Edit details and build the weekly schedule.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="max-w-xl">
          <h2 className="mb-3 text-heading">Details</h2>
          <PlanForm
            plan={plan}
            sports={sports ?? []}
            positions={positions ?? []}
            action={updatePlanAction.bind(null, id)}
          />
        </div>

        <div>
          <h2 className="mb-3 text-heading">Weekly schedule</h2>
          {(workouts ?? []).length === 0 ? (
            <p className="text-body text-muted">
              Add a workout first before scheduling this plan.
            </p>
          ) : (
            <ScheduleEditor
              planId={id}
              weeks={plan.weeks}
              planWorkouts={planWorkouts ?? []}
              workouts={workouts ?? []}
            />
          )}
        </div>
      </div>
    </div>
  );
}
