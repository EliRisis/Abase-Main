import { CheckCircle2 } from "@/components/icons";
import { SessionExercises, type ExerciseLine } from "@/components/session/session-exercises";
import { SessionHeader } from "@/components/session/session-ui";
import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/program/sessions";

/**
 * One session of a day (weight room, field or recovery) as its own card, with its own start button and
 * its own done state. A day with two sessions renders two of these, never one merged list.
 */
export function SessionCard({
  session,
  lines,
  minutes,
  equipment,
  position,
  positionSlug,
  status,
  action,
  startLabel,
}: {
  session: Session;
  lines: ExerciseLine[];
  minutes?: number | null;
  equipment?: string[];
  /** e.g. "1 of 2" when the day has two sessions */
  position?: string;
  /** The athlete's position, drawn on the session header. */
  positionSlug?: string | null;
  status: "todo" | "started" | "done";
  /** Server action (already bound) that starts this session. */
  action?: () => Promise<void>;
  startLabel?: string;
}) {
  const work = lines.filter((l) => l.block !== "warmup").length;
  const bits = [`${work} exercise${work === 1 ? "" : "s"}`, minutes ? `~${minutes} min` : null, equipment && equipment.length ? `Bring: ${equipment.join(", ")}` : session === "field" ? "Bring: cones, a clear space" : null];
  return (
    <section className="surface-card overflow-hidden" aria-label={`${session.replace("_", " ")} session`}>
      <SessionHeader
        session={session}
        positionSlug={positionSlug}
        meta={bits.filter(Boolean).join(" · ")}
        action={
          position ? <span className="text-label shrink-0 text-muted">{position}</span> : undefined
        }
      />
      <div className="flex flex-col gap-section p-card-sm">
        {status === "done" ? (
          <div className="flex items-center gap-2 bg-primary px-3 py-3 text-primary-foreground">
            <CheckCircle2 size={20} />
            <span className="text-heading">Session complete</span>
          </div>
        ) : (
          <>
            <SessionExercises session={session} lines={lines} />
            {action && (
              <form action={action}>
                <Button type="submit" size="lg" className="w-full">
                  {startLabel ?? (status === "started" ? "Continue session" : "Start session")}
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </section>
  );
}
