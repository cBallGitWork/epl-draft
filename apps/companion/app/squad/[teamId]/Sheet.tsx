"use client";

import type { BreakdownLine, PlayerStory, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { useState } from "react";
import TeamSheet from "../../components/league/TeamSheet";
import ViewToggle, { type View } from "../../components/league/ViewToggle";
import Pending from "../../components/league/Pending";
import { PANEL } from "@/app/desk";
import ListAndPitch from "@/app/components/league/ListAndPitch";

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
  breakdown,
  news,
  pending,
  eligibility,
}: {
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  breakdown: Record<string, BreakdownLine[]>;
  /** Fantrax's latest on these fifteen, keyed by Fantrax id — today's only. */
  news?: Record<string, PlayerStory>;
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
        <ViewToggle view={view} onPick={setView} />
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
      {/* `lg:gap-10` and not `gap-3` (Craig, 2 Sep: "pitch is too wide, just
          make a bigger gap between list and pitch view"). Two equal columns
          butted three pixels apart read as one wide object split down the
          middle; the air is what makes them two readings of the same team
          standing side by side, and it takes width off the pitch without
          changing its shape. */}
      {/* **One box round both** (Craig, 3 Sep 2026: "i like that the real team
          squad page has one box to contain the pitch and list. fantasy team
          pitch does not do this and it looks bad, copy real team"). The list
          drew its own panel and the grass drew none, so the pair read as a
          table with a picture loose beside it rather than as two readings of one
          squad. `/prem/club/[code]` puts both inside a single `cm-panel` and
          this now does the same; `bare` is what stops the list drawing a second
          one inside this. */}
      <section className={PANEL}>
      <ListAndPitch
        view={view}
        list={
          <TeamSheet
            rows={rows}
            bench={bench}
            breakdown={breakdown}
            news={news}
            mode="list"
            eligibility={eligibility}
            bare
          />
        }
        pitch={
          <>
            {/* **A heading over the grass** (Craig, 3 Sep 2026: "both the fantasy
                and real squad pages need a title/caption over the pitch"). Eleven
                faces on a pitch do not say what eleven they are: this is the side
                as it stands, and the club page says "Predicted XI" over its own
                because that one is a guess and this one is not. */}
            <p className="cm-title pb-1 text-center font-chrome text-2xs font-bold text-accent lg:text-sm">
              First-choice XI
            </p>
            <TeamSheet
              rows={rows}
              // **No bench on the grass.** The eleven is the formation; a reserve
              // has no place in one, and the strip under the pitch was drawing
              // four men who are not playing at the same size as the ones who are.
              bench={[]}
              breakdown={breakdown}
              news={news}
              mode="pitch"
              inColumn
              show="fixture"
            />
          </>
        }
      />
      </section>
    </div>
  );
}
