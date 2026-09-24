"use client";

import { useState, type ReactNode } from "react";
import {
  type LeagueTeam,
  type LiveTeamScore,
  inkOn,
  teamColours,
} from "@epl/core";
import TeamBadge from "./TeamBadge";
import TabStrip, { type Tab } from "../shell/TabStrip";

// The head-to-head at full size: both totals side by side, and one manager's
// team underneath them.
//
// **Two tabs rather than two pitches, and that is a decision about the PHONE.**
// Thirty players at 390 is fifteen unreadable ones, and the tab a manager is not
// looking at still carries the number he came for. So the scores live on the
// tabs permanently and the team below belongs to whichever side is open.
//
// **On the desk the open side gets both arrangements at once** — the grass on
// the left and the same eleven as rows on the right, which is the pair CM puts
// on its own match screen (`cm3/06.jpg`, `cm9900/16.jpg`) and Craig's choice of
// the two he offered on 5 Sep 2026. It costs nothing: both nodes were already
// rendered and below `lg` one of them was thrown away.
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

/** **Exactly one view belongs to a side, and it is the grass.**
 *
 *  There was a `PER_SIDE` lookup here while two of the four tabs were per-side —
 *  a map rather than a ternary, because the phone's single side and the desk's
 *  pair are two call sites and every tab added was two places free to disagree.
 *  Four of the five are now the join of both squads, and a head-to-head has no
 *  subject for any of them to belong to: they are drawn once, at both widths, by
 *  the caller. That leaves one branch, which is a `<Sides>` below rather than a
 *  lookup with a single entry. */

export interface MatchupSide {
  team: LeagueTeam;
  /** Fantrax's own total, or undefined when they had none for this team. */
  score: LiveTeamScore | undefined;
  /** His badge's URL, or undefined for a manager who picked none. A single URL
   *  and not the league's map: this crosses to the browser, and the other
   *  fourteen badges are not this board's business. */
  badge: string | undefined;
  mine: boolean;
  /** His eleven on the grass with his reserves under it — **the one view that
   *  belongs to a side**, and the only reason the two halves above are a control
   *  rather than a caption.
   *
   *  Drawn on the server and handed over as a node, so the clubs and fixtures it
   *  is joined against never cross to the browser. When his lineup is not public
   *  yet, this is the panel saying so.
   *
   *  **The list went** (Craig, 11 Sep 2026: *"pitch and list dont need to be two
   *  screens, come on, should just be Scores for that view"*, then *"just pitch
   *  i think"*), and the per-side Players board went with it on 12 Sep: every
   *  man against every category is a comparison, and drawing it a side at a time
   *  was asking a reader to hold one half in his head. */
  lineup: ReactNode;
}

export default function MatchupBoard<K extends string>({
  team,
  opponent,
  view,
  tabs,
  body,
}: {
  /** The side the URL named, and the one the board opens on. */
  team: MatchupSide;
  opponent: MatchupSide;
  /** The plate the URL is on; the first of `tabs` is the lineups, which belongs to a side. */
  view: K;
  tabs: readonly (Tab & { key: K })[];
  /** Any other view, drawn once at both widths because it is the join of both squads. */
  body: ReactNode;
}) {
  const [open, setOpen] = useState<Which>("team");
  const lineups = view === tabs[0]?.key;

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

      {/* **The toggle, and nothing beside it** (Craig, 5 Sep 2026: "remove Live
          / 1-3-4-3 row too"). It carried the round word and the open side's
          formation, and both said something the screen says better elsewhere: a
          round in play is already a red bar across the top of the app, and a
          shape is eleven men arranged on grass six pixels below it. A strip that
          repeats what is under it is furniture.

          It switches BOTH sides now rather than one, so it is live at every
          width — the `toggleClass` that used to hide it above `lg` went with the
          pitch-and-list pairing it was written for. */}
      <TabStrip label="Match views" tabs={tabs} current={view} />

      {/* **The desk shows BOTH SIDES; the phone shows the open one.** Craig,
          5 Sep 2026: "live MATCH view on desktop, show both pitches at same
          time". Thirty players at 390 is fifteen unreadable ones, so the phone
          keeps one eleven and the halves above are how you change it.

          Both nodes are already rendered either way, so this adds no request, no
          join and no second copy of an eleven.

          Each side keyed by the manager it belongs to: React reads two sibling
          expressions in one container as a list and asks for keys — rightly,
          because an unkeyed pair would let it reuse one side's DOM for the
          other's when the open half changes. */}
      {lineups ? (
        <>
          <div className="lg:hidden">{(open === "team" ? team : opponent).lineup}</div>
          <div className="pitch-pair hidden lg:grid lg:grid-cols-2 lg:items-start lg:gap-2">
            <div key={team.team.teamId}>{team.lineup}</div>
            <div key={opponent.team.teamId}>{opponent.lineup}</div>
          </div>
        </>
      ) : (
        body
      )}
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
 *  is also the rule that keeps it legible without hue (docs/rules/PRODUCT.md).
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
          colour alone. **Below `lg` only**: from there both sides are on screen
          and neither is "the open one", so a bar under one of them would mark a
          state that has stopped existing. */}
      {open ? (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-accent lg:hidden" />
      ) : null}
    </button>
  );
}
