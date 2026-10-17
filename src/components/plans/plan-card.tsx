import { PositionIcon, SportIcon } from "@/components/icons/app-icon";
import { CalendarDays, ChevronRight } from "@/components/icons";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PlanWithRelations } from "./plans-browser";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function PlanCard({ plan }: { plan: PlanWithRelations }) {
  return (
    <Link
      href={`/plans/${plan.slug}`}
      className="group flex flex-col overflow-hidden surface-card transition hover:border-foreground/50"
    >
      <div className="lane-stripes flex h-24 items-end justify-between gap-3 border-b border-border p-4">
        <span className="text-title leading-none">{plan.sport?.name ?? "Training"}</span>
        <span className="flex items-center gap-2">
          {plan.position && <PositionIcon slug={plan.position.slug} sportSlug={plan.sport?.slug} name={plan.position.name} size={40} className="rounded-card" />}
          <SportIcon slug={plan.sport?.slug} name={plan.sport?.name} size={plan.position ? 30 : 48} className="rounded-card" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-heading leading-tight">{plan.name}</h3>
          {plan.description && (
            <p className="mt-1 line-clamp-2 text-body text-muted">
              {plan.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {plan.sport && <Badge variant="primary"><SportIcon slug={plan.sport.slug} name={plan.sport.name} size={18} decorative />{plan.sport.name}</Badge>}
          {plan.position && <Badge><PositionIcon slug={plan.position.slug} sportSlug={plan.sport?.slug} name={plan.position.name} size={18} decorative />{plan.position.name}</Badge>}
          {plan.level && <Badge variant="default">{LEVEL_LABEL[plan.level]}</Badge>}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1 text-caption text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {plan.weeks} weeks · {plan.days_per_week}x/week
          </span>
          <ChevronRight
            size={16}
            className="text-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </div>
      </div>
    </Link>
  );
}
