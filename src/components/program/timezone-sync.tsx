"use client";

import { useEffect } from "react";
import { syncTimezoneAction } from "@/app/(app)/program/actions";

/** Remembers the athlete's timezone so "today" (sessions, check-ins, game days) is their local date. */
export function TimezoneSync({ current }: { current: string | null }) {
  useEffect(() => {
    let tz: string | undefined;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (tz && tz !== current) void syncTimezoneAction(tz);
  }, [current]);
  return null;
}
