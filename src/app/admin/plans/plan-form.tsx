"use client";

import { SportLabel } from "@/components/icons/app-icon";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/validations/content";
import { CATEGORIES, CATEGORY_LABEL, INTENSITIES, INTENSITY_LABEL, PHASES, PHASE_LABEL } from "@/lib/training";
import type { ModuleCategory, TrainingPhase, Tables } from "@/lib/database.types";

const NONE = "none";
const LEVELS = ["beginner", "intermediate", "advanced"];
const emptyState: ActionResult = {};

export function PlanForm({
  plan,
  sports,
  positions,
  action,
  submitLabel = "Save",
}: {
  plan?: Tables<"plans">;
  sports: Tables<"sports">[];
  positions: Tables<"positions">[];
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [name, setName] = useState(plan?.name ?? "");
  const [slug, setSlug] = useState(plan?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!plan);
  const [sportId, setSportId] = useState(plan?.sport_id ?? NONE);
  const [positionId, setPositionId] = useState(plan?.position_id ?? NONE);
  const [level, setLevel] = useState(plan?.level ?? NONE);
  const [published, setPublished] = useState(plan?.published ?? true);
  const [category, setCategory] = useState<ModuleCategory>(plan?.category ?? "strength");
  const [secondaryCategory, setSecondaryCategory] = useState(plan?.secondary_category ?? NONE);
  const [intensity, setIntensity] = useState(plan?.intensity ?? "moderate");
  const [phases, setPhases] = useState<TrainingPhase[]>(
    plan?.phases ?? ["off_season", "pre_season", "in_season", "post_season"],
  );

  function togglePhase(p: TrainingPhase) {
    setPhases((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  const positionOptions = useMemo(
    () => positions.filter((p) => p.sport_id === sportId),
    [positions, sportId],
  );

  useEffect(() => {
    if (state.success) toast.success("Saved");
  }, [state]);

  return (
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
        <Textarea id="description" name="description" defaultValue={plan?.description ?? ""} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Sport</Label>
          <Select
            value={sportId}
            onValueChange={(v) => {
              setSportId(v);
              setPositionId(NONE);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Any sport</SelectItem>
              {sports.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <SportLabel slug={s.slug} name={s.name} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="sportId" value={sportId === NONE ? "" : sportId} />
        </div>
        <div>
          <Label>Position</Label>
          <Select value={positionId} onValueChange={setPositionId} disabled={sportId === NONE}>
            <SelectTrigger>
              <SelectValue placeholder="Any position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Any position</SelectItem>
              {positionOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="hidden"
            name="positionId"
            value={positionId === NONE ? "" : positionId}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ModuleCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="category" value={category} />
        </div>
        <div>
          <Label>Secondary category (optional)</Label>
          <Select value={secondaryCategory ?? NONE} onValueChange={setSecondaryCategory}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {CATEGORIES.filter((c) => c !== category).map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="hidden"
            name="secondaryCategory"
            value={secondaryCategory === NONE ? "" : secondaryCategory ?? ""}
          />
        </div>
      </div>

      <div>
        <Label>Intensity</Label>
        <Select value={intensity ?? "moderate"} onValueChange={(v) => setIntensity(v as "low" | "moderate" | "high")}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTENSITIES.map((i) => (
              <SelectItem key={i} value={i}>
                {INTENSITY_LABEL[i]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="intensity" value={intensity ?? "moderate"} />
      </div>

      <div>
        <Label>Training phases this module fits</Label>
        <div className="flex flex-wrap gap-3">
          {PHASES.map((p) => (
            <label key={p} className="flex items-center gap-2 text-body">
              <Checkbox checked={phases.includes(p)} onCheckedChange={() => togglePhase(p)} />
              {PHASE_LABEL[p]}
              <input type="hidden" name="phases" value={phases.includes(p) ? p : ""} />
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Level</Label>
          <Select value={level ?? NONE} onValueChange={setLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Any level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Any level</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l[0].toUpperCase() + l.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="level" value={level === NONE ? "" : level ?? ""} />
        </div>
        <div>
          <Label htmlFor="weeks">Weeks</Label>
          <Input
            id="weeks"
            name="weeks"
            type="number"
            min={1}
            max={52}
            defaultValue={plan?.weeks ?? 4}
            required
          />
        </div>
        <div>
          <Label htmlFor="daysPerWeek">Days / week</Label>
          <Input
            id="daysPerWeek"
            name="daysPerWeek"
            type="number"
            min={1}
            max={7}
            defaultValue={plan?.days_per_week ?? 3}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-body font-medium">
        <Checkbox
          checked={published}
          onCheckedChange={(v) => setPublished(v === true)}
        />
        Published (visible to athletes)
        <input type="hidden" name="published" value={published ? "on" : ""} />
      </label>

      {state.error && (
        <p className="text-body text-danger" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" loading={isPending} className="mt-1 self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
