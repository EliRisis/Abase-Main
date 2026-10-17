import { createPlanAction } from "../actions";
import { PlanForm } from "../plan-form";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "New Plan" };

export default async function NewPlanPage() {
  const { supabase } = await requireAdminProfile();
  const [{ data: sports }, { data: positions }] = await Promise.all([
    supabase.from("sports").select("*").order("name"),
    supabase.from("positions").select("*").order("name"),
  ]);

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-title">New plan</h1>
      <p className="-mt-2 text-body text-muted">
        You&apos;ll build the weekly schedule on the next step, after saving
        the details.
      </p>
      <PlanForm
        sports={sports ?? []}
        positions={positions ?? []}
        action={createPlanAction}
        submitLabel="Create & build schedule"
      />
    </div>
  );
}
