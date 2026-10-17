"use client";

import { Calendar, SlidersHorizontal } from "@/components/icons";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AdjustProgram } from "@/components/program/adjust-program";
import { NewBlockForm, type CurrentBlock } from "@/components/program/new-block";
import type { BuildDefaults, PositionOption } from "@/components/program/program-fields";
import { Button } from "@/components/ui/button";
import { defaultTrainingDays } from "@/lib/program/schedule";
import type { TrainingAttribute, TrainingPhase } from "@/lib/database.types";

/**
 * The two ways to change a running program, kept deliberately separate:
 *   Adjust program  -> small changes, applied instantly, history and progress preserved
 *   New block       -> full regeneration, behind a confirmation, current program archived
 */
export function ProgramControls({
  positions,
  defaults,
  phase,
  focus,
  current,
  summary,
  archivedCount,
}: {
  positions: PositionOption[];
  defaults: BuildDefaults;
  phase: TrainingPhase;
  focus: TrainingAttribute[];
  current: CurrentBlock;
  summary: string;
  archivedCount: number;
}) {
  const [mode, setMode] = useState<"adjust" | "block" | null>(current.finished ? "block" : null);
  const close = useCallback(() => setMode(current.finished ? "block" : null), [current.finished]);

  return (
    <div className="flex flex-col gap-section">
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 px-card-sm py-3">
        <p className="min-w-0 text-body text-muted">{summary}</p>
        <div className="flex flex-wrap items-center gap-2">
          {!current.finished && (
            <Button variant={mode === "adjust" ? "primary" : "outline"} size="sm" onClick={() => setMode(mode === "adjust" ? null : "adjust")}>
              <SlidersHorizontal size={14} /> Adjust program
            </Button>
          )}
          <Button variant={mode === "block" ? "primary" : "outline"} size="sm" onClick={() => setMode(mode === "block" ? null : "block")}>
            <Calendar size={14} /> New training block
          </Button>
        </div>
      </div>

      {mode === "adjust" && (
        <AdjustProgram
          positions={positions}
          initial={{ positionId: defaults.positionId ?? positions[0]?.id ?? "", secondaryId: defaults.secondaryPositionId, phase, focus, trainingDays: defaults.trainingDays ?? defaultTrainingDays(defaults.daysPerWeek ?? 4) }}
          onDone={close}
        />
      )}
      {mode === "block" && <NewBlockForm positions={positions} defaults={defaults} currentPhase={phase} initialFocus={focus} current={current} onCancel={current.finished ? undefined : close} />}

      {archivedCount > 0 && (
        <Link href="/program/history" className="text-label text-muted hover:text-foreground">
          History · {archivedCount} archived block{archivedCount === 1 ? "" : "s"} →
        </Link>
      )}
    </div>
  );
}
