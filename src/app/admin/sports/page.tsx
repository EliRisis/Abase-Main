import { SportsManager } from "./sports-manager";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "Manage Sports" };

export default async function AdminSportsPage() {
  const { supabase } = await requireAdminProfile();
  const { data: sports } = await supabase.from("sports").select("*").order("name");

  return <SportsManager sports={sports ?? []} />;
}
