"use client";

import { Pencil } from "@/components/icons";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveNeedsProfileAction, savePhaseModifiersAction } from "./actions";
import { AttributeBars } from "@/components/program/attribute-bars";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATTRIBUTES, ATTRIBUTE_LABEL, PHASES, PHASE_LABEL } from "@/lib/training";
import type { Tables, TrainingAttribute, TrainingPhase } from "@/lib/database.types";

type PositionOption = { id: string; name: string; sport: string };
type Needs = Tables<"position_needs_profiles">;
type Note = { position_id: string; attribute: TrainingAttribute; note: string };
type Modifier = Tables<"phase_attribute_modifiers">;

const vec = (n: Needs): Record<TrainingAttribute, number> => ({
  speed: n.attr_speed,
  strength: n.attr_strength,
  power: n.attr_power,
  agility: n.attr_agility,
  coordination: n.attr_coordination,
  conditioning: n.attr_conditioning,
  mobility: n.attr_mobility,
});

export function NeedsManager({ positions, needs, notes, modifiers }: { positions: PositionOption[]; needs: Needs[]; notes: Note[]; modifiers: Modifier[] }) {
  const [editing, setEditing] = useState<PositionOption | null>(null);

  return (
    <div className="flex flex-col gap-page">
      <div>
        <h1 className="text-title">Position needs</h1>
        <p className="mt-1 text-body text-muted">
          Each position&apos;s base needs across the 7 attributes. An athlete&apos;s effective needs start here, shift with their training phase (below) and get a boost for the areas they pick for extra focus.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {positions.map((p) => {
          const n = needs.find((x) => x.position_id === p.id);
          return (
            <div key={p.id} className="flex flex-col gap-3 surface-card p-card-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-subheading">{p.name}</p>
                  <p className="text-caption text-muted">
                    {p.sport}
                    {n?.rotational ? " · rotational power" : ""}
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                  <Pencil size={15} />
                </Button>
              </div>
              {n ? <AttributeBars values={vec(n)} compact /> : <p className="text-caption text-muted">No profile yet: defaults apply.</p>}
            </div>
          );
        })}
      </div>

      <PhaseModifiers modifiers={modifiers} />

      {editing && (
        <NeedsDialog
          key={editing.id}
          position={editing}
          needs={needs.find((n) => n.position_id === editing.id) ?? null}
          notes={notes.filter((n) => n.position_id === editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function NeedsDialog({ position, needs, notes, onClose }: { position: PositionOption; needs: Needs | null; notes: Note[]; onClose: () => void }) {
  const [values, setValues] = useState<Record<TrainingAttribute, number>>(needs ? vec(needs) : { speed: 5, strength: 5, power: 5, agility: 5, coordination: 5, conditioning: 5, mobility: 5 });
  const [rotational, setRotational] = useState(needs?.rotational ?? false);
  const [text, setText] = useState<Record<string, string>>(Object.fromEntries(notes.map((n) => [n.attribute, n.note])));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    start(async () => {
      const res = await saveNeedsProfileAction({ positionId: position.id, ...values, rotational, notes: text });
      if (res.error) setError(res.error);
      else {
        toast.success("Saved");
        onClose();
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {position.sport} · {position.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {ATTRIBUTES.map((a) => (
            <div key={a} className="flex flex-col gap-1">
              <label className="flex items-center gap-3 text-caption">
                <span className="w-24 shrink-0 font-semibold">{ATTRIBUTE_LABEL[a]}</span>
                <input type="range" min={0} max={10} value={values[a]} onChange={(e) => setValues((v) => ({ ...v, [a]: Number(e.target.value) }))} className="h-2 flex-1" />
                <span className="w-5 text-right tabular-nums">{values[a]}</span>
              </label>
              <Input
                value={text[a] ?? ""}
                maxLength={200}
                placeholder={`Why ${ATTRIBUTE_LABEL[a].toLowerCase()} matters for this position (one line)`}
                aria-label={`${ATTRIBUTE_LABEL[a]} note`}
                onChange={(e) => setText((t) => ({ ...t, [a]: e.target.value }))}
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-body">
            <input type="checkbox" checked={rotational} onChange={(e) => setRotational(e.target.checked)} />
            Needs rotational power work (throwing or swinging positions)
          </label>
          {error && (
            <p className="text-body text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={pending} onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhaseModifiers({ modifiers }: { modifiers: Modifier[] }) {
  const initial = Object.fromEntries(PHASES.map((p) => [p, Object.fromEntries(ATTRIBUTES.map((a) => [a, String(modifiers.find((m) => m.phase === p && m.attribute === a)?.modifier ?? 0)]))])) as Record<TrainingPhase, Record<TrainingAttribute, string>>;
  const [grid, setGrid] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    start(async () => {
      const res = await savePhaseModifiersAction(grid);
      if (res.error) setError(res.error);
      else toast.success("Phase modifiers saved");
    });
  }

  return (
    <section className="flex flex-col gap-3 surface-card p-card">
      <div>
        <h2 className="text-subheading">Training phase modifiers</h2>
        <p className="mt-1 text-caption text-muted">Added to every position&apos;s base needs for athletes in that phase (-5 to +5). Off-season leans strength and power; in-season leans mobility and recovery.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-caption">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-1 pr-2 font-semibold">Phase</th>
              {ATTRIBUTES.map((a) => (
                <th key={a} className="px-1 py-1 text-center font-semibold">
                  {ATTRIBUTE_LABEL[a]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHASES.map((p) => (
              <tr key={p} className="border-t border-border">
                <td className="py-1.5 pr-2 font-medium">{PHASE_LABEL[p]}</td>
                {ATTRIBUTES.map((a) => (
                  <td key={a} className="px-1 py-1">
                    <Label className="sr-only">{`${PHASE_LABEL[p]} ${ATTRIBUTE_LABEL[a]}`}</Label>
                    <Input
                      type="number"
                      min={-5}
                      max={5}
                      value={grid[p][a]}
                      aria-label={`${PHASE_LABEL[p]} ${ATTRIBUTE_LABEL[a]} modifier`}
                      className="h-9 px-1 text-center"
                      onChange={(e) => setGrid((g) => ({ ...g, [p]: { ...g[p], [a]: e.target.value } }))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p className="text-body text-danger" role="alert">
          {error}
        </p>
      )}
      <Button className="self-start" size="sm" loading={pending} onClick={save}>
        Save modifiers
      </Button>
    </section>
  );
}
