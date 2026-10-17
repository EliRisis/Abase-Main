import { CalendarCheck, Flame, ListChecks, LineChart } from "@/components/icons";
import Link from "next/link";
import { SessionIcon } from "@/components/session/session-ui";
import { SESSION_SHORT, type Session } from "@/lib/program/sessions";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";
import { daysAgoLabel, computeStreak } from "@/lib/progress-stats";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Progress" };

interface CompletedLog {
  id: string;
  completed_at: string | null;
  week_number: number | null;
  day_number: number | null;
  setting: Session | null;
  day: { title: string | null } | null;
  workout: Pick<Tables<"workouts">, "name"> | null;
  plan: Pick<Tables<"plans">, "name"> | null;
  user_plan: { plan: Pick<Tables<"plans">, "name"> | null } | null;
}

export default async function ProgressPage() {
  const { supabase, user } = await requireOnboardedProfile();

  const { data: completedLogs } = (await supabase
    .from("progress_logs")
    .select(
      "id, completed_at, week_number, day_number, setting, day:user_program_days(title), workout:workouts(name), plan:plans(name), user_plan:user_plans(plan:plans(name))",
    )
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(100)) as unknown as { data: CompletedLog[] | null };

  const streak = computeStreak((completedLogs ?? []).map((l) => l.completed_at!));

  const now = new Date();
  const startOfWeek = new Date(now);
  const dayIdx = (startOfWeek.getDay() + 6) % 7; // Mon=0
  startOfWeek.setDate(startOfWeek.getDate() - dayIdx);
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeekCount = (completedLogs ?? []).filter(
    (l) => new Date(l.completed_at!) >= startOfWeek,
  ).length;

  return (
    <div className="flex flex-col gap-page">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-display">Progress</h1>
          <p className="mt-2 text-body text-muted">Every session you finished, weight room and field.</p>
        </div>
        <Link
          href="/metrics"
          className="text-label inline-flex shrink-0 items-center gap-1.5 rounded-control border-2 border-foreground/70 px-3.5 py-2.5 text-foreground transition hover:bg-foreground hover:text-background"
        >
          <LineChart size={14} /> Metrics
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Flame} label="Streak" value={`${streak}`} sub="days" />
        <StatCard icon={CalendarCheck} label="This week" value={`${thisWeekCount}`} sub="workouts" />
        <StatCard icon={ListChecks} label="All time" value={`${completedLogs?.length ?? 0}`} sub="workouts" />
      </div>

      <div>
        <h2 className="text-label mb-3 text-muted">History</h2>
        {!completedLogs || completedLogs.length === 0 ? (
          <div className="rounded-card border border-dashed border-border p-10 text-center text-body text-muted">
            No completed workouts yet — finish one from today&apos;s dashboard
            and it&apos;ll show up here.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border surface-card">
            {completedLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {log.setting && <SessionIcon session={log.setting} size={22} className="shrink-0 text-primary" />}
                  <div>
                    <p className="text-heading">{log.day?.title ?? log.workout?.name ?? "Workout"}</p>
                    <p className="mt-1 text-caption text-muted">
                      {log.setting ? `${SESSION_SHORT[log.setting]} · ` : ""}
                      {log.plan?.name ?? log.user_plan?.plan?.name}
                      {log.week_number ? ` · Week ${log.week_number}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-caption text-muted">{daysAgoLabel(log.completed_at!)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 surface-card p-card-sm text-center">
      <Icon size={18} className="text-primary" />
      <span className="text-stat">{value}</span>
      <span className="text-label-sm text-muted">{sub}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
