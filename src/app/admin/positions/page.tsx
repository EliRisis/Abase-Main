import { PositionsManager } from "./positions-manager";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "Manage Positions" };

export default async function AdminPositionsPage() {
  const { supabase } = await requireAdminProfile();
  const [{ data: positions }, { data: sports }, { data: archetypes }] = await Promise.all([
    supabase.from("positions").select("*").order("name"),
    supabase.from("sports").select("*").order("name"),
    supabase.from("position_archetypes").select("*").order("name"),
  ]);

  return (
    <PositionsManager
      positions={positions ?? []}
      sports={sports ?? []}
      archetypes={archetypes ?? []}
    />
  );
}
