import { ArchetypesManager } from "./archetypes-manager";
import { requireAdminProfile } from "@/lib/auth/require-profile";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Position Archetypes" };

export default async function AdminArchetypesPage() {
  const { supabase } = await requireAdminProfile();

  const [{ data: archetypes }, { data: weights }, { data: positions }] = await Promise.all([
    supabase.from("position_archetypes").select("*").order("name"),
    supabase.from("archetype_category_weights").select("*"),
    supabase.from("positions").select("archetype_id"),
  ]);

  const weightsByArchetype: Record<string, Tables<"archetype_category_weights">[]> = {};
  for (const w of weights ?? []) {
    (weightsByArchetype[w.archetype_id] ??= []).push(w);
  }

  const positionCounts: Record<string, number> = {};
  for (const p of positions ?? []) {
    if (p.archetype_id) positionCounts[p.archetype_id] = (positionCounts[p.archetype_id] ?? 0) + 1;
  }

  return (
    <ArchetypesManager
      archetypes={archetypes ?? []}
      weightsByArchetype={weightsByArchetype}
      positionCounts={positionCounts}
    />
  );
}
