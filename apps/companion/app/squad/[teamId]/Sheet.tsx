"use client";

import type { BreakdownLine, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { useState } from "react";
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
  pending,
  eligibility,
}: {
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  lines: SquadDetailLine[];
  breakdown: Record<string, BreakdownLine[]>;
  /** The formation, "1-3-4-3". Taken and not drawn: it arrives on the spread
   *  from `lineupDetail` and the pitch says it better than the string does. */
  shape?: string;
  /** Points Fantrax has not credited yet — a clean sheet is settled at the final
   *  whistle and FPL has been paying it since the hour mark. Null when there are
   *  none to preview, and never a nought. */
  pending: number | null;
  /** Eligible positions by Fantrax id, for the list's position column. */
  eligibility?: Record<string, string[]>;
}) {
  // Opens on the LIST: a squad screen is a list of who you have, and the pitch
  // is the second reading of it. Phone only — above `lg` both are drawn and the
  // control is hidden.
  const [view, setView] = useState<View>("list");

  return (
    <div className="flex flex-col gap-2">
      {/* **No shape line** (Craig, 2 Sep: "so remove 1-3-4-3"). The AC Milan
          shot heads its pitch "5-3-2 Attacking*" because the game is about to
          let you EDIT it — a tactics screen names the thing it is editing. Ours
          is a read-only arrangement and the pitch below states the shape better
          than a hyphenated string does: you can see it is three at the back. */}
      {/* **The toggle is the PHONE's answer, and only the phone's.** Stacking
          the list and the pitch put the grass 421px past the fold at 390 —
          `pitchfit`'s own named failure, and it fails it at the width the
          product is designed for first: a reader at the top of the page saw
          fourteen names and a sliver of green. `ui-verifier` measured it.

          Above `lg` there is room for both and no choice to make, so the control
          goes: a toggle between two things you can already see is a control that
          does nothing. */}
      <div className="flex items-center justify-between gap-2 px-1 lg:hidden">
        <BoardBar view={view} onPick={setView} />
        <Pending points={pending} />
      </div>
      {pending === null ? null : (
        <div className="hidden justify-end px-1 lg:flex">
          <Pending points={pending} />
        </div>
      )}

      {/* **List left, pitch right, and the two the same width** (Craig, 2 Sep:
          "the pitch needs to be longer, and same size as the list really"). The
          Milan and Bayern shots both split their tactics screen down the middle
          — the list is not the main thing with a diagram beside it, they are two
          readings of one team given equal room. Ours ran 3fr against 2fr, which
          made the list the screen and the pitch an illustration of it.

          The list carries the whole squad, XI and reserves; the pitch carries
          the ELEVEN and nothing else, which is what the game does — eighteen
          names down the left, eleven on the grass.

          Below `lg` the toggle above chooses which of them you get, because
          neither is legible at half a phone and both together put the grass off
          the bottom of the screen. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
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
            // **No bench on the grass.** The eleven is the formation; a reserve
            // has no place in one, and the strip under the pitch was drawing
            // four men who are not playing at the same size as the ones who are.
            bench={[]}
            lines={lines}
            breakdown={breakdown}
            mode="pitch"
            inColumn
            show="fixture"
          />
        </div>
      </div>
    </div>
  );
}
