"use client";

import { PositionLabel, SportLabel } from "@/components/icons/app-icon";
import { Search, SlidersHorizontal } from "@/components/icons";
import { useMemo, useState } from "react";
import { PlanCard } from "./plan-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExperienceLevel, Tables } from "@/lib/database.types";

export type PlanWithRelations = Tables<"plans"> & {
  sport: Pick<Tables<"sports">, "id" | "name" | "slug" | "icon"> | null;
  position: Pick<Tables<"positions">, "id" | "name" | "slug" | "sport_id"> | null;
};

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const ALL = "all";

export function PlansBrowser({
  plans,
  sports,
  positions,
}: {
  plans: PlanWithRelations[];
  sports: Tables<"sports">[];
  positions: Tables<"positions">[];
}) {
  const [search, setSearch] = useState("");
  const [sportId, setSportId] = useState<string>(ALL);
  const [positionId, setPositionId] = useState<string>(ALL);
  const [level, setLevel] = useState<string>(ALL);

  const positionOptions = useMemo(
    () => (sportId === ALL ? positions : positions.filter((p) => p.sport_id === sportId)),
    [positions, sportId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((plan) => {
      if (sportId !== ALL && plan.sport_id !== sportId) return false;
      if (positionId !== ALL && plan.position_id !== positionId) return false;
      if (level !== ALL && plan.level !== level) return false;
      if (q && !plan.name.toLowerCase().includes(q) && !plan.description?.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [plans, search, sportId, positionId, level]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans..."
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={15} className="mr-0.5 text-muted" />
          <Select
            value={sportId}
            onValueChange={(v) => {
              setSportId(v);
              setPositionId(ALL);
            }}
          >
            <SelectTrigger className="w-auto min-w-32">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sports</SelectItem>
              {sports.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <SportLabel slug={s.slug} name={s.name} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={positionId} onValueChange={setPositionId}>
            <SelectTrigger className="w-auto min-w-32">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All positions</SelectItem>
              {positionOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <PositionLabel slug={p.slug} name={p.name} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-auto min-w-32">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All levels</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-10 text-center text-body text-muted">
          No plans match those filters yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
