import { PositionIcon } from "@/components/icons/app-icon";
import { ArrowLeft, CheckCircle2 } from "@/components/icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionExercises, type ExerciseLine } from "@/components/session/session-exercises";
import { SessionIcon } from "@/components/session/session-ui";
import { Badge } from "@/components/ui/badge";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";
import { addDays } from "@/lib/program/periodization";
import { groupSessions, SESSION_SHORT, sessionsDoneFor, type Session } from "@/lib/program/sessions";
import { INTENSITY_LABEL, INTENSITY_VARIANT, PHASE_LABEL, WEEKDAY_NAMES } from "@/lib/training";
import type { MovementPattern, Tables } from "@/lib/database.types";

export const metadata = { title: "Archived block" };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
type DayRow = Tables<"user_program_days"> & { user_program_day_exercises: (Tables<"user_program_day_exercises"> & { exercise: { movement_pattern: MovementPattern | null } | null })[] };

/** Read-only view of one archived block: what was planned and what was done, session by session. */
export default async function ArchivedProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireOnboardedProfile();

  const { data: program } = await supabase.from("user_programs").select("*").eq("id", id).eq("user_id", user.id).eq("status", "archived").maybeSingle();
  if (!program) notFound();

  const [{ data: raw }, { data: positions }] = await Promise.all([
    supabase.from("user_program_days").select("*, user_program_day_exercises(*, exercise:exercises(movement_pattern))").eq("program_id", program.id).order("week_number").order("day_number"),
    supabase.from("positions").select("id, name, slug").in("id", [program.position_id, program.secondary_position_id].filter((x): x is string => !!x)),
  ]);
  const days = ((raw ?? []) as unknown as DayRow[]).map((d) => ({ ...d, rows: [...d.user_program_day_exercises].sort((a, b) => a.order_index - b.order_index) }));
  const { data: logs } = days.length ? await supabase.from("progress_logs").select("program_day_id, setting, completed_at").eq("user_id", user.id).in("program_day_id", days.map((d) => d.id)) : { data: [] as { program_day_id: string | null; setting: Session | null; completed_at: string | null }[] };
  const posName = new Map((positions ?? []).map((p) => [p.id, p.name]));
  const posSlug = new Map((positions ?? []).map((p) => [p.id, p.slug]));

  const line = (r: DayRow["user_program_day_exercises"][number]): ExerciseLine => ({
    id: r.id,
    name: r.exercise_name,
    block: r.block,
    sets: r.sets,
    reps: r.reps,
    restSeconds: r.rest_seconds,
    targetWeight: r.target_weight != null ? Number(r.target_weight) : null,
    unit: r.weight_unit,
    note: r.rx_note,
    pattern: r.exercise?.movement_pattern ?? null,
  });

  const weeks = [...new Set(days.map((d) => d.week_number))];
  let done = 0;
  let planned = 0;

  return (
    <div className="flex flex-col gap-page">
      <div>
        <Link href="/program/history" className="text-label inline-flex items-center gap-1.5 text-muted hover:text-foreground">
          <ArrowLeft size={14} /> History
        </Link>
        <p className="text-label mt-3 text-primary">Archived · {fmt(program.archived_at ?? program.created_at)}</p>
        <div className="mt-2 flex items-center gap-3">
          <PositionIcon slug={program.position_id ? posSlug.get(program.position_id) : null} name={program.position_id ? posName.get(program.position_id) : ""} size={48} className="rounded-card" />
          {program.secondary_position_id && <PositionIcon slug={posSlug.get(program.secondary_position_id)} name={posName.get(program.secondary_position_id) ?? ""} size={30} className="rounded-control" />}
        </div>
        <h1 className="text-display mt-2">
          {program.position_id ? posName.get(program.position_id) : "Program"}
          {program.secondary_position_id ? ` + ${posName.get(program.secondary_position_id)}` : ""}
        </h1>
        <p className="mt-2 text-body text-muted">
          {PHASE_LABEL[program.phase]} · {program.weeks} weeks · started {fmt(program.started_on)}
        </p>
      </div>

      {weeks.map((w) => (
        <section key={w} className="flex flex-col gap-2">
          <h2 className="text-label text-muted">Week {w}</h2>
          {days
            .filter((d) => d.week_number === w)
            .map((d) => {
              const sess = groupSessions(d.rows);
              const dl = (logs ?? []).filter((l) => l.program_day_id === d.id) as { setting: Session | null; completed_at: string | null }[];
              const doneSet = sessionsDoneFor(dl, sess.map((s) => s.setting));
              done += doneSet.size;
              planned += sess.length;
              return (
                <details key={d.id} className="surface-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5">
                    <span className="flex flex-col">
                      <span className="text-heading">
                        {WEEKDAY_NAMES[d.day_number - 1]} · {d.title}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-caption text-muted">
                        <Badge variant={INTENSITY_VARIANT[d.intensity]}>{INTENSITY_LABEL[d.intensity]}</Badge>
                        {doneSet.size === sess.length && sess.length > 0 ? "Done" : doneSet.size > 0 ? `${doneSet.size} of ${sess.length} done` : "Not done"}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {sess.map((s) => (
                        <span key={s.setting} className={doneSet.has(s.setting) ? "text-primary" : "text-muted"} title={SESSION_SHORT[s.setting]}>
                          {doneSet.has(s.setting) ? <CheckCircle2 size={18} /> : <SessionIcon session={s.setting} size={18} />}
                        </span>
                      ))}
                    </span>
                  </summary>
                  <div className="flex flex-col gap-4 border-t border-border p-3.5">
                    {sess.map((s) => (
                      <div key={s.setting} className="flex flex-col gap-2">
                        <p className="text-label flex items-center gap-2">
                          <SessionIcon session={s.setting} size={16} className="text-primary" /> {SESSION_SHORT[s.setting]}
                          {doneSet.has(s.setting) ? <span className="text-primary">· done</span> : null}
                        </p>
                        <SessionExercises session={s.setting} lines={s.rows.map(line)} />
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
        </section>
      ))}
      <p className="text-caption text-muted">
        {done} of {planned} sessions completed in this block. Ended {fmt(addDays(program.started_on, program.weeks * 7 - 1))} as planned, or {fmt(program.archived_at ?? program.created_at)} when replaced.
      </p>
    </div>
  );
}
