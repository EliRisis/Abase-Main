import { Clock } from "@/components/icons";
import { clock, fieldSpec, type Session } from "@/lib/program/sessions";
import { PATTERN_LABEL } from "@/lib/training";
import { cn } from "@/lib/utils";
import type { MovementPattern } from "@/lib/database.types";

const BLOCK_LABEL: Record<string, string> = {
  warmup: "Warm-up",
  main: "Main",
  secondary: "Secondary",
  accessory: "Accessory",
  finisher: "Finisher",
};

export interface ExerciseLine {
  id: string;
  name: string;
  block: string;
  sets: number;
  reps: string;
  restSeconds: number | null;
  targetWeight: number | null;
  unit: string;
  note: string | null;
  pattern?: MovementPattern | null;
  /** e.g. "Last time 185 x 5,5,5: time to go up." */
  loadReason?: string | null;
}

/**
 * A session's exercises, laid out for the room they belong to:
 *   weight room  ->  sets x reps and load are the big numbers
 *   field        ->  distance / time and rest are the big numbers
 *   recovery     ->  a plain checklist
 */
export function SessionExercises({ session, lines }: { session: Session; lines: ExerciseLine[] }) {
  const blocks = ["warmup", "main", "secondary", "accessory", "finisher"].filter((b) => lines.some((l) => l.block === b));
  return (
    <div className="flex flex-col gap-section">
      {blocks.map((b) => (
        <div key={b}>
          <p className="text-label mb-2 text-muted">{BLOCK_LABEL[b]}</p>
          <ul className={cn("flex flex-col", session === "recovery" ? "divide-y divide-border surface-inset" : "gap-1.5")}>
            {lines
              .filter((l) => l.block === b)
              .map((l) => (
                <li key={l.id}>{session === "weight_room" ? <WeightRow l={l} /> : session === "field" ? <FieldRow l={l} /> : <RecoveryRow l={l} />}</li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Meta({ l }: { l: ExerciseLine }) {
  const bits = [l.pattern ? PATTERN_LABEL[l.pattern] : null, l.note].filter(Boolean);
  return (
    <>
      {bits.length > 0 && <p className="mt-0.5 text-caption text-muted">{bits.join(" · ")}</p>}
      {l.loadReason && <p className="mt-0.5 text-caption text-primary">{l.loadReason}</p>}
    </>
  );
}

/** Weight room: name on the left, SETS x REPS and LOAD as scoreboard numerals on the right. */
function WeightRow({ l }: { l: ExerciseLine }) {
  return (
    <div className="surface-inset flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-subheading">{l.name}</p>
        <Meta l={l} />
        {l.restSeconds ? <p className="mt-0.5 text-caption text-muted">Rest {clock(l.restSeconds)}</p> : null}
      </div>
      <div className="flex shrink-0 items-stretch gap-1.5">
        <div className="flex min-w-14 flex-col items-center justify-center bg-surface-raised px-2 py-1.5">
          <span className="text-stat-sm">
            {l.sets}
            <span className="text-muted">×</span>
            {l.reps}
          </span>
          <span className="text-label-sm mt-0.5 text-muted">sets × reps</span>
        </div>
        {l.targetWeight ? (
          <div className="flex min-w-14 flex-col items-center justify-center bg-primary px-2 py-1.5 text-primary-foreground">
            <span className="text-stat-sm">{l.targetWeight}</span>
            <span className="text-label-sm mt-0.5">{l.unit}</span>
          </div>
        ) : (
          <div className="flex min-w-14 flex-col items-center justify-center border border-border px-2 py-1.5 text-muted">
            <span className="text-stat-sm">BW</span>
            <span className="text-label-sm mt-0.5">load</span>
          </div>
        )}
      </div>
    </div>
  );
}

const UNIT_LABEL = { yd: "yards", m: "meters", s: "sec", min: "min" } as const;

/** Field: name on top, then REPS, DISTANCE / TIME and REST as three equal tiles. */
function FieldRow({ l }: { l: ExerciseLine }) {
  const spec = fieldSpec(l.reps);
  return (
    <div className="surface-inset border-l-[3px] border-l-primary px-3 py-2.5">
      <p className="text-subheading">{l.name}</p>
      <Meta l={l} />
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <Tile value={String(l.sets)} label={spec.amount ? "reps" : "sets"} />
        <Tile value={spec.amount ? String(spec.amount) : l.reps} label={spec.unit ? UNIT_LABEL[spec.unit] : "each"} small={!spec.amount} />
        <Tile value={l.restSeconds ? clock(l.restSeconds) : "-"} label="rest" muted icon />
      </div>
    </div>
  );
}

function Tile({ value, label, small, muted, icon }: { value: string; label: string; small?: boolean; muted?: boolean; icon?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-1.5 py-1.5", muted ? "border border-border" : "bg-surface-raised")}>
      <span className={cn(small ? "text-heading leading-none" : "text-stat-sm", muted && "text-muted")}>{value}</span>
      <span className="text-label-sm mt-1 flex items-center gap-1 text-muted">
        {icon && <Clock size={10} strokeWidth={3} />}
        {label}
      </span>
    </div>
  );
}

/** Recovery: a quiet checklist line. */
function RecoveryRow({ l }: { l: ExerciseLine }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-subheading">{l.name}</p>
        {l.note && <p className="mt-0.5 text-caption text-muted">{l.note}</p>}
      </div>
      <span className="shrink-0 text-body tabular-nums text-muted">
        {l.sets} × {l.reps}
      </span>
    </div>
  );
}
