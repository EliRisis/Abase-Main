"use client";

import { PositionIcon, SportIcon } from "@/components/icons/app-icon";
import { ArrowLeft, ArrowRight, Check } from "@/components/icons";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import { completeOnboardingAction, type OnboardingActionResult } from "./actions";
import { DayChips } from "@/components/program/day-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultTrainingDays } from "@/lib/program/schedule";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/database.types";

const LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to structured training, or getting back into it.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Training consistently for 6+ months.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Years of structured training experience.",
  },
] as const;

const initialState: OnboardingActionResult = {};

export function OnboardingForm({
  sports,
  positions,
  defaultName,
}: {
  sports: Tables<"sports">[];
  positions: Tables<"positions">[];
  defaultName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    completeOnboardingAction,
    initialState,
  );
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(defaultName);
  const [sportId, setSportId] = useState<string | null>(null);
  const [positionId, setPositionId] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [trainingDays, setTrainingDays] = useState<number[]>(defaultTrainingDays(4));

  const positionsForSport = useMemo(
    () => positions.filter((p) => p.sport_id === sportId),
    [positions, sportId],
  );

  const steps = [
    { key: "name", label: "Name", valid: displayName.trim().length >= 2 },
    { key: "sport", label: "Sport", valid: !!sportId },
    { key: "position", label: "Position", valid: !!positionId },
    { key: "level", label: "Level", valid: !!level },
    { key: "days", label: "Days", valid: trainingDays.length >= 2 },
  ];
  const isLastStep = step === steps.length - 1;
  const canAdvance = steps[step].valid;

  function goNext() {
    if (!canAdvance) return;
    if (isLastStep) return;
    setStep((s) => s + 1);
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="displayName" value={displayName} />
      <input type="hidden" name="sportId" value={sportId ?? ""} />
      <input type="hidden" name="positionId" value={positionId ?? ""} />
      <input type="hidden" name="level" value={level ?? ""} />

      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "h-1.5 flex-1 transition-colors",
              i <= step ? "bg-primary" : "bg-surface-raised",
            )}
          />
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <div className="flex flex-col gap-2">
            <h1 className="text-title">
              What should we call you?
            </h1>
            <p className="mb-4 text-body text-muted">
              This shows up on your profile.
            </p>
            <Label htmlFor="displayNameInput">Name</Label>
            <Input
              id="displayNameInput"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jordan Smith"
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-2">
            <h1 className="text-title">
              What sport do you play?
            </h1>
            <p className="mb-4 text-body text-muted">
              We&apos;ll build your program for it.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => {
                    setSportId(sport.id);
                    if (positions.find((p) => p.id === positionId)?.sport_id !== sport.id) {
                      setPositionId(null);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-card border p-5 text-center transition",
                    sportId === sport.id
                      ? "border-primary bg-surface-raised ring-2 ring-primary"
                      : "border-border bg-surface hover:bg-surface-raised",
                  )}
                >
                  <SportIcon slug={sport.slug} name={sport.name} size={64} className="rounded-card" />
                  <span className="text-title">{sport.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2">
            <h1 className="text-title">
              What position?
            </h1>
            <p className="mb-4 text-body text-muted">
              Your program is built around what this position needs.
            </p>
            <div className="flex flex-col gap-2">
              {positionsForSport.map((position) => (
                <button
                  key={position.id}
                  type="button"
                  onClick={() => setPositionId(position.id)}
                  className={cn(
                    "flex items-center justify-between rounded-control border p-4 text-left transition",
                    positionId === position.id
                      ? "border-primary bg-surface-raised ring-2 ring-primary"
                      : "border-border bg-surface hover:bg-surface-raised",
                  )}
                >
                  <PositionIcon slug={position.slug} sportSlug={sports.find((s) => s.id === position.sport_id)?.slug} name={position.name} size={48} className="mr-3 rounded-card" />
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold">{position.name}</p>
                    {position.description && (
                      <p className="mt-0.5 text-caption text-muted">
                        {position.description}
                      </p>
                    )}
                  </div>
                  {positionId === position.id && (
                    <Check size={18} className="shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-2">
            <h1 className="text-title">
              Experience level?
            </h1>
            <p className="mb-4 text-body text-muted">
              We&apos;ll match the training load to where you&apos;re at.
            </p>
            <div className="flex flex-col gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className={cn(
                    "flex items-center justify-between rounded-control border p-4 text-left transition",
                    level === l.value
                      ? "border-primary bg-surface-raised ring-2 ring-primary"
                      : "border-border bg-surface hover:bg-surface-raised",
                  )}
                >
                  <div>
                    <p className="text-body font-semibold">{l.label}</p>
                    <p className="mt-0.5 text-caption text-muted">{l.description}</p>
                  </div>
                  {level === l.value && (
                    <Check size={18} className="shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-2">
            <h1 className="text-title">Which days can you train?</h1>
            <p className="mb-4 text-body text-muted">
              Your program builds a session for each one, the same days every week.
            </p>
            <DayChips value={trainingDays} onChange={setTrainingDays} />
          </div>
        )}
      </div>

      {state.error && (
        <p className="mt-4 text-body text-danger" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft size={18} />
          </Button>
        )}
        {isLastStep ? (
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            disabled={!canAdvance}
            loading={isPending}
          >
            Build my program
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="flex-1"
            disabled={!canAdvance}
            onClick={goNext}
          >
            Continue <ArrowRight size={18} />
          </Button>
        )}
      </div>
    </form>
  );
}
