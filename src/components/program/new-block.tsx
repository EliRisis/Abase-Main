"use client";

import { AlertTriangle } from "@/components/icons";
import { useActionState, useRef, useState } from "react";
import { generateProgramAction, type ActionResult } from "@/app/(app)/program/actions";
import { DayChips } from "@/components/program/day-chips";
import { FocusPicker, PositionPicker, type BuildDefaults, type PositionOption } from "@/components/program/program-fields";
import { SeasonPicker } from "@/components/program/season-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { defaultTrainingDays } from "@/lib/program/schedule";
import { EQUIPMENT, EQUIPMENT_HINT, EQUIPMENT_LABEL, LEVELS, LEVEL_LABEL, PHASE_LABEL, SESSION_MINUTE_OPTIONS } from "@/lib/training";
import { generateProgramSchema } from "@/lib/validations/program";
import type { EquipmentAccess, ExperienceLevel, TrainingAttribute, TrainingPhase } from "@/lib/database.types";

const initialState: ActionResult = {};

export interface CurrentBlock {
  phase: TrainingPhase;
  week: number;
  weeks: number;
  finished: boolean;
}

/**
 * START A NEW TRAINING BLOCK. Regenerates the whole program from scratch. When a program is
 * running, submitting opens a confirmation that says exactly what happens to it (archived, not
 * deleted, kept in History) and the server refuses to continue without that confirmation.
 */
export function NewBlockForm({
  positions,
  defaults,
  currentPhase,
  initialFocus = [],
  current,
  onCancel,
}: {
  positions: PositionOption[];
  defaults: BuildDefaults;
  currentPhase: TrainingPhase;
  initialFocus?: TrainingAttribute[];
  /** The running block, when there is one. */
  current: CurrentBlock | null;
  onCancel?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(generateProgramAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [phase, setPhase] = useState<TrainingPhase>(currentPhase);
  const [focus, setFocus] = useState<TrainingAttribute[]>(initialFocus);
  const [positionId, setPositionId] = useState(defaults.positionId ?? positions[0]?.id ?? "");
  const [secondaryId, setSecondaryId] = useState<string | null>(defaults.secondaryPositionId);
  const [level, setLevel] = useState<ExperienceLevel>(defaults.level ?? "intermediate");
  const [equipment, setEquipment] = useState<EquipmentAccess>(defaults.equipmentAccess ?? "full_gym");
  const [trainingDays, setTrainingDays] = useState<number[]>(defaults.trainingDays ?? defaultTrainingDays(defaults.daysPerWeek ?? 4));
  const [minutes, setMinutes] = useState<number>(defaults.sessionMinutes ?? 60);
  const [clientError, setClientError] = useState<string | null>(null);

  function check(): string | null {
    const parsed = generateProgramSchema.safeParse({ phase, emphasis: focus, positionId, secondaryPositionId: secondaryId, level, equipmentAccess: equipment, trainingDays, sessionMinutes: minutes });
    if (!parsed.success) return parsed.error.issues[0]?.message ?? "Check your answers.";
    if (secondaryId && secondaryId === positionId) return "Your second position has to be different from your main one.";
    return null;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const msg = check();
    setClientError(msg);
    if (msg) return e.preventDefault();
    // With a running program the athlete has to confirm the archive first.
    if (current && confirmRef.current?.value !== "yes") {
      e.preventDefault();
      setConfirming(true);
    }
  }

  function confirmArchive() {
    if (confirmRef.current) confirmRef.current.value = "yes";
    setConfirming(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={formAction} onSubmit={onSubmit} className="flex flex-col gap-section surface-card p-card">
        <div>
          <h2 className="text-heading">{current ? "Start a new training block" : "Build my program"}</h2>
          <p className="mt-1 text-caption text-muted">
            {current
              ? "A full rebuild from today. Your current program is archived, not deleted, and stays under History. Your logged weights carry over."
              : "A weekly plan built around what your position needs, split into weight-room, field and recovery sessions."}
          </p>
        </div>

        <PositionPicker positions={positions} positionId={positionId} setPositionId={setPositionId} secondaryId={secondaryId} setSecondaryId={setSecondaryId} />

        <div className="flex flex-col gap-1.5">
          <span className="text-label text-muted">Where are you in your season?</span>
          <SeasonPicker value={phase} onChange={setPhase} />
          <input type="hidden" name="phase" value={phase} />
        </div>

        <div className="grid gap-section sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Segmented label="Training experience" value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: LEVEL_LABEL[l] }))} />
          </div>
          <div className="sm:col-span-2">
            <Segmented label="Equipment" value={equipment} onChange={setEquipment} options={EQUIPMENT.map((e) => ({ value: e, label: EQUIPMENT_LABEL[e], hint: EQUIPMENT_HINT[e] }))} />
          </div>
          <Segmented label="Typical session length" value={minutes} onChange={setMinutes} options={SESSION_MINUTE_OPTIONS.map((m) => ({ value: m, label: `${m} min` }))} />
        </div>
        <div>
          <span className="text-label text-muted">Which days can you train?</span>
          <div className="mt-1.5">
            <DayChips value={trainingDays} onChange={setTrainingDays} />
          </div>
        </div>
        <p className="-mt-2 text-caption text-muted">{EQUIPMENT_HINT[equipment]}. Gym gets one session per day you pick; field is its own schedule.</p>
        <input type="hidden" name="level" value={level} />
        <input type="hidden" name="equipmentAccess" value={equipment} />
        <input type="hidden" name="sessionMinutes" value={minutes} />
        <input ref={confirmRef} type="hidden" name="confirmArchive" defaultValue="" />

        <FocusPicker focus={focus} setFocus={setFocus} />

        {(clientError || state.error) && (
          <p className="text-body text-danger" role="alert">
            {clientError ?? state.error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isPending}>
            {current ? "Start new block" : "Build my program"}
          </Button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-label text-muted hover:text-foreground">
              Cancel
            </button>
          )}
        </div>
      </form>

      {current && (
        <Dialog open={confirming} onOpenChange={setConfirming}>
          <DialogContent>
            <div className="flex items-start gap-3">
              <AlertTriangle size={24} className="mt-1 shrink-0 text-warning" />
              <div className="flex flex-col gap-3">
                <DialogTitle>Start a new block?</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-col gap-2 text-body text-muted">
                    <p>
                      Your current program ({PHASE_LABEL[current.phase]}, {current.finished ? `all ${current.weeks} weeks` : `week ${current.week} of ${current.weeks}`}) will be <strong className="text-foreground">archived, not deleted</strong>.
                    </p>
                    <ul className="list-disc pl-5">
                      <li>It stays under History with every session you logged.</li>
                      <li>A brand-new program is generated from today.</li>
                      <li>Your logged weights carry over, so targets keep progressing.</li>
                    </ul>
                    <p>If you only want to change position, season or focus, cancel and use Adjust program instead. That keeps this block running.</p>
                  </div>
                </DialogDescription>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button onClick={confirmArchive}>Archive and start new block</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
