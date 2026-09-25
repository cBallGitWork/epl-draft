"use client";

import { useState } from "react";
import ListAndPitch from "@/app/components/league/ListAndPitch";
import ViewToggle from "@/app/components/league/ViewToggle";
import type { View } from "@/app/components/league/ViewToggle";

/** The chart's two readings: both side by side on a desk, one at a time behind the toggle on a phone. */
export default function DepthViews({ list, pitch }: { list: React.ReactNode; pitch: React.ReactNode }) {
  const [view, setView] = useState<View>("pitch");
  return (
    <div className="flex flex-col gap-2">
      <div className="lg:hidden">
        <ViewToggle view={view} onPick={setView} />
      </div>
      <ListAndPitch view={view} list={list} pitch={pitch} />
    </div>
  );
}
