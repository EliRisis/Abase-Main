import { ArrowLeft } from "@/components/icons";
import Link from "next/link";
import { CalendarPanel, LimitationsPanel, TargetDatePanel } from "@/components/program/coach-panels";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";
import { loadAthlete } from "@/lib/program/data";
import { addDays } from "@/lib/program/periodization";

export const metadata = { title: "Coach settings" };

export default async function CoachPage() {
  const { supabase, user } = await requireOnboardedProfile();
  const athlete = await loadAthlete(supabase, user.id);
  if (!athlete) return null;
  const upcoming = athlete.events.filter((e) => e.date >= addDays(athlete.today, -1));
  const { data: profile } = await supabase.from("profiles").select("target_date, target_event").eq("id", user.id).single();
  const target = profile?.target_date ? { date: profile.target_date, event: profile.target_event } : null;

  return (
    <div className="flex flex-col gap-page">
      <div>
        <Link href="/program" className="mb-2 inline-flex items-center gap-1 text-caption font-medium text-muted hover:text-foreground">
          <ArrowLeft size={13} /> Back to program
        </Link>
        <h1 className="text-title">Coach settings</h1>
        <p className="mt-1 text-body text-muted">
          Tell your program what&apos;s coming up. Changes re-plan your remaining sessions; anything you&apos;ve already done stays as logged.
        </p>
      </div>
      <TargetDatePanel target={target} />
      <CalendarPanel events={upcoming} />
      <LimitationsPanel items={athlete.limitations} />
    </div>
  );
}
