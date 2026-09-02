"use client";

import { useState } from "react";
import type { BreakdownLine, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import TeamSheet from "../../components/league/TeamSheet";
import BoardBar from "../../components/league/BoardBar";
import { type View } from "../../components/league/ViewToggle";
import Pending from "../../components/league/Pending";

// A rival's eleven once his lineups have locked — with the Pitch/List control the
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
  shape,
  pending,
  eligibility,
}: {
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  lines: SquadDetailLine[];
  breakdown: Record<string, BreakdownLine[]>;
  /** The formation, "1-3-4-3". `lineup()` has always counted it and
   *  `lineupDetail` used to drop it; naming a shape is the first thing
   *  Championship Manager does with an eleven. */
  shape: string;
  /** Points Fantrax has not credited yet — a clean sheet is settled at the final
   *  whistle and FPL has been paying it since the hour mark. Null when there are
   *  none to preview, and never a nought. */
  pending: number | null;
  /** Eligible positions by Fantrax id, for the list's position column. */
  eligibility?: Record<string, string[]>;
}) {
  const [view, setView] = useState<View>("pitch");
  const players = lines.reduce((total, line) => total + line.players.length, 0);

  return (
    <div className="flex flex-col gap-2">
      {/* The same row the withheld view puts here, in the same place, so the
          control does not move down the screen when the gate opens.

          **The toggle is the PHONE's answer only** (Craig, 2 Sep). Above `lg`
          both views are on screen at once, so a control choosing between them
          would be choosing between a thing you can see and a thing you can see. */}
      <div className="lg:hidden">
        <BoardBar view={view} onPick={setView}>
          <span className="numeric flex items-baseline gap-2 text-2xs text-faint">
            <span>
              {shape} · {players} players
            </span>
            <Pending points={pending} />
          </span>
        </BoardBar>
      </div>

      {/* The formation, above the pitch, in yellow — `cm9900/19.jpg` sets
          "4-4-2*" exactly there and exactly like that. Desk only: the phone
          already carries it in the bar above. */}
      <div className="hidden items-baseline justify-between gap-2 px-1 lg:flex">
        <span className="numeric font-chrome text-sm font-bold text-accent">{shape}</span>
        <span className="numeric flex items-baseline gap-2 text-2xs text-faint">
          <span>{players} players</span>
          <Pending points={pending} />
        </span>
      </div>

      {/* **List left, pitch right** (Craig, 2 Sep), which is `19.jpg`: the game
          puts the squad list on the left of the tactics screen and the flat
          pitch on its right. The list is the wider of the two there and is here
          — it carries a name, a portrait, eligibility, a fixture and a score per
          row, and the pitch is a diagram that reads at any size.

          Below `lg` this collapses to one column and the toggle above chooses
          which of them you get, because neither is legible at half a phone. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className={view === "list" ? "" : "hidden lg:block"}>
          <TeamSheet
            rows={rows}
            bench={bench}
            lines={lines}
            breakdown={breakdown}
            mode="list"
            eligibility={eligibility}
          />
        </div>
        <div className={view === "pitch" ? "" : "hidden lg:block"}>
          <TeamSheet
            rows={rows}
            bench={bench}
            lines={lines}
            breakdown={breakdown}
            mode="pitch"
          />
        </div>
      </div>
    </div>
  );
}
