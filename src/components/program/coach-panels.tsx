"use client";

import { Flag, HeartPulse, Target, Trash2 } from "@/components/icons";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addEventAction,
  addLimitationAction,
  clearTargetDateAction,
  removeEventAction,
  removeLimitationAction,
  setTargetDateAction,
  type CoachResult,
} from "@/app/(app)/program/coach/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calendarEventSchema, limitationSchema, targetDateSchema } from "@/lib/validations/program";
import { BODY_AREAS, BODY_AREA_LABEL, EVENT_TYPES, EVENT_TYPE_LABEL, SIDES, SIDE_LABEL } from "@/lib/training";
import type { CalendarEventType, LimitationBodyArea, LimitationSide } from "@/lib/database.types";

function useCoachAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(fn: () => Promise<CoachResult>, okMessage: string, after?: () => void) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success(res.rebuilt ? `${okMessage}. Your upcoming sessions were re-planned.` : okMessage);
      after?.();
    });
  }
  return { pending, error, setError, run };
}

const localToday = () => new Date().toLocaleDateString("en-CA");

function Panel({ icon, title, blurb, children }: { icon: React.ReactNode; title: string; blurb: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-section surface-card p-card">
      <div>
        <h2 className="flex items-center gap-2 text-subheading">
          <span className="text-primary">{icon}</span> {title}
        </h2>
        <p className="mt-1 text-caption text-muted">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

// ------------------------------------------------------------------ target date
export function TargetDatePanel({ target }: { target: { date: string; event: string | null } | null }) {
  const [date, setDate] = useState(target?.date ?? "");
  const [event, setEvent] = useState(target?.event ?? "");
  const { pending, error, setError, run } = useCoachAction();

  function save() {
    const parsed = targetDateSchema(localToday()).safeParse({ date, event: event || null });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid date");
    run(() => setTargetDateAction({ date: parsed.data.date, event: parsed.data.event ?? null }), "Target date saved");
  }

  return (
    <Panel
      icon={<Target size={16} />}
      title="Target date"
      blurb="A combine, tryouts or season start. Your training builds toward peaking on that date: strength and volume early, speed and power later, and a sharp taper in the final week."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="target-date">Date</Label>
          <Input id="target-date" type="date" value={date} min={localToday()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="target-event">What is it? (optional)</Label>
          <Input id="target-event" value={event} maxLength={100} placeholder="Combine, tryouts, opening game" onChange={(e) => setEvent(e.target.value)} />
        </div>
      </div>
      {error && (
        <p className="text-body text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" loading={pending} onClick={save} disabled={!date}>
          Save target date
        </Button>
        {target && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run(
                () => clearTargetDateAction(),
                "Target date cleared",
                () => {
                  setDate("");
                  setEvent("");
                },
              )
            }
          >
            Clear
          </Button>
        )}
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------ go-easy flags
export function LimitationsPanel({ items }: { items: { id: string; area: LimitationBodyArea; side: LimitationSide; note: string | null }[] }) {
  const [area, setArea] = useState<LimitationBodyArea>("knee");
  const [side, setSide] = useState<LimitationSide>("both");
  const [note, setNote] = useState("");
  const { pending, error, setError, run } = useCoachAction();

  function add() {
    const parsed = limitationSchema.safeParse({ area, side, note: note || null });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid input");
    run(() => addLimitationAction(parsed.data), "Flag added", () => setNote(""));
  }

  return (
    <Panel
      icon={<HeartPulse size={16} />}
      title="Go easy on"
      blurb="Pick an area to be gentle with and your program will choose fewer exercises that load it and lighten the ones it can't avoid. It's a simple preference, not a diagnosis."
    >
      {items.length > 0 && (
        <ul className="flex flex-col divide-y divide-border surface-inset">
          {items.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-body">
              <span>
                <span className="font-semibold">
                  {l.side === "both" ? "" : `${SIDE_LABEL[l.side]} `}
                  {BODY_AREA_LABEL[l.area]}
                </span>
                {l.note && <span className="text-muted"> · {l.note}</span>}
              </span>
              <Button size="icon" variant="ghost" aria-label={`Remove ${BODY_AREA_LABEL[l.area]}`} disabled={pending} onClick={() => run(() => removeLimitationAction(l.id), "Flag removed")}>
                <Trash2 size={15} className="text-danger" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Area</Label>
          <Select value={area} onValueChange={(v) => setArea(v as LimitationBodyArea)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BODY_AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {BODY_AREA_LABEL[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Side</Label>
          <Select value={side} onValueChange={(v) => setSide(v as LimitationSide)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIDES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SIDE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lim-note">Note (optional)</Label>
          <Input id="lim-note" value={note} maxLength={200} placeholder="e.g. feeling tight lately" onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      {error && (
        <p className="text-body text-danger" role="alert">
          {error}
        </p>
      )}
      <Button size="sm" className="self-start" loading={pending} onClick={add} disabled={items.length >= 6}>
        Add flag
      </Button>
      {items.length >= 6 && <p className="text-caption text-muted">You can flag up to 6 areas at once.</p>}
    </Panel>
  );
}

// ------------------------------------------------------------------ calendar
export function CalendarPanel({ events }: { events: { id: string; date: string; type: CalendarEventType; note: string | null }[] }) {
  const [date, setDate] = useState("");
  const [type, setType] = useState<CalendarEventType>("game");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState("1");
  const { pending, error, setError, run } = useCoachAction();

  function add() {
    const parsed = calendarEventSchema(localToday()).safeParse({ date, type, note: note || null });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid input");
    const weeks = Math.min(16, Math.max(1, Math.trunc(Number(repeat) || 1)));
    run(
      () => addEventAction({ ...parsed.data, repeatWeeks: weeks }),
      weeks > 1 ? `${weeks} ${EVENT_TYPE_LABEL[type].toLowerCase()}s added` : `${EVENT_TYPE_LABEL[type]} added`,
      () => {
        setDate("");
        setNote("");
        setRepeat("1");
      },
    );
  }

  return (
    <Panel
      icon={<Flag size={16} />}
      title="Games & practices"
      blurb="Add them and your program lightens around them: no lifting on game day, activation the day before, recovery after, and moderate sessions on practice days."
    >
      {events.length > 0 && (
        <ul className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto surface-inset">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-body">
              <span>
                <span className="font-semibold">{EVENT_TYPE_LABEL[e.type]}</span> ·{" "}
                {new Date(`${e.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                {e.note && <span className="text-muted"> · {e.note}</span>}
              </span>
              <Button size="icon" variant="ghost" aria-label="Remove event" disabled={pending} onClick={() => run(() => removeEventAction(e.id), "Event removed")}>
                <Trash2 size={15} className="text-danger" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="ev-date">Date</Label>
          <Input id="ev-date" type="date" value={date} min={localToday()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as CalendarEventType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EVENT_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ev-repeat">Repeat weekly for</Label>
          <Input id="ev-repeat" type="number" min={1} max={16} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ev-note">Note (optional)</Label>
          <Input id="ev-note" value={note} maxLength={200} placeholder="vs. Central High" onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      {error && (
        <p className="text-body text-danger" role="alert">
          {error}
        </p>
      )}
      <Button size="sm" className="self-start" loading={pending} onClick={add} disabled={!date}>
        Add to calendar
      </Button>
    </Panel>
  );
}
