"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setPlanWorkoutAction } from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { WEEKDAY_LABELS } from "@/lib/plan-schedule";
import type { Tables } from "@/lib/database.types";

const REST = "rest";

type PlanWorkoutRow = Tables<"plan_workouts">;

export function ScheduleEditor({
  planId,
  weeks,
  planWorkouts,
  workouts,
}: {
  planId: string;
  weeks: number;
  planWorkouts: PlanWorkoutRow[];
  workouts: Tables<"workouts">[];
}) {
  const weekNumbers = Array.from({ length: weeks }, (_, i) => i + 1);
  const [entries, setEntries] = useState(() => {
    const map = new Map<string, string>();
    for (const pw of planWorkouts) {
      map.set(`${pw.week_number}-${pw.day_number}`, pw.workout_id);
    }
    return map;
  });
  const [, startTransition] = useTransition();

  function handleChange(week: number, day: number, workoutId: string) {
    const key = `${week}-${day}`;
    const next = new Map(entries);
    if (workoutId === REST) next.delete(key);
    else next.set(key, workoutId);
    setEntries(next);

    startTransition(async () => {
      try {
        await setPlanWorkoutAction(planId, week, day, workoutId === REST ? "" : workoutId, "");
      } catch {
        toast.error("Couldn't save that day. Try again.");
      }
    });
  }

  return (
    <Tabs defaultValue="1">
      <TabsList>
        {weekNumbers.map((w) => (
          <TabsTrigger key={w} value={String(w)}>
            Week {w}
          </TabsTrigger>
        ))}
      </TabsList>
      {weekNumbers.map((w) => (
        <TabsContent key={w} value={String(w)}>
          <div className="flex flex-col gap-2">
            {WEEKDAY_LABELS.map((label, i) => {
              const day = i + 1;
              const value = entries.get(`${w}-${day}`) ?? REST;
              return (
                <div
                  key={day}
                  className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface p-3.5"
                >
                  <span className="w-24 shrink-0 text-label text-muted">
                    {label}
                  </span>
                  <Select value={value} onValueChange={(v) => handleChange(w, day, v)}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={REST}>Rest day</SelectItem>
                      {workouts.map((wk) => (
                        <SelectItem key={wk.id} value={wk.id}>
                          {wk.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
