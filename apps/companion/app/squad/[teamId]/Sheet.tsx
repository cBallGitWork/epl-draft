"use client";

import { useState } from "react";
import type { BreakdownLine, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import TeamSheet from "../../components/league/TeamSheet";
import ViewToggle, { type View } from "../../components/league/ViewToggle";

// A rival's eleven once his period has opened — with the Pitch/List control the
// page had been losing at exactly that moment.
//
// The gap was invisible before a period had ever opened, which is why it lasted:
// all week the page renders `SquadBoard`, which owns a toggle, and the branch
// underneath it renders `TeamSheet`, which deliberately does not. `TeamSheet`'s
// reasoning is sound where it was written — the head-to-head board owns one
// control for both sides, and a second inside each side would be two controls
// saying the same thing — but this route has one side and owned no control at
// all. So the squad screen answered "who exactly is in it" all week and stopped
// answering it the moment the football started.
//
// The state lives here rather than inside `TeamSheet` for the same reason it
// lives in `MatchupBoard`: whoever draws the control owns it.

export default function Sheet({
  rows,
  bench,
  lines,
  breakdown,
  projected,
}: {
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  lines: SquadDetailLine[];
  breakdown: Record<string, BreakdownLine[]>;
  projected: boolean;
}) {
  const [view, setView] = useState<View>("pitch");
  const players = lines.reduce((total, line) => total + line.players.length, 0);

  return (
    <div className="flex flex-col gap-2">
      {/* The same row the withheld view puts here, in the same place, so the
          control does not move down the screen when the gate opens. */}
      <div className="flex items-center justify-between gap-3">
        <ViewToggle view={view} onPick={setView} />
        <span className="numeric text-2xs text-faint">{players} players</span>
      </div>

      <TeamSheet
        rows={rows}
        bench={bench}
        lines={lines}
        breakdown={breakdown}
        projected={projected}
        mode={view}
      />
    </div>
  );
}
