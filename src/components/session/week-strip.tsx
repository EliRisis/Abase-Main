"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, ChevronRight } from "@/components/icons";
import { SessionIcon } from "@/components/session/session-ui";
import { Badge } from "@/components/ui/badge";
import { monthDayLabel } from "@/lib/program/schedule";
import type { Session } from "@/lib/program/sessions";
import { cn } from "@/lib/utils";

export interface StripDay {
  date: string;
  /** Which of this strip's tracks/sessions land on this date (empty = rest day). */
  sessions: Session[];
  done: boolean;
  game: boolean;
  practice: boolean;
  /** Where the chip links to (an anchor into the list below it, or a `?date=` page link). */
  href?: string;
}

const LETTER = (iso: string) => "SMTWTFS"[new Date(`${iso}T00:00:00Z`).getUTCDay()];

function chunk7(days: StripDay[]): StripDay[][] {
  const weeks: StripDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

/**
 * Sun-Sat, one 100%-width scroll-snap page per week. The visible week's date range and the
 * pager buttons live in this component's own header row, next to `editDays`. `days` must be
 * a flat array in multiples of 7, starting on a Sunday.
 */
export function WeekStrip({ days, today, selected, editDays }: { days: StripDay[]; today: string; selected?: string; editDays?: ReactNode }) {
  const weeks = chunk7(days);
  const target = selected ?? today;
  const found = weeks.findIndex((w) => w.some((d) => d.date === target));
  const [page, setPage] = useState(found === -1 ? 0 : found);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = page * el.clientWidth;
    // Only the initial position - manual scrolling and goTo() own it after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(weeks.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setPage(next);
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setPage((p) => (p === idx ? p : idx));
  };

  const visible = weeks[page] ?? weeks[0] ?? [];
  const range = visible.length ? `${monthDayLabel(visible[0].date)} – ${monthDayLabel(visible[visible.length - 1].date)}` : "";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-label text-muted">{range}</h2>
        <div className="flex items-center gap-2">
          {editDays}
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            className="flex h-6 w-6 items-center justify-center rounded-control border border-border text-foreground disabled:opacity-30"
          >
            <ChevronRight size={13} className="rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => goTo(page + 1)}
            disabled={page === weeks.length - 1}
            className="flex h-6 w-6 items-center justify-center rounded-control border border-border text-foreground disabled:opacity-30"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-label="Upcoming weeks">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid w-full shrink-0 snap-start grid-cols-7 gap-1.5" role="list">
            {week.map((d) => {
              const isToday = d.date === today;
              const isPast = d.date < today;
              const isSelected = !isToday && selected === d.date;
              const white = isToday ? "text-white" : undefined;
              const className = cn(
                "relative flex flex-col items-center gap-1 rounded-control border px-1 pb-2 pt-3",
                isToday ? "border-transparent bg-[#E5484D]" : isSelected ? "border-2 border-foreground bg-surface-raised" : "border-border bg-surface",
              );
              const content = (
                <>
                  <span className={cn("text-label", white ?? (isPast ? "text-muted" : "text-foreground"))}>{LETTER(d.date)}</span>
                  <span className={cn("text-stat-xs", white ?? "text-muted")}>{d.date.slice(8)}</span>
                  {isPast ? (
                    <span className="h-1.5 w-1.5 bg-border" />
                  ) : d.game ? (
                    <Badge variant="danger" className="px-1.5 py-0.5 text-label-sm">
                      Game
                    </Badge>
                  ) : d.done ? (
                    <CheckCircle2 size={16} className={white ?? "text-primary"} />
                  ) : d.sessions.length > 0 ? (
                    <span className={cn("flex gap-0.5", white ?? "text-foreground")}>
                      {d.sessions.map((s) => (
                        <SessionIcon key={s} session={s} size={14} />
                      ))}
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 bg-border" />
                  )}
                  {d.practice && <span className={cn("text-label-sm", white ?? "text-primary")}>Prac.</span>}
                </>
              );
              return !isPast && d.href ? (
                <a key={d.date} href={d.href} role="listitem" className={className}>
                  {content}
                </a>
              ) : (
                <div key={d.date} role="listitem" className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
