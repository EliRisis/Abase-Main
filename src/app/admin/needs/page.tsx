import { NeedsManager } from "./needs-manager";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "Position needs" };

export default async function AdminNeedsPage() {
  const { supabase } = await requireAdminProfile();
  const [{ data: positions }, { data: needs }, { data: notes }, { data: mods }] = await Promise.all([
    supabase.from("positions").select("id, name, sport:sports(name)").order("name"),
    supabase.from("position_needs_profiles").select("*"),
    supabase.from("position_attribute_notes").select("position_id, attribute, note"),
    supabase.from("phase_attribute_modifiers").select("*"),
  ]);
  return (
    <NeedsManager
      positions={(positions ?? []).map((p) => ({ id: p.id, name: p.name, sport: (p.sport as unknown as { name: string } | null)?.name ?? "" }))}
      needs={needs ?? []}
      notes={notes ?? []}
      modifiers={mods ?? []}
    />
  );
}
