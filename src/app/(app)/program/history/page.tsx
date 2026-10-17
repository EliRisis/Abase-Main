import { PositionIcon } from "@/components/icons/app-icon";
import { ArrowLeft, ChevronRight } from "@/components/icons";
import Link from "next/link";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";
import { PHASE_LABEL } from "@/lib/training";

export const metadata = { title: "Program history" };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Every training block that was replaced by a new one. Archived, never deleted. */
export default async function ProgramHistoryPage() {
  const { supabase, user } = await requireOnboardedProfile();

  const [{ data: programs }, { data: positions }] = await Promise.all([
    supabase.from("user_programs").select("id, phase, weeks, started_on, archived_at, created_at, position_id, secondary_position_id, level, days_per_week").eq("user_id", user.id).eq("status", "archived").order("created_at", { ascending: false }),
    supabase.from("positions").select("id, name, slug"),
  ]);
  const posName = new Map((positions ?? []).map((p) => [p.id, p.name]));
  const posSlug = new Map((positions ?? []).map((p) => [p.id, p.slug]));
  const ids = (programs ?? []).map((p) => p.id);

  const { data: days } = ids.length ? await supabase.from("user_program_days").select("id, program_id").in("program_id", ids) : { data: [] as { id: string; program_id: string }[] };
  const dayProgram = new Map((days ?? []).map((d) => [d.id, d.program_id]));
  const { data: logs } = dayProgram.size
    ? await supabase.from("progress_logs").select("program_day_id, completed_at").eq("user_id", user.id).not("completed_at", "is", null).in("program_day_id", [...dayProgram.keys()])
    : { data: [] as { program_day_id: string | null; completed_at: string | null }[] };
  const sessionsDone = new Map<string, number>();
  for (const l of logs ?? []) {
    const pid = l.program_day_id ? dayProgram.get(l.program_day_id) : null;
    if (pid) sessionsDone.set(pid, (sessionsDone.get(pid) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-page">
      <div>
        <Link href="/program" className="text-label inline-flex items-center gap-1.5 text-muted hover:text-foreground">
          <ArrowLeft size={14} /> Your program
        </Link>
        <h1 className="text-display mt-3">History</h1>
        <p className="mt-2 text-body text-muted">Training blocks you have moved on from. They are archived, not deleted, with every session you logged.</p>
      </div>

      {(programs ?? []).length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-10 text-center">
          <p className="text-heading">No archived blocks yet</p>
          <p className="mt-1 text-body text-muted">When you start a new training block, the one it replaces shows up here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {(programs ?? []).map((p) => (
            <li key={p.id}>
              <Link href={`/program/history/${p.id}`} className="surface-card flex items-center justify-between gap-3 p-card-sm transition hover:border-foreground/50">
                <PositionIcon slug={p.position_id ? posSlug.get(p.position_id) : null} name={p.position_id ? posName.get(p.position_id) : ""} size={40} className="rounded-card" />
                <div className="min-w-0 flex-1">
                  <p className="text-heading">
                    {p.position_id ? posName.get(p.position_id) : "Program"}
                    {p.secondary_position_id ? ` + ${posName.get(p.secondary_position_id)}` : ""} · {PHASE_LABEL[p.phase]}
                  </p>
                  <p className="mt-1 text-caption text-muted">
                    {fmt(p.started_on)} to {fmt(p.archived_at ?? p.created_at)} · {p.weeks} weeks planned{p.days_per_week ? ` · ${p.days_per_week} days` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <div className="text-stat">{sessionsDone.get(p.id) ?? 0}</div>
                    <div className="text-label-sm text-muted">sessions</div>
                  </div>
                  <ChevronRight size={18} className="text-muted" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
