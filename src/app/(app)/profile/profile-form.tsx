"use client";

import { PositionLabel, SportLabel } from "@/components/icons/app-icon";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { updateProfileAction, type ProfileActionResult } from "./actions";
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
import type { Tables } from "@/lib/database.types";

const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const initialState: ProfileActionResult = {};

export function ProfileForm({
  profile,
  sports,
  positions,
}: {
  profile: Tables<"profiles">;
  sports: Tables<"sports">[];
  positions: Tables<"positions">[];
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [sportId, setSportId] = useState(profile.sport_id ?? "");
  const [positionId, setPositionId] = useState(profile.position_id ?? "");
  const [secondaryId, setSecondaryId] = useState(profile.secondary_position_id ?? "");
  const [level, setLevel] = useState(profile.level ?? "");

  const positionOptions = useMemo(
    () => positions.filter((p) => p.sport_id === sportId),
    [positions, sportId],
  );

  useEffect(() => {
    if (state.success) toast.success("Profile updated");
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-section">
      <div>
        <Label htmlFor="displayName">Name</Label>
        <Input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
        />
      </div>

      <div>
        <Label>Sport</Label>
        <Select
          value={sportId}
          onValueChange={(v) => {
            setSportId(v);
            setPositionId("");
            setSecondaryId("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <SportLabel slug={s.slug} name={s.name} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="sportId" value={sportId} />
      </div>

      <div>
        <Label>Position</Label>
        <Select
          value={positionId}
          onValueChange={(v) => {
            setPositionId(v);
            if (v === secondaryId) setSecondaryId("");
          }}
          disabled={!sportId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a position" />
          </SelectTrigger>
          <SelectContent>
            {positionOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <PositionLabel slug={p.slug} name={p.name} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="positionId" value={positionId} />
      </div>

      <div>
        <Label>Second position (optional)</Label>
        <Select value={secondaryId || "__none__"} onValueChange={(v) => setSecondaryId(v === "__none__" ? "" : v)} disabled={!sportId}>
          <SelectTrigger aria-label="Second position">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {positionOptions
              .filter((p) => p.id !== positionId)
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <PositionLabel slug={p.slug} name={p.name} />
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-caption text-muted">If you play more than one position, your program blends what both need.</p>
        <input type="hidden" name="secondaryPositionId" value={secondaryId} />
      </div>

      <div>
        <Label>Experience level</Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Choose your level" />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="level" value={level} />
      </div>

      {state.error && (
        <p className="text-body text-danger" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" loading={isPending} className="mt-1">
        Save changes
      </Button>
    </form>
  );
}
