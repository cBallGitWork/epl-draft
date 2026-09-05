"use client";

import { useState, type ReactNode } from "react";
import {
  type LeagueTeam,
  type LiveTeamScore,
  type RoundState,
  inkOn,
  teamColours,
} from "@epl/core";
import RoundWord from "./RoundWord";
import TeamBadge from "./TeamBadge";
import BoardBar from "./BoardBar";
import { type View } from "./ViewToggle";
import { LABEL } from "@/app/desk";

// The head-to-head at full size: both totals side by side, and one manager's
// team underneath them.
//
// Two tabs rather than two pitches. Thirty players on a phone is fifteen
// unreadable ones, and the tab a manager is not looking at still carries the
// number he came for. So the scores live on the tabs permanently and the team
// below belongs to whichever side is open.
//
// The leader is deliberately NOT accent-tinted. Accent means "your team" on five
// other screens (`mine.ts`) and marks your name here too, so a second meaning
// for it would break a reading aid rather than add one. Whoever is ahead reads
// at full strength and the side behind is dimmed.
//
// How many of a side's players are still to come is on the pitch rather than on
// the tab: everybody who has not kicked off is drawn back, which names them
// instead of counting them.

type Which = "team" | "opponent";

export interface MatchupSide {
  team: LeagueTeam;
  /** Fantrax's own total, or undefined when they had none for this team. */
  score: LiveTeamScore | undefined;
  /** His badge's URL, or undefined for a manager who picked none. A single URL
   *  and not the league's map: this crosses to the browser, and the other
   *  fourteen badges are not this board's business. */
  badge: string | undefined;
  mine: boolean;
  /** Both drawn on the server: his eleven and bench on the grass, and the same
   *  squad as rows. Nodes rather than a roster, so the clubs and fixtures they
   *  are joined against never cross to the browser. When his lineup is not
   *  public yet, both are the panel saying so. */
  pitch: ReactNode;
  list: ReactNode;
  /** His formation — "1-3-4-3" — or null while his lineup is withheld, which is
   *  the same condition `pitch` and `list` draw the panel for. It has to be null
   *  and not an empty string: a shape IS the arrangement, and naming one for a
   *  side whose eleven is not public yet is the leak the gate exists to stop. */
  shape: string | null;
}

export default function MatchupBoard({
  team,
  opponent,
  state,
}: {
  /** The side the URL named, and the one the board opens on. */
  team: MatchupSide;
  opponent: MatchupSide;
  state: RoundState;
}) {
  const [open, setOpen] = useState<Which>("team");
  const [view, setView] = useState<View>("pitch");
  const side = open === "team" ? team : opponent;

  return (
    <div className="flex flex-col gap-2">
      {/* One row, read the way a scoreline is said out loud: two sides at once,
          each on its own colour with its own total at its own right edge. Two
          stacked cards made a reader compare two numbers in different places on
          the screen, which is the one thing a scoreline exists not to make you
          do.

          **No `v` between them.** `MatchBar` carries one before a ball is
          kicked, because "not played" is a fact about the fixture rather than
          about either side; a period that has opened always has two figures, and
          one that has not gives two dashes, which say it themselves. */}
      <div className="flex items-stretch">
        <Side side={team} open={open === "team"} onOpen={() => setOpen("team")} />
        <Side side={opponent} open={open === "opponent"} onOpen={() => setOpen("opponent")} />
      </div>

      {/* The open side's shape, beside the round word and changing with the side
          — the first thing Championship Manager says about an eleven, and free
          here: `lineupDetail` already counts it. */}
      <BoardBar view={view} onPick={setView}>
        {state === null && side.shape === null ? null : (
          <span className={`flex items-baseline gap-2 ${LABEL}`}>
            {state === null ? null : <RoundWord state={state} />}
            {side.shape === null ? null : <span className="numeric">{side.shape}</span>}
          </span>
        )}
      </BoardBar>

      {view === "pitch" ? side.pitch : side.list}
    </div>
  );
}

/** One half of the scoreline, doubling as the control that opens his team.
 *
 *  **Championship Manager's match header, with the managers where the clubs
 *  are.** `cm9900/21.jpg` sets Everton's blue against Arsenal's red and `16.jpg`
 *  sets the same blue against Torquay's WHITE, so a pale side is a case the
 *  reference has rather than an edge we invented — `inkOn` answers it. The draft
 *  tie is the same object as a Premier League match and now looks like one
 *  (Craig, 5 Sep 2026: *"share similar layout to real match"*).
 *
 *  **Neither plate is mirrored, and each score sits at ITS OWN right edge** —
 *  `prem/match/[id]/MatchBar` records that correction, made when the first build
 *  put the two boxes together in the middle and it read as one scoreline shared
 *  between the sides rather than as each side's own.
 *
 *  **The open half is marked by a bar and not by a hue.** Colour is spent on
 *  whose side it is, so which one you are reading is carried by a shape — which
 *  is also the rule that keeps it legible without hue (PRODUCT.md).
 *
 *  **`ScoreFigure` may not come inside the bevel**, and that is a contrast fact:
 *  DESIGN §2 puts dark ink on the grey plate at 7.52:1 and `--color-ink` at
 *  2.27, and `ScoreFigure`'s whole job is to dim the trailing figure, which is
 *  lower still. So the plate keeps its own ink and the dash for a total Fantrax
 *  did not give is kept by hand. The cost is real and is paid twice — this and
 *  `matchday/YourMatchup` — for the same reason: it is the price of putting a
 *  score in the box the reference puts it in. */
function Side({
  side,
  open,
  onOpen,
}: {
  side: MatchupSide;
  open: boolean;
  onOpen: () => void;
}) {
  const points = side.score?.points ?? null;
  const colours = teamColours(side.team.teamId);
  const ink = inkOn(colours);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={open}
      aria-label={`Show ${side.team.name}`}
      className={`relative flex min-h-16 min-w-0 flex-1 items-center lg:min-h-20 ${
        side.mine ? "border-l-4 border-l-accent" : ""
      }`}
      style={{ background: colours.primary }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 px-2">
        {/* **The badge stands down under a thumb**, measured: at 390 the plate is
            about 145px, and a badge plus a `w-14` score box left the name some
            55 — both sides rendered as "TE…", which is worse than no name at
            all. The plate's own colour is the identity at that width, which is
            the whole reason the reference gives each side its club's colour;
            the badge comes back where there is room for both. */}
        <span className="hidden lg:flex">
          <TeamBadge team={side.team} url={side.badge} />
        </span>
        {/* Accent ink is unavailable on a colour plate, so "yours" is the edge
            and the position — `mine.ts`'s own mark, and why it exists as a
            border as well as an ink. */}
        <span
          className="cm-title min-w-0 flex-1 truncate text-left font-chrome text-base font-bold uppercase lg:text-2xl"
          style={{ color: ink }}
        >
          {side.team.name}
        </span>
      </span>

      <span className="cm-bevel numeric flex min-h-16 w-14 shrink-0 items-center justify-center text-xl font-bold lg:min-h-20 lg:w-24 lg:text-4xl">
        {points === null ? "\u2014" : points}
      </span>

      {/* The open half owns what is below it, and says so with a bar rather than
          colour alone. */}
      {open ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-accent" /> : null}
    </button>
  );
}
