import { CalendarRange, Clock, Info, RecoveryIcon } from "@/components/icons";
import { PositionIcon } from "@/components/icons/app-icon";
import Link from "next/link";
import { redirect } from "next/navigation";
import { startProgramDayAction } from "../program/actions";
import { EditDaysButton } from "@/components/program/edit-days-button";
import { ReadinessCard } from "@/components/program/readiness-card";
import { SessionCard } from "@/components/session/session-card";
import type { ExerciseLine } from "@/components/session/session-exercises";
import { TrackTabs } from "@/components/session/track-tabs";
import { WeekStrip, type StripDay } from "@/components/session/week-strip";
import { Badge } from "@/components/ui/badge";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";
import { loadAthlete } from "@/lib/program/data";
import { addDays, isoWeekdayOf, programDayDate, programPosition } from "@/lib/program/periodization";
import type { Track } from "@/lib/program/assembler";
import { defaultTrainingDays, monthDayLabel, sessionTitle, sundayOf, weekdayLabel, WEEK_STRIP_WEEKS } from "@/lib/program/schedule";
import { equipmentFor, type Session } from "@/lib/program/sessions";
import { dayTargets, loadRecentSessions, nearbyEvents, type DayExerciseRow } from "@/lib/program/service";
import { evaluateReadiness, patternsFromCategory } from "@/lib/readiness";
import { INTENSITY_LABEL, INTENSITY_VARIANT, PHASE_LABEL } from "@/lib/training";
import type { Tables } from "@/lib/database.types";

export const metadata = { title: "Today" };

type DayRow = Tables<"user_program_days"> & { user_program_day_exercises: DayExerciseRow[] };

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** A chip on the strip picked a session for this day. The whole block lives on the Program tab. */
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: dateParam } = await searchParams;
  const { supabase, user } = await requireOnboardedProfile();
  const athlete = await loadAthlete(supabase, user.id);
  const program = athlete?.activeProgram ?? null;
  // no assembled program: Today is the module dashboard, as before
  if (!athlete || !program) redirect("/dashboard?view=module");

  const today = athlete.today;
  const pos = programPosition(program.started_on, today, program.weeks);

  if (pos.finished) {
    return (
      <div className="flex flex-col gap-page">
        <h1 className="text-display">Today</h1>
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border p-10 text-center">
          <CalendarRange size={32} className="text-primary" />
          <p className="text-heading">You finished this {program.weeks}-week block</p>
          <Link href="/program" className="text-label text-primary">
            Start your next block on the Program tab →
          </Link>
        </div>
      </div>
    );
  }

  const blockEnd = addDays(program.started_on, program.weeks * 7 - 1);
  const viewDate = dateParam && isIsoDate(dateParam) && dateParam >= today && dateParam <= blockEnd ? dateParam : today;
  const viewWeek = Math.floor((Date.parse(`${viewDate}T00:00:00Z`) - Date.parse(`${program.started_on}T00:00:00Z`)) / 86_400_000 / 7) + 1;
  const viewDayNumber = isoWeekdayOf(viewDate);

  // The selected day = this program's week and weekday for the chosen date (same math as the Program tab)
  const [{ data: viewRaw }, { data: allDays }, { data: positionRow }] = await Promise.all([
    supabase
      .from("user_program_days")
      .select("*, user_program_day_exercises(*, exercise:exercises(slug, movement_pattern, prescription_mode, description, equipment))")
      .eq("program_id", program.id)
      .eq("week_number", viewWeek)
      .eq("day_number", viewDayNumber),
    supabase.from("user_program_days").select("id, week_number, day_number, setting, title").eq("program_id", program.id).gte("week_number", pos.week),
    program.position_id ? supabase.from("positions").select("name, slug").eq("id", program.position_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const viewDays = ((viewRaw ?? []) as unknown as DayRow[]).map((d) => ({
    ...d,
    user_program_day_exercises: [...(d.user_program_day_exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
  }));
  const dayFor = (t: Track) => viewDays.find((d) => d.setting === t) ?? null;
  const trainingDays = (program.training_days ?? defaultTrainingDays(program.days_per_week ?? 4)) as number[];

  const withDates = (allDays ?? []).map((d) => ({ ...d, date: programDayDate(program.started_on, d.week_number, d.day_number) }));
  const nextFor = (t: Track) =>
    withDates
      .filter((d) => d.setting === t && d.date > today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  const blockDayIds = withDates.map((d) => d.id);
  const [{ data: logs }, { data: checkin }, recent] = await Promise.all([
    blockDayIds.length ? supabase.from("progress_logs").select("program_day_id, completed_at").eq("user_id", user.id).in("program_day_id", blockDayIds) : Promise.resolve({ data: [] as { program_day_id: string | null; completed_at: string | null }[] }),
    supabase.from("readiness_checkins").select("score").eq("user_id", user.id).eq("checkin_date", today).maybeSingle(),
    loadRecentSessions(supabase, user.id, athlete),
  ]);
  const logsOf = (id: string) => (logs ?? []).filter((l) => l.program_day_id === id);
  const doneId = (id: string) => logsOf(id).some((l) => l.completed_at);
  const targetsByDay = new Map(await Promise.all(viewDays.map(async (d) => [d.id, await dayTargets(supabase, user.id, d.user_program_day_exercises, today)] as const)));

  const stripStart = sundayOf(today);
  const stripEnd = addDays(stripStart, WEEK_STRIP_WEEKS * 7 - 1);

  const panel = (track: Track) => {
    const trackRows = withDates.filter((d) => d.setting === track && d.date >= today);
    const stripDays: StripDay[] = [];
    for (let date = stripStart; date <= stripEnd; date = addDays(date, 1)) {
      if (date < today) {
        stripDays.push({ date, sessions: [], done: false, game: false, practice: false });
        continue;
      }
      const here = trackRows.filter((d) => d.date === date);
      const events = athlete.events.filter((e) => e.date === date);
      stripDays.push({
        date,
        sessions: here.map(() => (track === "field" ? ("field" as Session) : ("weight_room" as Session))),
        done: here.length > 0 && here.every((d) => doneId(d.id)),
        game: events.some((e) => e.type === "game"),
        practice: events.some((e) => e.type === "practice"),
        href: `/today?date=${date}#${track}`,
      });
    }

    const day = dayFor(track);
    const stripAndHeader = (
      <div id={track}>
        <WeekStrip days={stripDays} today={today} selected={viewDate} editDays={<EditDaysButton key="edit-days" trainingDays={trainingDays} />} />
      </div>
    );

    if (!day) {
      const nx = nextFor(track);
      return (
        <div className="flex flex-col gap-section">
          {stripAndHeader}
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border p-10 text-center">
            <RecoveryIcon size={36} className="text-muted" />
            <p className="text-heading mt-1">Rest day</p>
            <p className="text-body text-muted">
              {nx ? (
                <>
                  Next {track === "field" ? "field / court" : "gym"} session: {fmtDate(nx.date)} · {sessionTitle(nx.title)}
                </>
              ) : (
                "No more sessions in this track for this block."
              )}
            </p>
          </div>
        </div>
      );
    }
    const targets = targetsByDay.get(day.id)!;
    const lines: ExerciseLine[] = day.user_program_day_exercises.map((r) => {
      const t = r.exercise_id ? targets.get(r.exercise_id) : undefined;
      return {
        id: r.id,
        name: r.exercise_name,
        block: r.block,
        sets: r.sets,
        reps: r.reps,
        restSeconds: r.rest_seconds,
        targetWeight: t?.weight ?? (r.target_weight != null ? Number(r.target_weight) : null),
        unit: t?.unit ?? r.weight_unit,
        note: r.rx_note,
        pattern: r.exercise?.movement_pattern as ExerciseLine["pattern"],
        loadReason: t && t.action !== "start" ? t.reason : null,
      };
    });
    const dl = logsOf(day.id);
    const done = dl.some((l) => l.completed_at);
    const started = dl.length > 0;
    const isToday = viewDate === today;
    const advisory =
      isToday && !done && !started
        ? evaluateReadiness({
            today: { intensity: day.intensity, patterns: day.patterns.length ? day.patterns : patternsFromCategory(day.category) },
            recent,
            checkinScore: checkin?.score ?? null,
            events: nearbyEvents(athlete),
          })
        : null;
    const changes = day.user_program_day_exercises
      .map((r) => ({ name: r.exercise_name, t: r.exercise_id ? targets.get(r.exercise_id) : undefined }))
      .filter((x) => x.t && (x.t.action === "increase" || x.t.action === "reduce"));
    return (
      <div className="flex flex-col gap-section">
        {stripAndHeader}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={INTENSITY_VARIANT[day.intensity]}>{INTENSITY_LABEL[day.intensity]}</Badge>
            {day.volume_pct < 100 && <Badge>{day.volume_pct}% volume</Badge>}
            {day.deload && <Badge variant="success">Deload</Badge>}
            {day.est_minutes && (
              <span className="inline-flex items-center gap-1 text-caption text-muted">
                <Clock size={13} /> ~{day.est_minutes} min
              </span>
            )}
          </div>
          <h2 className="text-title mt-3">
            {isToday ? "Today" : viewDate === addDays(today, 1) ? "Tomorrow" : fmtDate(viewDate)} · {sessionTitle(day.title)}
          </h2>
          {day.note && <p className="mt-1 text-caption text-muted">{day.note}</p>}
        </div>
        {day.why_note && (
          <p className="flex items-start gap-2 border-l-[3px] border-l-primary bg-surface px-3 py-2 text-caption">
            <Info size={14} className="mt-0.5 shrink-0 text-primary" />
            <span>
              <span className="font-semibold">Why this matters:</span> {day.why_note}
            </span>
          </p>
        )}
        {isToday && (
          <ReadinessCard
            showCheckin={false}
            alreadyCheckedIn={null}
            advisory={advisory ? { flagged: advisory.flagged, reasons: advisory.reasons, suggestion: advisory.suggestion, includesSupplemental: advisory.includesSupplemental } : null}
            todayDayId={!started && !done ? day.id : null}
          />
        )}
        {changes.length > 0 && (
          <ul className="surface-card flex flex-col gap-1.5 p-card-sm text-body">
            {changes.map((w) => (
              <li key={w.name}>
                <span className="font-semibold">{w.name}:</span> {w.t!.reason}
              </li>
            ))}
          </ul>
        )}
        <SessionCard
          session={track}
          lines={lines}
          minutes={day.est_minutes}
          equipment={equipmentFor(day.user_program_day_exercises.map((r) => ({ equipment: r.exercise?.equipment ?? null })))}
          positionSlug={positionRow?.slug}
          status={done ? "done" : started ? "started" : "todo"}
          action={startProgramDayAction.bind(null, day.id)}
          startLabel={started ? "Continue session" : "Start session"}
        />
      </div>
    );
  };

  const defaultTrack: Track = dayFor("weight_room") ? "weight_room" : dayFor("field") ? "field" : "weight_room";

  return (
    <div className="flex flex-col gap-page">
      <div>
        <p className="text-label text-primary">
          {monthDayLabel(viewDate)} · {PHASE_LABEL[program.phase]}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-display">{weekdayLabel(viewDate)}</h1>
          {positionRow && <PositionIcon slug={positionRow.slug} name={positionRow.name} size={48} className="rounded-card" />}
        </div>
      </div>

      {viewDate === today && <ReadinessCard alreadyCheckedIn={checkin ? { score: checkin.score } : null} advisory={null} todayDayId={null} />}

      <TrackTabs defaultTrack={defaultTrack} field={panel("field")} gym={panel("weight_room")} />

      <Link href="/program" className="text-center text-label text-primary">
        See the whole block on the Program tab →
      </Link>
    </div>
  );
}
