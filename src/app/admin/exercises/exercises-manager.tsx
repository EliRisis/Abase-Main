"use client";

import { Pencil, Plus, Search, Bolt, Trash2 } from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { createExerciseAction, deleteExerciseAction, updateExerciseAction, type ActionResult } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { suggestExerciseTags, vectorFromRow, type AttributeVector } from "@/lib/program/attributes";
import {
  ATTRIBUTES,
  ATTRIBUTE_LABEL,
  BODY_AREAS,
  BODY_AREA_LABEL,
  EQUIPMENT,
  EQUIPMENT_LABEL,
  LEVELS,
  LEVEL_LABEL,
  MOVEMENT_PATTERNS,
  PATTERN_LABEL,
  PRESCRIPTION_MODES,
  PRESCRIPTION_MODE_LABEL,
} from "@/lib/training";
import { slugify } from "@/lib/validations/content";
import type { LimitationBodyArea, MovementPattern, PrescriptionMode, Tables, TrainingAttribute } from "@/lib/database.types";

const emptyState: ActionResult = {};
type PositionOption = { id: string; name: string; sport: string };
type Scope = { exercise_id: string; position_id: string };
type Rx = Tables<"exercise_role_prescriptions">;
const NONE = "__none__";
type Setting = "weight_room" | "field" | "either";
const SETTING_LABEL: Record<Setting, string> = { weight_room: "Weight room", field: "Field", either: "Either (warm-up, core, mobility)" };
const WEIGHT_GEAR = /barbell|dumbbell|kettlebell|machine|cable|rack|bench|sled|med(icine)? ball|box|trap bar|plate|landmine|bands?/i;

/** Where an exercise is most likely done, from what it is and what it needs. Only a starting point for the admin. */
function suggestSetting(mode: PrescriptionMode, pattern: MovementPattern | null, equipment: string): Setting {
  if (pattern === "mobility") return "either";
  if (mode === "loaded" || WEIGHT_GEAR.test(equipment)) return "weight_room";
  return "field";
}

export function ExercisesManager({
  exercises,
  positions,
  scope,
  rolePrescriptions,
}: {
  exercises: Tables<"exercises">[];
  positions: PositionOption[];
  scope: Scope[];
  rolePrescriptions: Rx[];
}) {
  const [editing, setEditing] = useState<Tables<"exercises"> | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [patternFilter, setPatternFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter((e) => {
      if (patternFilter !== "all" && (e.movement_pattern ?? NONE) !== patternFilter) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q) || e.muscle_groups.some((m) => m.toLowerCase().includes(q));
    });
  }, [exercises, search, patternFilter]);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Exercises</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} /> Add exercise
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." className="pl-10" />
        </div>
        <Select value={patternFilter} onValueChange={setPatternFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All movement patterns</SelectItem>
            {MOVEMENT_PATTERNS.map((p) => (
              <SelectItem key={p} value={p}>
                {PATTERN_LABEL[p]}
              </SelectItem>
            ))}
            <SelectItem value={NONE}>No pattern</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col divide-y divide-border surface-card">
        {filtered.length === 0 && <p className="p-6 text-center text-body text-muted">No exercises found.</p>}
        {filtered.map((exercise) => {
          const v = vectorFromRow(exercise);
          const top = [...ATTRIBUTES].sort((a, b) => v[b] - v[a]).slice(0, 3);
          return (
            <div key={exercise.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="text-body font-semibold">{exercise.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant={exercise.setting === "weight_room" ? "primary" : "default"}>{SETTING_LABEL[exercise.setting === "recovery" ? "either" : exercise.setting].split(" (")[0]}</Badge>
                  {exercise.movement_pattern && <Badge>{PATTERN_LABEL[exercise.movement_pattern]}</Badge>}
                  {top.map((a) => (
                    <Badge key={a} variant="primary">
                      {ATTRIBUTE_LABEL[a]} {v[a]}
                    </Badge>
                  ))}
                  {scope.some((s) => s.exercise_id === exercise.id) && <Badge variant="default">Position-specific</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" aria-label={`Edit ${exercise.name}`} onClick={() => setEditing(exercise)}>
                  <Pencil size={15} />
                </Button>
                <DeleteButton id={exercise.id} name={exercise.name} />
              </div>
            </div>
          );
        })}
      </div>

      {creating && (
        <ExerciseDialog open onOpenChange={setCreating} title="Add exercise" action={createExerciseAction} positions={positions} scopeIds={[]} rx={[]} />
      )}
      {editing && (
        <ExerciseDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title="Edit exercise"
          exercise={editing}
          action={updateExerciseAction.bind(null, editing.id)}
          positions={positions}
          scopeIds={scope.filter((s) => s.exercise_id === editing.id).map((s) => s.position_id)}
          rx={rolePrescriptions.filter((r) => r.exercise_id === editing.id)}
        />
      )}
    </div>
  );
}

function DeleteButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteExerciseAction(id);
    setPending(false);
    setOpen(false);
    if (result.error) toast.error(result.error);
    else toast.success(`${name} deleted`);
  }

  return (
    <>
      <Button variant="ghost" size="icon" aria-label={`Delete ${name}`} onClick={() => setOpen(true)}>
        <Trash2 size={15} className="text-danger" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
          </DialogHeader>
          <p className="text-body text-muted">Exercises used in a workout can&apos;t be deleted until removed from that workout.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={pending} onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExerciseDialog({
  open,
  onOpenChange,
  title,
  exercise,
  action,
  positions,
  scopeIds,
  rx,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  exercise?: Tables<"exercises">;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  positions: PositionOption[];
  scopeIds: string[];
  rx: Rx[];
}) {
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const isNew = !exercise;
  const [name, setName] = useState(exercise?.name ?? "");
  const [slug, setSlug] = useState(exercise?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!exercise);
  const [description, setDescription] = useState(exercise?.description ?? "");
  const [muscles, setMuscles] = useState(exercise?.muscle_groups?.join(", ") ?? "");
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");

  // New exercises show live auto-suggested tags until the admin touches a control; then their values win.
  const suggestion = useMemo(
    () => suggestExerciseTags({ name, description, muscleGroups: muscles.split(",").map((m) => m.trim()).filter(Boolean), equipment }),
    [name, description, muscles, equipment],
  );
  const [touched, setTouched] = useState(!isNew);
  const [attrs, setAttrs] = useState<AttributeVector>(exercise ? vectorFromRow(exercise) : suggestion.attrs);
  const [pattern, setPattern] = useState<MovementPattern | null>(exercise?.movement_pattern ?? null);
  const [mode, setMode] = useState<PrescriptionMode>(exercise?.prescription_mode ?? "bodyweight");
  const [areas, setAreas] = useState<LimitationBodyArea[]>(exercise?.loaded_areas ?? []);
  const [scoped, setScoped] = useState<string[]>(scopeIds);
  const [setting, setSetting] = useState<Setting | null>(exercise ? (exercise.setting === "recovery" ? "either" : exercise.setting) : null);
  const [tier, setTier] = useState(exercise?.equipment_tier ?? "bodyweight");
  const [minLevel, setMinLevel] = useState(exercise?.min_level ?? "beginner");
  const [confirmed, setConfirmed] = useState(false);

  const shownAttrs = touched ? attrs : suggestion.attrs;
  const shownPattern = touched ? pattern : suggestion.pattern;
  const shownMode = touched ? mode : suggestion.mode;
  const shownAreas = touched ? areas : suggestion.loadedAreas;
  const shownSetting: Setting = setting ?? suggestSetting(shownMode, shownPattern, equipment);

  function freeze() {
    if (touched) return;
    setAttrs(suggestion.attrs);
    setPattern(suggestion.pattern);
    setMode(suggestion.mode);
    setAreas(suggestion.loadedAreas);
    setTouched(true);
  }
  function useSuggestion() {
    setAttrs(suggestion.attrs);
    setPattern(suggestion.pattern);
    setMode(suggestion.mode);
    setAreas(suggestion.loadedAreas);
    setTouched(true);
    toast.success("Suggested tags applied. Review them before saving.");
  }

  useEffect(() => {
    if (state.success) {
      toast.success("Saved");
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const rxFor = (role: TrainingAttribute) => rx.find((r) => r.role === role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-section">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="equipment">Equipment</Label>
              <Input id="equipment" name="equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Barbell" />
            </div>
            <div>
              <Label htmlFor="muscleGroups">Muscle groups</Label>
              <Input id="muscleGroups" name="muscleGroups" value={muscles} onChange={(e) => setMuscles(e.target.value)} placeholder="Quads, Glutes" />
            </div>
          </div>

          <fieldset className="flex flex-col gap-3 rounded-control border border-border p-4">
            <legend className="text-label px-1">Where it is done</legend>
            <p className="text-caption text-muted">Sessions are built per room: weight-room work goes in the gym session, field work in the field session. &quot;Either&quot; rides along with whichever session it sits in.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Setting</Label>
                <Select value={shownSetting} onValueChange={(v) => setSetting(v as Setting)}>
                  <SelectTrigger aria-label="Setting">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SETTING_LABEL) as Setting[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {SETTING_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="setting" value={shownSetting} />
              </div>
              <div>
                <Label>Equipment level</Label>
                <Select value={tier} onValueChange={(v) => setTier(v as typeof tier)}>
                  <SelectTrigger aria-label="Equipment level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT.map((e) => (
                      <SelectItem key={e} value={e}>
                        {EQUIPMENT_LABEL[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="equipmentTier" value={tier} />
              </div>
              <div>
                <Label>Lowest level</Label>
                <Select value={minLevel} onValueChange={(v) => setMinLevel(v as typeof minLevel)}>
                  <SelectTrigger aria-label="Lowest level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {LEVEL_LABEL[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="minLevel" value={minLevel} />
              </div>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-control border border-border p-4">
            <legend className="text-label px-1">Training attributes (0-10)</legend>
            <div className="flex items-center justify-between gap-3">
              <p className="text-caption text-muted">
                {touched
                  ? "How much this exercise develops each quality. Used to score it against an athlete's needs."
                  : `Auto-suggested (${suggestion.confidence === "matched" ? suggestion.basis : "no match: neutral placeholders"}). Review and adjust.`}
              </p>
              {touched && (
                <Button type="button" size="sm" variant="secondary" onClick={useSuggestion}>
                  <Bolt size={14} /> Re-suggest
                </Button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ATTRIBUTES.map((a) => (
                <label key={a} className="flex items-center gap-2 text-caption">
                  <span className="w-24 shrink-0 font-medium">{ATTRIBUTE_LABEL[a]}</span>
                  <input
                    type="range"
                    name={`attr_${a}`}
                    min={0}
                    max={10}
                    step={1}
                    value={shownAttrs[a]}
                    onChange={(e) => {
                      freeze();
                      setAttrs((prev) => ({ ...(touched ? prev : suggestion.attrs), [a]: Number(e.target.value) }));
                    }}
                    className="h-2 flex-1 accent-[var(--color-primary)]"
                  />
                  <span className="w-5 text-right tabular-nums">{shownAttrs[a]}</span>
                </label>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Movement pattern</Label>
                <Select
                  value={shownPattern ?? NONE}
                  onValueChange={(v) => {
                    freeze();
                    setPattern(v === NONE ? null : (v as MovementPattern));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {MOVEMENT_PATTERNS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PATTERN_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="pattern" value={shownPattern ?? ""} />
              </div>
              <div>
                <Label>Prescribed as</Label>
                <Select
                  value={shownMode}
                  onValueChange={(v) => {
                    freeze();
                    setMode(v as PrescriptionMode);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESCRIPTION_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PRESCRIPTION_MODE_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="mode" value={shownMode} />
              </div>
            </div>

            <div>
              <Label>Heavily loads (used when an athlete asks to go easy on an area)</Label>
              <div className="flex flex-wrap gap-2">
                {BODY_AREAS.map((a) => {
                  const on = shownAreas.includes(a);
                  return (
                    <label key={a} className={`flex cursor-pointer items-center gap-1.5 rounded-chip border px-2.5 py-1.5 text-caption ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                      <input
                        type="checkbox"
                        name="loadedAreas"
                        value={a}
                        checked={on}
                        onChange={() => {
                          freeze();
                          setAreas((prev) => {
                            const base = touched ? prev : suggestion.loadedAreas;
                            return base.includes(a) ? base.filter((x) => x !== a) : [...base, a];
                          });
                        }}
                      />
                      {BODY_AREA_LABEL[a]}
                    </label>
                  );
                })}
              </div>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2 rounded-control border border-border p-4">
            <legend className="text-label px-1">Only for these positions (optional)</legend>
            <p className="text-caption text-muted">Leave empty to make this exercise available to every position.</p>
            <div className="grid max-h-40 gap-1 overflow-y-auto sm:grid-cols-2">
              {positions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-caption">
                  <input
                    type="checkbox"
                    name="positionIds"
                    value={p.id}
                    checked={scoped.includes(p.id)}
                    onChange={() => setScoped((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))}
                  />
                  {p.sport} · {p.name}
                </label>
              ))}
            </div>
          </fieldset>

          <details className="rounded-control border border-border p-4">
            <summary className="cursor-pointer text-subheading">Role-specific prescriptions (optional)</summary>
            <p className="my-2 text-caption text-muted">
              Override sets/reps when this exercise fills a given role, e.g. a squat as heavy 4 × 3-5 in a strength slot vs explosive 4 × 3 in a power slot. Blank rows use the defaults.
            </p>
            <div className="flex flex-col gap-2">
              {ATTRIBUTES.map((a) => {
                const r = rxFor(a);
                return (
                  <div key={a} className="grid grid-cols-[6rem_1fr_1fr_1fr_1fr] items-center gap-2 text-caption">
                    <span className="font-medium">{ATTRIBUTE_LABEL[a]}</span>
                    <Input name={`rx_${a}_sets`} type="number" min={1} max={20} defaultValue={r?.sets ?? ""} placeholder="Sets" aria-label={`${a} sets`} />
                    <Input name={`rx_${a}_reps`} defaultValue={r?.reps ?? ""} maxLength={40} placeholder="Reps" aria-label={`${a} reps`} />
                    <Input name={`rx_${a}_load`} type="number" min={0} max={100} defaultValue={r?.load_pct ?? ""} placeholder="% max" aria-label={`${a} load percent`} />
                    <Input name={`rx_${a}_tempo`} defaultValue={r?.tempo ?? ""} maxLength={40} placeholder="Tempo" aria-label={`${a} tempo`} />
                  </div>
                );
              })}
            </div>
          </details>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input id="videoUrl" name="videoUrl" type="url" defaultValue={exercise?.video_url ?? ""} placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" type="url" defaultValue={exercise?.image_url ?? ""} placeholder="https://..." />
            </div>
          </div>

          {isNew && (
            <label className="flex items-start gap-2 surface-inset p-3 text-body">
              <input type="checkbox" name="tagsConfirmed" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
              <span>I&apos;ve reviewed the attribute weights, movement pattern and loaded areas above.</span>
            </label>
          )}

          {state.error && (
            <p className="text-body text-danger" role="alert">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending} disabled={isNew && !confirmed}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
