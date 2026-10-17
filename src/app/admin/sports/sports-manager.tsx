"use client";

import { Pencil, Plus, Trash2 } from "@/components/icons";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  createSportAction,
  deleteSportAction,
  updateSportAction,
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
import { slugify } from "@/lib/validations/content";
import type { Tables } from "@/lib/database.types";

const emptyState: ActionResult = {};

export function SportsManager({ sports }: { sports: Tables<"sports">[] }) {
  const [editing, setEditing] = useState<Tables<"sports"> | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Sports</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} /> Add sport
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-border surface-card">
        {sports.length === 0 && (
          <p className="p-6 text-center text-body text-muted">No sports yet.</p>
        )}
        {sports.map((sport) => (
          <div key={sport.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-body font-semibold">{sport.name}</p>
                <p className="text-caption text-muted">/{sport.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setEditing(sport)}>
                <Pencil size={15} />
              </Button>
              <DeleteButton id={sport.id} name={sport.name} />
            </div>
          </div>
        ))}
      </div>

      <SportDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add sport"
        action={createSportAction}
      />
      {editing && (
        <SportDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          title="Edit sport"
          sport={editing}
          action={updateSportAction.bind(null, editing.id)}
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
    const result = await deleteSportAction(id);
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
            This can&apos;t be undone. Positions, workouts, and plans tagged
            to this sport will keep their data but lose this tag.
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

function SportDialog({
  open,
  onOpenChange,
  title,
  sport,
  action,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sport?: Tables<"sports">;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [name, setName] = useState(sport?.name ?? "");
  const [slug, setSlug] = useState(sport?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!sport);

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
            <Label htmlFor="icon">Legacy icon</Label>
            <Input id="icon" name="icon" defaultValue={sport?.icon ?? ""} maxLength={4} />
              <p className="mt-1 text-caption text-muted">Legacy field. The app draws the sport from its slug (public/icons/sports/&lt;slug&gt;.png) and does not show this.</p>
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
