"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Track = "weight_room" | "field";

/**
 * Field / Court and Gym are two separate schedules. The tab that opens first is the one with a session today
 * (Gym when both have one); after that the athlete's last pick is kept in local state.
 */
export function TrackTabs({ defaultTrack, field, gym }: { defaultTrack: Track; field: React.ReactNode; gym: React.ReactNode }) {
  const [track, setTrack] = useState<Track>(defaultTrack);
  return (
    <Tabs value={track} onValueChange={(v) => setTrack(v as Track)}>
      <TabsList className="w-full">
        <TabsTrigger value="field" className="flex-1">
          Field / Court
        </TabsTrigger>
        <TabsTrigger value="weight_room" className="flex-1">
          Gym
        </TabsTrigger>
      </TabsList>
      <TabsContent value="field">{field}</TabsContent>
      <TabsContent value="weight_room">{gym}</TabsContent>
    </Tabs>
  );
}
