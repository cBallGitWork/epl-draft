"use client";

import { useState } from "react";
import type { LeaguePlayerState, RosterLimits, RosteredTeam, SquadPlayerDetail } from "@epl/core";
import LineupPitch from "./LineupPitch";
import PlayerCard from "./PlayerCard";
import MoveDialog from "./MoveDialog";
import Pending from "./Pending";
import SquadRows from "./SquadRows";
import ViewToggle, { type View } from "./ViewToggle";
import PlanStatus from "./PlanStatus";
import { usePlanner } from "./usePlanner";
import { PANEL, HEADING_PLATE } from "@/app/desk";
import OutLink from "../shell/OutLink";
import ListAndPitch from "./ListAndPitch";

// Planning a lineup, not submitting one.
//
// The whole point is an XI you can rearrange and look at before committing to
// it, so the edited shape lives in browser state; the real roster is untouched
// and Fantrax remains the only thing that can change it. The button at the
// bottom hands the manager over rather than pretending we can write.
//
// Every rule it enforces is the commissioner's, read from `getLeagueInfo` and
// applied by `moves.ts`: how many may start, how many may sit, how many at each
// position, and which positions each player is eligible for. Nothing about the
// shape is assumed here — a 1-5-2-3 is legal in this league and would be legal
// on screen.

export default function LineupPlanner({
  team,
  details,
  players,
  limits,
  fantraxUrl,
  pending,
}: {
  team: RosteredTeam;
  /** The squad's football detail, flat and unarranged. Arranging it is this
   *  component's job and it changes with every move. */
  details: SquadPlayerDetail[];
  /** Plain array rather than the `Eligibility` map: this crosses the server
   *  boundary, and the map is built here where it is used. */
  players: LeaguePlayerState[];
  limits: RosterLimits;
  fantraxUrl: string;
  /** Points Fantrax has not credited yet — a clean sheet is settled at the final
   *  whistle and FPL has been paying it since the hour mark. Null when there are
   *  none to preview, and never a nought. */
  pending: number | null;
}) {
  const {
    rows,
    bench,
    eligibleBy,
    nameOf,
    dirty,
    broken,
    empty,
    play,
    card,
    setCard,
    opened,
    setOpened,
    pickStateOf,
    pick,
    reset,
    movesFor,
    optionsFor,
  } = usePlanner(team, details, players, limits);
  const [view, setView] = useState<View>("pitch");


  return (
    <div className="flex flex-col gap-3">
      {/* **The formation line is gone** (Craig, 21 Sep 2026: "remove 1-3-4-3
          row"). It named the shape above the grass, and the grass draws the
          shape — four lines of cards is what a 1-3-4-3 looks like, and a reader
          who wants the string can count them. It cost the pitch 20px of its
          height budget at every width to say something the picture underneath it
          was already saying. */}
      {/* **A list as well as a pitch** (Craig, 21 Sep 2026), on `Sheet`'s
          control and `Sheet`'s components — the same `ViewToggle` and the same
          `SquadRows` a rival's locked squad draws.
          
          **At every width, which is where it parts from `Sheet`.** That screen
          hides the toggle above `lg` and stands the list beside the pitch,
          because both fit and a control choosing between two things you can
          already see does nothing. This pitch cannot take that: `LineupPitch`
          is the one ground with no second column beside it and is capped to the
          fold on its own width, so halving it for a list would shrink the only
          interactive surface in the app to make room for a read-only copy of
          what it already says. */}
      {/* **Across the page under a thumb** (Craig, 21 Sep 2026: "pitch/list, use
          thinner buttons, put in the middle of the page, longer and thinner").
          It was 110px of a 390 screen, hard against the right edge, sharing a
          row with a figure that is usually absent — two small plates floating in
          an empty bar, which `ViewToggle`'s own docblock already calls out as
          reading like leftovers. Its `flex-1` was doing nothing because the row
          was `justify-end`.

          **Longer is what makes it thinner.** The plates are 44px tall and stay
          there: that is docs/rules/PRODUCT.md's tap floor, and the Pitch/List toggle is the
          one control that used to have an exception to it — deleted on 11 Sep
          when this became a `.cm-tab` strip, and a deleted exception is not one
          to quietly re-open. At full width the same height reads as a bar rather
          than as two buttons, which is the proportion CM's own `Back · Next`
          pair has at the foot of a screen. */}
      <div className="flex flex-col gap-2 px-1 text-2xs lg:flex-row lg:items-center lg:justify-end lg:gap-3">
        {/* Above the strip on a phone and beside it on the desk, so a pending
            figure never pushes the control off the fold. */}
        <div className="flex justify-end lg:order-2">
          <Pending points={pending} />
        </div>
        {/* Phone only, on `Sheet`'s reasoning: above `lg` both readings fit
            side by side, and a control choosing between two things already on
            screen is a control that does nothing. It also buys the grass back
            the 44px a tap target costs — `pitchfit` had the pitch clearing the
            fold by 5px at 1440 with the toggle in the column, and by 26 with
            it gone. */}
        <div className="lg:hidden">
          <ViewToggle view={view} onPick={setView} />
        </div>
      </div>

      {/* **One box round both** (Craig, 3 Sep 2026: "i like that the real team
          squad page has one box to contain the pitch and list. fantasy team
          pitch does not do this and it looks bad, copy real team"). He said it of
          this very screen and it was answered on the rival's; this is the same
          grid, the same breakpoint and the same panel. */}
      <section className={PANEL}>
      <ListAndPitch
        view={view}
        list={
          <div className="flex flex-col gap-2">
          <SquadRows
            lines={rows.map((line) => ({ position: line.label, players: line.players }))}
            projected={false}
            eligibility={eligibleBy}
            onOpen={setCard}
          />
          {bench.length === 0 ? null : (
            <>
              {/* The plate, and the same reason `TeamSheet` gives for it:
                  nothing prints on the bare ground (DESIGN §2), so a heading
                  between two panels draws its own. */}
              <p className={HEADING_PLATE}>Bench</p>
              <SquadRows
                lines={[{ position: "", players: bench }]}
                projected={false}
                eligibility={eligibleBy}
                head={false}
                reserve
                onOpen={setCard}
              />
            </>
          )}
          </div>
        }
        pitch={
          <LineupPitch
            inColumn
            rows={rows}
            bench={bench}
            pickStateOf={pickStateOf}
            onPick={pick}
          />
        }
      />
      </section>

      {card !== null ? (
        <PlayerCard
          key={card.rostered.slot.fantraxId}
          player={card}
          onClose={() => setCard(null)}
        />
      ) : null}

      {opened !== null ? (
        <MoveDialog
          key={opened}
          name={nameOf(opened)}
          moves={movesFor(opened)}
          options={optionsFor(opened)}
          nameOf={nameOf}
          onPlay={play}
          onCard={() => {
            setOpened(null);
            setCard([...rows.flatMap((line) => line.players), ...bench].find((p) => p.rostered.slot.fantraxId === opened) ?? null);
          }}
          onClose={() => setOpened(null)}
        />
      ) : null}

      <PlanStatus dirty={dirty} onReset={reset} broken={broken} empty={empty} nameOf={nameOf} />

      <OutLink href={fantraxUrl}>Set this lineup in Fantrax</OutLink>
    </div>
  );
}
