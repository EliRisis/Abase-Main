import { PlansBrowser, type PlanWithRelations } from "@/components/plans/plans-browser";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Plan Library" };

export default async function PlansPage() {
  const supabase = await createClient();

  const [{ data: plans }, { data: sports }, { data: positions }] = await Promise.all([
    supabase
      .from("plans")
      .select("*, sport:sports(id,name,slug,icon), position:positions(id,name,slug,sport_id)")
      .eq("published", true)
      .order("name"),
    supabase.from("sports").select("*").order("name"),
    supabase.from("positions").select("*").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-page">
      <div>
        <h1 className="text-title">Plan Library</h1>
        <p className="mt-1 text-body text-muted">
          Multi-week programs built for your sport and position.
        </p>
      </div>
      <PlansBrowser
        plans={(plans ?? []) as PlanWithRelations[]}
        sports={sports ?? []}
        positions={positions ?? []}
      />
    </div>
  );
}
