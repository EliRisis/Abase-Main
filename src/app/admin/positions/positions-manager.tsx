"use client";

import { SportLabel } from "@/components/icons/app-icon";
import { Pencil, Plus, Trash2 } from "@/components/icons";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  createPositionAction,
  deletePositionAction,
  updatePositionAction,
  type ActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const emptyState: ActionResult = {};

const NONE = "none";

export function PositionsManager({
  positions,
  sports,
  archetypes,
}: {
  positions: Tables<"positions">[];
  sports: Tables<"sports">[];
  archetypes: Tables<"position_archetypes">[];
}) {
  const [editing, setEditing] = useState<Tables<"positions"> | null>(null);
  const [creating, setCreating] = useState(false);
  const sportById = useMemo(() => new Map(sports.map((s) => [s.id, s])), [sports]);
  const archetypeById = useMemo(() => new Map(archetypes.map((a) => [a.id, a])), [archetypes]);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Positions</h1>
        <Button onClick={() => setCreating(true)} disabled={sports.length === 0}>
          <Plus size={16} /> Add position
        </Button>
      </div>
      {sports.length === 0 && (
        <p className="text-body text-muted">Add a sport first before adding positions.</p>
      )}

      <div className="flex flex-col divide-y divide-border surface-card">
        {positions.length === 0 && (
          <p className="p-6 text-center text-body text-muted">No positions yet.</p>
        )}
        {positions.map((position) => (
          <div key={position.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-body font-semibold">
                {position.name}{" "}
                <span className="font-normal text-muted">
                  ·{" "}
                  <SportLabel slug={sportById.get(position.sport_id)?.slug} name={sportById.get(position.sport_id)?.name ?? ""} size={16} />
                </span>
              </p>
              {position.description && (
                <p className="mt-0.5 text-caption text-muted">{position.description}</p>
              )}
              <p className="mt-0.5 text-caption text-primary">
                {position.archetype_id
                  ? archetypeById.get(position.archetype_id)?.name
                  : "No archetype"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setEditing(position)}>
                <Pencil size={15} />
              </Button>
              <DeleteButton id={position.id} name={position.name} />
            </div>
          </div>
        ))}
      </div>

      <PositionDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add position"
        sports={sports}
        archetypes={archetypes}
        action={createPositionAction}
      />
      {editing && (
        <PositionDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          title="Edit position"
          sports={sports}
          archetypes={archetypes}
          position={editing}
          action={updatePositionAction.bind(null, editing.id)}
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
    const result = await deletePositionAction(id);
    setPending(false);
    setOpen(false);
    if (result.error) toast.error(result.error);
    else toast.success(`${name} deleted`);
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 size={15} className="text-danger" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
          </DialogHeader>
          <p className="text-body text-muted">This can&apos;t be undone.</p>
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

function PositionDialog({
  open,
  onOpenChange,
  title,
  sports,
  archetypes,
  position,
  action,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sports: Tables<"sports">[];
  archetypes: Tables<"position_archetypes">[];
  position?: Tables<"positions">;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [name, setName] = useState(position?.name ?? "");
  const [slug, setSlug] = useState(position?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!position);
  const [sportId, setSportId] = useState(position?.sport_id ?? sports[0]?.id ?? "");
  const [archetypeId, setArchetypeId] = useState(position?.archetype_id ?? NONE);

  useEffect(() => {
    if (state.success) {
      toast.success("Saved");
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-section">
          <div>
            <Label>Sport</Label>
            <Select value={sportId} onValueChange={setSportId}>
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
              defaultValue={position?.description ?? ""}
              rows={2}
            />
          </div>
          <div>
            <Label>Archetype</Label>
            <Select value={archetypeId ?? NONE} onValueChange={setArchetypeId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {archetypes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="archetypeId"
              value={archetypeId === NONE ? "" : archetypeId ?? ""}
            />
          </div>

          {state.error && (
            <p className="text-body text-danger" role="alert">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
