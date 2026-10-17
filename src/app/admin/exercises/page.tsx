import { ExercisesManager } from "./exercises-manager";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "Manage Exercises" };

export default async function AdminExercisesPage() {
  const { supabase } = await requireAdminProfile();
  const [{ data: exercises }, { data: positions }, { data: scope }, { data: rx }] = await Promise.all([
    supabase.from("exercises").select("*").order("name"),
    supabase.from("positions").select("id, name, sport:sports(name)").order("name"),
    supabase.from("exercise_positions").select("exercise_id, position_id"),
    supabase.from("exercise_role_prescriptions").select("*"),
  ]);

  return (
    <ExercisesManager
      exercises={exercises ?? []}
      positions={(positions ?? []).map((p) => ({ id: p.id, name: p.name, sport: (p.sport as unknown as { name: string } | null)?.name ?? "" }))}
      scope={scope ?? []}
      rolePrescriptions={rx ?? []}
    />
  );
}
