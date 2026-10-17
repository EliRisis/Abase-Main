"use client";

import { PositionIcon, PositionLabel } from "@/components/icons/app-icon";
import { ATTRIBUTE_ICON, Pencil, Plus, X } from "@/components/icons";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ATTRIBUTES, ATTRIBUTE_HINT, ATTRIBUTE_LABEL } from "@/lib/training";
import { cn } from "@/lib/utils";
import type { EquipmentAccess, ExperienceLevel, TrainingAttribute } from "@/lib/database.types";

export const MAX_FOCUS = 2;
const NONE = "__none__";

export interface BuildDefaults {
  positionId: string | null;
  secondaryPositionId: string | null;
  level: ExperienceLevel | null;
  equipmentAccess: EquipmentAccess | null;
  daysPerWeek: number | null;
  trainingDays: number[] | null;
  sessionMinutes: number | null;
}

export interface PositionOption {
  id: string;
  name: string;
  slug: string;
}

/** Main + optional second position. Emits hidden inputs, so it works inside either form. */
export function PositionPicker({
  positions,
  positionId,
  setPositionId,
  secondaryId,
  setSecondaryId,
}: {
  positions: PositionOption[];
  positionId: string;
  setPositionId: (id: string) => void;
  secondaryId: string | null;
  setSecondaryId: (id: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const nameOf = (id: string | null) => positions.find((p) => p.id === id)?.name ?? "your position";
  const slugOf = (id: string | null) => positions.find((p) => p.id === id)?.slug;

  return (
    <div className="flex flex-col gap-2 surface-inset p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-body">
          <PositionIcon slug={slugOf(positionId)} name={nameOf(positionId)} size={32} className="rounded-control" />
          <span className="font-bold">{nameOf(positionId)}</span>
          {secondaryId && (
            <>
              <span className="text-muted">+</span>
              <PositionIcon slug={slugOf(secondaryId)} name={nameOf(secondaryId)} size={22} className="rounded-chip" />
              <span className="font-bold">{nameOf(secondaryId)}</span>
            </>
          )}
        </p>
        <button type="button" onClick={() => setEditing((v) => !v)} className="inline-flex items-center gap-1 text-label text-primary">
          <Pencil size={12} /> {editing ? "Done" : "Change"}
        </button>
      </div>
      {editing && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label>Main position</Label>
            <Select
              value={positionId}
              onValueChange={(v) => {
                setPositionId(v);
                if (v === secondaryId) setSecondaryId(null);
              }}
            >
              <SelectTrigger aria-label="Main position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <PositionLabel slug={p.slug} name={p.name} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Second position (optional)</Label>
            <Select value={secondaryId ?? NONE} onValueChange={(v) => setSecondaryId(v === NONE ? null : v)}>
              <SelectTrigger aria-label="Second position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {positions
                  .filter((p) => p.id !== positionId)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <PositionLabel slug={p.slug} name={p.name} />
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {!editing && !secondaryId && (
        <button type="button" onClick={() => setEditing(true)} className="inline-flex w-fit items-center gap-1 text-caption text-muted hover:text-foreground">
          <Plus size={12} /> Play a second position?
        </button>
      )}
      {!editing && secondaryId && (
        <button type="button" onClick={() => setSecondaryId(null)} className="inline-flex w-fit items-center gap-1 text-caption text-muted hover:text-foreground">
          <X size={12} /> Remove second position
        </button>
      )}
      <input type="hidden" name="positionId" value={positionId} />
      <input type="hidden" name="secondaryPositionId" value={secondaryId ?? ""} />
    </div>
  );
}

/** Up to two areas that get extra time. Every area stays in the program either way. */
export function FocusPicker({ focus, setFocus }: { focus: TrainingAttribute[]; setFocus: (f: TrainingAttribute[]) => void }) {
  const atLimit = focus.length >= MAX_FOCUS;
  const toggle = (a: TrainingAttribute) => setFocus(focus.includes(a) ? focus.filter((x) => x !== a) : atLimit ? focus : [...focus, a]);
  return (
    <fieldset>
      <legend className="text-label mb-1 text-muted">Extra focus (optional)</legend>
      <p className="mb-3 text-caption text-muted">
        Every area is always in your program, so nothing gets dropped. Pick up to {MAX_FOCUS} that get <strong>extra</strong> time.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ATTRIBUTES.map((a) => {
          const on = focus.includes(a);
          const Icon = ATTRIBUTE_ICON[a];
          return (
            <button
              key={a}
              type="button"
              aria-pressed={on}
              disabled={!on && atLimit}
              onClick={() => toggle(a)}
              title={ATTRIBUTE_HINT[a]}
              className={cn(
                "flex items-center gap-2 rounded-control border px-3 py-2.5 text-left transition disabled:opacity-40",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-surface-raised",
              )}
            >
              <Icon size={18} />
              <span className="text-label">{ATTRIBUTE_LABEL[a]}</span>
            </button>
          );
        })}
      </div>
      {focus.map((a) => (
        <input key={a} type="hidden" name="emphasis" value={a} />
      ))}
    </fieldset>
  );
}
