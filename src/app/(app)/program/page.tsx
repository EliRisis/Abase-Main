import { PositionIcon } from "@/components/icons/app-icon";
import { CalendarRange, Flag, HeartPulse, Info, Target, TrendingUp } from "@/components/icons";
import Link from "next/link";
import { AttributeBars } from "@/components/program/attribute-bars";
import { EditDaysButton } from "@/components/program/edit-days-button";
import { NewBlockForm } from "@/components/program/new-block";
import { ProgramControls } from "@/components/program/program-controls";
import { ShowMoreWeeks } from "@/components/session/show-more-weeks";
import { TrackTabs } from "@/components/session/track-tabs";
import { SessionExercises, type ExerciseLine } from "@/components/session/session-exercises";
import { SessionIcon } from "@/components/session/session-ui";
import { WeekStrip, type StripDay } from "@/components/session/week-strip";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";
import { loadAthlete } from "@/lib/program/data";
import { addDays, diffDays, programDayDate, programPosition } from "@/lib/program/periodization";
import { defaultTrainingDays, monthDayLabel, sessionTitle, sundayOf, WEEK_STRIP_WEEKS } from "@/lib/program/schedule";
import { type Session } from "@/lib/program/sessions";
import type { Track } from "@/lib/program/assembler";
import type { DayExerciseRow } from "@/lib/program/service";
import { ATTRIBUTES, ATTRIBUTE_LABEL, BODY_AREA_LABEL, INTENSITY_LABEL, PHASE_LABEL, SIDE_LABEL } from "@/lib/training";
import { cn } from "@/lib/utils";
import type { Json, Tables, TrainingAttribute } from "@/lib/database.types";

export const metadata = { title: "Your Program" };

type DayRow = Tables<"user_program_days"> & { user_program_day_exercises: DayExerciseRow[] };
interface Rationale {
  position?: string;
  effective?: Record<string, { value: number; base: number; phase: number; emphasis: number; periodization: number; plateau: number }>;
  weeks?: { week: number; mode: string; deload: boolean; note: string | null }[];
}

const asRationale = (j: Json): Rationale => (j && typeof j === "object" && !Array.isArray(j) ? (j as unknown as Rationale) : {});
const fmtShort = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

export default async function ProgramPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const { supabase, user, profile } = await requireOnboardedProfile();
  const athlete = await loadAthlete(supabase, user.id);
  const program = athlete?.activeProgram ?? null;
  const [{ data: sportPositions }, { count: archivedCount }] = await Promise.all([
    supabase.from("positions").select("id, name, slug").eq("sport_id", profile.sport_id ?? "").order("name"),
    supabase.from("user_programs").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "archived"),
  ]);
  const positions = sportPositions ?? [];
  const defaults = {
    positionId: program?.position_id ?? profile.position_id,
    secondaryPositionId: program ? program.secondary_position_id : profile.secondary_position_id,
    level: program?.level ?? profile.level,
    equipmentAccess: program?.equipment_access ?? profile.equipment_access,
    daysPerWeek: program?.days_per_week ?? profile.days_per_week ?? program?.sessions_per_week ?? null,
    trainingDays: (program ? program.training_days : profile.training_days) ?? null,
    sessionMinutes: program?.session_minutes ?? profile.session_minutes,
  };
  const nameOf = (id: string | null) => positions.find((p) => p.id === id)?.name ?? "your position";
  const slugOf = (id: string | null) => positions.find((p) => p.id === id)?.slug ?? null;
  const primarySlug = slugOf(defaults.positionId);
  const secondarySlug = slugOf(defaults.secondaryPositionId);
  const historyLink = (archivedCount ?? 0) > 0 && (
    <Link href="/program/history" className="text-label text-muted hover:text-foreground">
      History · {archivedCount} archived block{archivedCount === 1 ? "" : "s"} →
    </Link>
  );

  if (!athlete || !program) {
    return (
      <div className="flex flex-col gap-page">
        <div>
          <h1 className="text-display">Your Program</h1>
          <p className="mt-2 text-body text-muted">
            A weekly plan built around what your position needs, split into the weight room, the field and recovery.
          </p>
        </div>
        <NewBlockForm positions={positions} defaults={defaults} currentPhase={profile.training_phase} current={null} />
        <Link href="/plans" className="text-label text-primary">
          Or browse individual modules →
        </Link>
        {historyLink}
      </div>
    );
  }

  const today = athlete.today;
  const pos = programPosition(program.started_on, today, program.weeks);
  const rationale = asRationale(program.rationale);
  const weekNote = rationale.weeks?.find((w) => w.week === pos.week)?.note ?? null;
  const positionName = rationale.position ?? "your position";
  const emphasisAttrs = program.emphasis_attributes as TrainingAttribute[];
  const current = { phase: program.phase, week: Math.min(pos.week, program.weeks), weeks: program.weeks, finished: pos.finished };
  const trainingDays = defaults.trainingDays ?? defaultTrainingDays(defaults.daysPerWeek ?? 4);

  const controls = (
    <ProgramControls
      positions={positions}
      defaults={defaults}
      phase={program.phase}
      focus={emphasisAttrs}
      current={current}
      archivedCount={archivedCount ?? 0}
      summary={`${nameOf(defaults.positionId)}${defaults.secondaryPositionId ? ` + ${nameOf(defaults.secondaryPositionId)}` : ""} · ${PHASE_LABEL[program.phase]}${defaults.daysPerWeek ? ` · ${defaults.daysPerWeek} days` : ""}${defaults.sessionMinutes ? ` · ${defaults.sessionMinutes} min` : ""}`}
    />
  );

  if (pos.finished) {
    return (
      <div className="flex flex-col gap-page">
        <h1 className="text-display">Your Program</h1>
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-10 text-center">
          <CalendarRange size={32} className="text-primary" />
          <p className="text-heading">You finished this {program.weeks}-week block</p>
          <p className="text-body text-muted">Start the next one. Your logged weights carry over, so your targets keep progressing.</p>
        </div>
        {controls}
      </div>
    );
  }

  // Everything from this week to the end of the block: the strip and the "Up next" list both read
  // from it, so nothing before today is ever fetched, let alone shown.
  const { data: blockRaw } = await supabase
    .from("user_program_days")
    .select("*, user_program_day_exercises(*, exercise:exercises(slug, movement_pattern, prescription_mode, description, equipment))")
    .eq("program_id", program.id)
    .gte("week_number", pos.week)
    .order("week_number")
    .order("day_number");
  const blockDays = ((blockRaw ?? []) as unknown as DayRow[]).map((d) => ({
    ...d,
    user_program_day_exercises: [...(d.user_program_day_exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
  }));
  const weekDays = blockDays.filter((d) => d.week_number === pos.week);
  const legacy = weekDays.length > 0 && weekDays.some((d) => !d.template);

  const dayIds = blockDays.map((d) => d.id);
  const { data: logs } = dayIds.length
    ? await supabase.from("progress_logs").select("program_day_id, setting, completed_at").eq("user_id", user.id).in("program_day_id", dayIds)
    : { data: [] as { program_day_id: string | null; setting: Session | null; completed_at: string | null }[] };
  const dayLogs = (dayId: string) => (logs ?? []).filter((l) => l.program_day_id === dayId) as { setting: Session | null; completed_at: string | null }[];
  const dayDone = (d: DayRow) => dayLogs(d.id).some((l) => l.completed_at);

  const lineFor = (r: DayExerciseRow): ExerciseLine => ({
    id: r.id,
    name: r.exercise_name,
    block: r.block,
    sets: r.sets,
    reps: r.reps,
    restSeconds: r.rest_seconds,
    targetWeight: r.target_weight != null ? Number(r.target_weight) : null,
    unit: r.weight_unit,
    note: r.rx_note,
    pattern: r.exercise?.movement_pattern as ExerciseLine["pattern"],
  });

  const { data: userPlan } = await supabase.from("user_plans").select("id, plan:plans(name)").eq("user_id", user.id).eq("status", "active").maybeSingle();
  const modulePlan = (userPlan?.plan as unknown as { name: string } | null) ?? null;

  const weekProfile = weekDays.length
    ? Object.fromEntries(ATTRIBUTES.map((a) => [a, weekDays.reduce((s, d) => s + (((d.attribute_profile as Record<string, number> | null)?.[a]) ?? 0), 0) / weekDays.length]))
    : {};
  const effective = rationale.effective ?? {};
  const targetDays = athlete.target ? diffDays(today, athlete.target.date) : null;
  const deloadWeek = weekDays.some((d) => d.deload);
  // Plain-language reasons for what the program changed on its own (feedback, check-ins, logged weights)
  const adjustments = ((program.adjustments ?? []) as unknown as { kind: string; message: string }[]).filter((a) => a?.message);

  const stripStart = sundayOf(today);
  const stripEnd = addDays(stripStart, WEEK_STRIP_WEEKS * 7 - 1);
  const weekRangeLabel = `${monthDayLabel(stripStart)} – ${monthDayLabel(addDays(stripStart, 6))}`;

  const trackPanel = (track: Track) => {
    // Day N = this session's order within its own block week, for this track only.
    const trackDays = blockDays
      .filter((d) => d.setting === track)
      .map((d) => ({ ...d, date: programDayDate(program.started_on, d.week_number, d.day_number) }));
    const byWeek = new Map<number, typeof trackDays>();
    for (const d of trackDays) byWeek.set(d.week_number, [...(byWeek.get(d.week_number) ?? []), d]);
    for (const [w, rows] of byWeek) byWeek.set(w, [...rows].sort((a, b) => a.day_number - b.day_number));
    const dayIndexOf = (d: DayRow) => (byWeek.get(d.week_number) ?? []).findIndex((x) => x.id === d.id) + 1;
    const future = trackDays.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));

    const stripDays: StripDay[] = [];
    for (let date = stripStart; date <= stripEnd; date = addDays(date, 1)) {
      if (date < today) {
        stripDays.push({ date, sessions: [], done: false, game: false, practice: false });
        continue;
      }
      const sessions = future.filter((d) => d.date === date).map(() => (track === "field" ? ("field" as Session) : ("weight_room" as Session)));
      const events = athlete.events.filter((e) => e.date === date);
      const doneHere = future.filter((d) => d.date === date).every((d) => dayDone(d));
      stripDays.push({
        date,
        sessions,
        done: sessions.length > 0 && doneHere,
        game: events.some((e) => e.type === "game"),
        practice: events.some((e) => e.type === "practice"),
        href: sessions.length ? `#${track}-day-${date}` : undefined,
      });
    }

    const weeksPresent = [...new Set(future.map((d) => d.week_number))].sort((a, b) => a - b);
    const groupLabel = (w: number) => {
      if (w === pos.week) return "This week";
      if (w === pos.week + 1) return "Next week";
      const wk = rationale.weeks?.find((x) => x.week === w);
      return `Week ${w}${wk?.deload ? " · Deload" : ""}`;
    };
    const rowFor = (d: (typeof future)[number]) => {
      const lines = d.user_program_day_exercises.map(lineFor);
      const done = dayDone(d);
      const dateLabel = d.date === today ? "Today" : d.date === addDays(today, 1) ? "Tomorrow" : fmtShort(d.date);
      return (
        <details key={d.id} id={`${track}-day-${d.date}`} className="group surface-card" open={d.date === today}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5">
            <span className="flex flex-col">
              <span className="text-heading">
                Day {dayIndexOf(d)} · {sessionTitle(d.title)}
              </span>
              <span className="mt-1 text-caption text-muted">
                {dateLabel} · {INTENSITY_LABEL[d.intensity]} intensity
                {d.est_minutes ? ` · ~${d.est_minutes} min` : ""}
                {done ? " · done" : ""}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-foreground">
              {done ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-control bg-primary text-primary-foreground">
                  <SessionIcon session={track} size={14} />
                </span>
              ) : (
                <SessionIcon session={track} size={18} />
              )}
            </span>
          </summary>
          <div className="flex flex-col gap-4 border-t border-border p-3.5">
            {d.note && <p className="text-caption text-muted">{d.note}</p>}
            {d.why_note && <WhyNote position={positionName} text={d.why_note} />}
            <SessionExercises session={track} lines={lines} />
          </div>
        </details>
      );
    };

    const shownWeeks = weeksPresent.slice(0, 2);
    const restWeeks = weeksPresent.slice(2);

    return (
      <div className="flex flex-col gap-section">
        <WeekStrip days={stripDays} today={today} editDays={<EditDaysButton key="edit-days" trainingDays={trainingDays} />} />

        <h2 className="text-label text-muted">Up next</h2>

        {!legacy && (
          <section className="flex flex-col gap-4" aria-label={`${track === "field" ? "Field" : "Gym"} sessions`}>
            {future.length === 0 && <p className="text-body text-muted">No more {track === "field" ? "field / court" : "gym"} sessions in this block.</p>}
            <ShowMoreWeeks
              initial={
                <>
                  {shownWeeks.map((w) => {
                    const rows = future.filter((d) => d.week_number === w);
                    const doneCount = rows.filter((d) => dayDone(d)).length;
                    return (
                      <div key={w} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-label text-foreground">{groupLabel(w)}</p>
                          <p className="text-label text-muted">
                            {doneCount} of {rows.length} done
                          </p>
                        </div>
                        {rows.map(rowFor)}
                      </div>
                    );
                  })}
                </>
              }
              more={
                <>
                  {restWeeks.map((w) => {
                    const rows = future.filter((d) => d.week_number === w);
                    const doneCount = rows.filter((d) => dayDone(d)).length;
                    return (
                      <div key={w} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-label text-foreground">{groupLabel(w)}</p>
                          <p className="text-label text-muted">
                            {doneCount} of {rows.length} done
                          </p>
                        </div>
                        {rows.map(rowFor)}
                      </div>
                    );
                  })}
                </>
              }
            />
          </section>
        )}
      </div>
    );
  };

  const hasSessionToday = (t: Track) => blockDays.some((d) => d.setting === t && d.week_number === pos.week && d.day_number === pos.dayNumber);
  const defaultTrack: Track = hasSessionToday("weight_room") ? "weight_room" : hasSessionToday("field") ? "field" : "weight_room";

  return (
    <div className="flex flex-col gap-page">
      {welcome && (
        <div className="flex items-start gap-3 border-l-[4px] border-l-primary bg-surface p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-heading">Your first program is ready</p>
            <p className="mt-1 text-caption text-muted">
              Built for a {positionName} in {PHASE_LABEL[program.phase].toLowerCase()}. Every area is in it. Use Adjust program to change your position, season or focus, and Coach settings to set a target date, flag anything to go easy on and add your games.
            </p>
          </div>
        </div>
      )}

      <div>
        <p className="text-label text-primary">
          {PHASE_LABEL[program.phase]} · {weekRangeLabel}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-display">
            Week {pos.week} of {program.weeks}
            {deloadWeek ? " · Deload" : ""}
          </h1>
          {primarySlug && (
            <span className="flex items-center gap-1.5">
              <PositionIcon slug={primarySlug} name={nameOf(defaults.positionId)} size={48} className="rounded-card" />
              {secondarySlug && <PositionIcon slug={secondarySlug} name={nameOf(defaults.secondaryPositionId)} size={30} className="rounded-control" />}
            </span>
          )}
        </div>
      </div>

      {controls}

      {legacy && (
        <div className="flex flex-col gap-2 rounded-card border border-warning/60 p-4">
          <p className="text-heading">This week was built with the older builder</p>
          <p className="text-caption text-muted">Start a new training block to get position-scored exercises, separate weight-room and field sessions, progressive targets and calendar-aware lightening. Your current program is archived, not deleted.</p>
        </div>
      )}

      {adjustments.length > 0 && (
        <section className="flex flex-col gap-2 surface-card p-card-sm" aria-label="What changed and why">
          <h2 className="text-label text-muted">What changed and why</h2>
          <ul className="flex flex-col gap-1.5 text-body">
            {adjustments.map((a) => (
              <li key={a.message}>{a.message}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2">
        {deloadWeek && (
          <Notice icon={<TrendingUp size={15} />} tone="primary">
            Deload week: lighter on purpose, so your body absorbs the last few weeks of training.
          </Notice>
        )}
        {weekNote && !deloadWeek && (
          <Notice icon={<Target size={15} />} tone="primary">
            {weekNote}
          </Notice>
        )}
        {targetDays !== null && athlete.target && (
          <Notice icon={<Target size={15} />} tone="primary">
            {targetDays === 0 ? "Today is" : `${targetDays} day${targetDays === 1 ? "" : "s"} to`} {athlete.target.event || "your target date"}. Training is shaped to peak on the day.
          </Notice>
        )}
        {athlete.plateaus.map((p) => (
          <Notice key={p.slug} icon={<TrendingUp size={15} />} tone="warning">
            {p.message}
          </Notice>
        ))}
        {athlete.limitations.length > 0 && (
          <Notice icon={<HeartPulse size={15} />} tone="default">
            Going easy on: {athlete.limitations.map((l) => `${SIDE_LABEL[l.side] === "Both sides" ? "" : SIDE_LABEL[l.side].toLowerCase() + " "}${BODY_AREA_LABEL[l.area].toLowerCase()}`).join(", ")}. Exercises that load those areas are avoided or lightened.
          </Notice>
        )}
        {program.phase === "in_season" && athlete.events.length === 0 && (
          <Notice icon={<Flag size={15} />} tone="default">
            Add your games and practices and in-season sessions will lighten around them automatically.{" "}
            <Link href="/program/coach" className="font-semibold text-primary">
              Add them
            </Link>
          </Notice>
        )}
      </div>

      <TrackTabs defaultTrack={defaultTrack} field={trackPanel("field")} gym={trackPanel("weight_room")} />

      <section className="flex flex-col gap-3 surface-card p-card">
        <h2 className="text-heading">What this week trains</h2>
        <AttributeBars values={weekProfile} highlight={emphasisAttrs} />
        <details className="text-caption text-muted">
          <summary className="cursor-pointer text-label text-foreground">How your week was built</summary>
          <p className="mt-2">
            Your needs profile starts from what a {positionName.toLowerCase()} needs, shifts for {PHASE_LABEL[program.phase].toLowerCase()}, and adds extra focus to the areas you picked. Every area stays in the plan.
          </p>
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="text-label text-muted">
                <th className="py-1">Area</th>
                <th className="py-1 text-right">Position</th>
                <th className="py-1 text-right">Phase</th>
                <th className="py-1 text-right">Focus</th>
                <th className="py-1 text-right">Goal date</th>
                <th className="py-1 text-right">Plateau</th>
                <th className="py-1 text-right">Now</th>
              </tr>
            </thead>
            <tbody>
              {ATTRIBUTES.map((a) => {
                const e = effective[a];
                if (!e) return null;
                const fmt = (n: number) => (n === 0 ? "·" : n > 0 ? `+${n}` : `${n}`);
                return (
                  <tr key={a} className="border-t border-border">
                    <td className="py-1 text-foreground">{ATTRIBUTE_LABEL[a]}</td>
                    <td className="py-1 text-right tabular-nums">{e.base}</td>
                    <td className="py-1 text-right tabular-nums">{fmt(e.phase)}</td>
                    <td className="py-1 text-right tabular-nums">{fmt(e.emphasis)}</td>
                    <td className="py-1 text-right tabular-nums">{fmt(e.periodization)}</td>
                    <td className="py-1 text-right tabular-nums">{fmt(e.plateau)}</td>
                    <td className="py-1 text-right font-semibold tabular-nums text-foreground">{e.value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      </section>

      <div className="flex flex-col gap-2 text-center">
        <Link href="/program/coach" className="text-label text-primary">
          Coach settings: target date, go-easy flags, games &amp; practices →
        </Link>
        <Link href="/plans" className="text-label text-primary">
          Browse modules for an extra session →
        </Link>
        {modulePlan && (
          <Link href="/dashboard?view=module" className="text-label text-muted">
            Your extra module: {modulePlan.name}
          </Link>
        )}
      </div>
    </div>
  );
}

function WhyNote({ position, text }: { position: string; text: string }) {
  return (
    <p className="flex items-start gap-2 border-l-[3px] border-l-primary bg-surface px-3 py-2 text-caption">
      <Info size={14} className="mt-0.5 shrink-0 text-primary" />
      <span>
        <span className="font-semibold">Why this matters for a {position.toLowerCase()}:</span> {text}
      </span>
    </p>
  );
}

function Notice({ icon, tone, children }: { icon: React.ReactNode; tone: "primary" | "warning" | "default"; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-control border px-3 py-2 text-caption",
        tone === "primary" && "border-primary/60",
        tone === "warning" && "border-warning/60",
        tone === "default" && "border-border bg-surface",
      )}
    >
      <span className={cn("mt-0.5 shrink-0", tone === "warning" ? "text-warning" : "text-primary")}>{icon}</span>
      <span>{children}</span>
    </p>
  );
}
