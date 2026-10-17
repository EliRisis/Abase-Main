import { Plus } from "@/components/icons";
import Link from "next/link";
import { WorkoutsList } from "./workouts-list";
import { Button } from "@/components/ui/button";
import { requireAdminProfile } from "@/lib/auth/require-profile";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Manage Workouts" };

type WorkoutRow = Tables<"workouts"> & {
  sport: Pick<Tables<"sports">, "name" | "slug"> | null;
  position: Pick<Tables<"positions">, "name"> | null;
};

export default async function AdminWorkoutsPage() {
  const { supabase } = await requireAdminProfile();
  const { data: workouts } = (await supabase
    .from("workouts")
    .select("*, sport:sports(name,slug), position:positions(name)")
    .order("name")) as unknown as { data: WorkoutRow[] | null };

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Workouts</h1>
        <Button asChild>
          <Link href="/admin/workouts/new">
            <Plus size={16} /> Add workout
          </Link>
        </Button>
      </div>
      <WorkoutsList workouts={workouts ?? []} />
    </div>
  );
}
