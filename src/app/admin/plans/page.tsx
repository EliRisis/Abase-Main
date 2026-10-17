import { Plus } from "@/components/icons";
import Link from "next/link";
import { PlansList } from "./plans-list";
import { Button } from "@/components/ui/button";
import { requireAdminProfile } from "@/lib/auth/require-profile";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Manage Plans" };

type PlanRow = Tables<"plans"> & {
  sport: Pick<Tables<"sports">, "name" | "slug"> | null;
  position: Pick<Tables<"positions">, "name"> | null;
};

export default async function AdminPlansPage() {
  const { supabase } = await requireAdminProfile();
  const { data: plans } = (await supabase
    .from("plans")
    .select("*, sport:sports(name,slug), position:positions(name)")
    .order("name")) as unknown as { data: PlanRow[] | null };

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Plans</h1>
        <Button asChild>
          <Link href="/admin/plans/new">
            <Plus size={16} /> Add plan
          </Link>
        </Button>
      </div>
      <PlansList plans={plans ?? []} />
    </div>
  );
}
