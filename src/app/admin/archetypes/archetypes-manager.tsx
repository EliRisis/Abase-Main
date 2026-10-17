"use client";

import { Pencil, Plus, Trash2 } from "@/components/icons";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  createArchetypeAction,
  deleteArchetypeAction,
  updateArchetypeAction,
  type ActionResult,
} from "./actions";
import { WeightsDialog } from "./weights-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/validations/content";
import type { Tables } from "@/lib/database.types";

const emptyState: ActionResult = {};

export function ArchetypesManager({
  archetypes,
  weightsByArchetype,
  positionCounts,
}: {
  archetypes: Tables<"position_archetypes">[];
  weightsByArchetype: Record<string, Tables<"archetype_category_weights">[]>;
  positionCounts: Record<string, number>;
}) {
  const [editing, setEditing] = useState<Tables<"position_archetypes"> | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Position Archetypes</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} /> Add archetype
        </Button>
      </div>
      <p className="text-body text-muted">
        Archetypes give a new position a solid default training template (how much strength
        vs. speed vs. conditioning etc. it gets per phase) instead of starting from scratch.
      </p>

      <div className="flex flex-col divide-y divide-border surface-card">
        {archetypes.length === 0 && (
          <p className="p-6 text-center text-body text-muted">No archetypes yet.</p>
        )}
        {archetypes.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-body font-semibold">{a.name}</p>
              {a.description && <p className="mt-0.5 text-caption text-muted">{a.description}</p>}
              <p className="mt-0.5 text-caption text-primary">
                {positionCounts[a.id] ?? 0} position{(positionCounts[a.id] ?? 0) === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <WeightsDialog archetype={a} weights={weightsByArchetype[a.id] ?? []} />
              <Button variant="ghost" size="icon" onClick={() => setEditing(a)}>
                <Pencil size={15} />
              </Button>
              <DeleteButton id={a.id} name={a.name} />
            </div>
          </div>
        ))}
      </div>

      <ArchetypeDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add archetype"
        action={createArchetypeAction}
      />
      {editing && (
        <ArchetypeDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          title="Edit archetype"
          archetype={editing}
          action={updateArchetypeAction.bind(null, editing.id)}
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
    const result = await deleteArchetypeAction(id);
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
          <p className="text-body text-muted">
            Positions using this archetype keep their data but lose the template link.
          </p>
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

function ArchetypeDialog({
  open,
  onOpenChange,
  title,
  archetype,
  action,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  archetype?: Tables<"position_archetypes">;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [name, setName] = useState(archetype?.name ?? "");
  const [slug, setSlug] = useState(archetype?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!archetype);

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
              defaultValue={archetype?.description ?? ""}
              rows={2}
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
