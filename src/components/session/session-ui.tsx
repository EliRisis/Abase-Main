import { PositionIcon } from "@/components/icons/app-icon";
import { FieldIcon, RecoveryIcon, WeightRoomIcon } from "@/components/icons";
import { SESSION_HINT, SESSION_LABEL, type Session } from "@/lib/program/sessions";
import { cn } from "@/lib/utils";

const ICONS = { weight_room: WeightRoomIcon, field: FieldIcon, recovery: RecoveryIcon } as const;

export function SessionIcon({ session, size = 24, className }: { session: Session; size?: number; className?: string }) {
  const Icon = ICONS[session];
  return <Icon size={size} className={className} />;
}

/**
 * The header of a session. The two rooms look different on purpose so the setting is obvious at a glance:
 * the weight room is a solid plate under a heavy rule, the field is hatched like track lanes.
 */
export function SessionHeader({
  session,
  meta,
  action,
  className,
  positionSlug,
}: {
  positionSlug?: string | null;
  session: Session;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-card-sm py-3.5",
        session === "weight_room" && "plate",
        session === "field" && "lane-stripes border-b border-border",
        session === "recovery" && "border-b border-border",
        className,
      )}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-control", session === "recovery" ? "bg-surface-raised text-foreground" : "bg-primary text-primary-foreground")}>
        <SessionIcon session={session} size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-heading">{SESSION_LABEL[session]}</h3>
        <p className="mt-0.5 truncate text-caption text-muted">{meta ?? SESSION_HINT[session]}</p>
      </div>
      {positionSlug && <PositionIcon slug={positionSlug} size={28} className="rounded-control" />}
      {action}
    </div>
  );
}
