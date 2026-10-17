"use client";

import { SportLabel } from "@/components/icons/app-icon";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "./actions";
import { Button } from "@/components/ui/button";
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
import type { Tables } from "@/lib/database.types";

const NONE = "none";
const LEVELS = ["beginner", "intermediate", "advanced"];
const emptyState: ActionResult = {};

export function WorkoutForm({
  workout,
  sports,
  positions,
  action,
  submitLabel = "Save",
}: {
  workout?: Tables<"workouts">;
  sports: Tables<"sports">[];
  positions: Tables<"positions">[];
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  submitLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [name, setName] = useState(workout?.name ?? "");
  const [slug, setSlug] = useState(workout?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!workout);
  const [sportId, setSportId] = useState(workout?.sport_id ?? NONE);
  const [positionId, setPositionId] = useState(workout?.position_id ?? NONE);
  const [level, setLevel] = useState(workout?.level ?? NONE);

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
        <Textarea
          id="description"
          name="description"
          defaultValue={workout?.description ?? ""}
          rows={2}
        />
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
          <Label htmlFor="estimatedMinutes">Est. minutes</Label>
          <Input
            id="estimatedMinutes"
            name="estimatedMinutes"
            type="number"
            min={1}
            max={300}
            defaultValue={workout?.estimated_minutes ?? ""}
          />
        </div>
      </div>

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
