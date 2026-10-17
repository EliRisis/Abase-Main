import { createWorkoutAction } from "../actions";
import { WorkoutForm } from "../workout-form";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "New Workout" };

export default async function NewWorkoutPage() {
  const { supabase } = await requireAdminProfile();
  const [{ data: sports }, { data: positions }] = await Promise.all([
    supabase.from("sports").select("*").order("name"),
    supabase.from("positions").select("*").order("name"),
  ]);

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-title">New workout</h1>
      <p className="-mt-2 text-body text-muted">
        You&apos;ll add exercises on the next step, after saving the details.
      </p>
      <WorkoutForm
        sports={sports ?? []}
        positions={positions ?? []}
        action={createWorkoutAction}
        submitLabel="Create & add exercises"
      />
    </div>
  );
}
