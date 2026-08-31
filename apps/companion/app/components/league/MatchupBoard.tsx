"use client";

import { useState, type ReactNode } from "react";
import { type LeagueTeam, type LiveTeamScore, type RoundState } from "@epl/core";
import ScoreFigure from "./ScoreFigure";
import RoundWord from "./RoundWord";
import TeamBadge from "./TeamBadge";
import BoardBar from "./BoardBar";
import { type View } from "./ViewToggle";

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
      {/* One row, read the way a scoreline is said out loud: his name, his
          score, against, their score, their name. Two stacked cards made a
          reader compare two numbers in different places on the screen, which is
          the one thing a scoreline exists not to make you do. */}
      <div className="cm-panel flex items-stretch overflow-hidden">
        <Side side={team} against={opponent} open={open === "team"} onOpen={() => setOpen("team")} />
        <span className="self-center px-1 text-2xs font-bold uppercase text-faint">
          v
        </span>
        <Side
          side={opponent}
          against={team}
          open={open === "opponent"}
          onOpen={() => setOpen("opponent")}
          mirrored
        />
      </div>

      {/* The open side's shape, beside the round word and changing with the side
          — the first thing Championship Manager says about an eleven, and free
          here: `lineupDetail` already counts it. */}
      <BoardBar view={view} onPick={setView}>
        {state === null && side.shape === null ? null : (
          <span className="flex items-baseline gap-2 text-2xs font-bold uppercase text-faint">
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
 *  `mirrored` turns it round for the away half, so both scores meet in the
 *  middle either side of the "v" and both names sit at the outside edges. */
function Side({
  side,
  against,
  open,
  onOpen,
  mirrored = false,
}: {
  side: MatchupSide;
  against: MatchupSide;
  open: boolean;
  onOpen: () => void;
  mirrored?: boolean;
}) {
  const points = side.score?.points ?? null;
  const other = against.score?.points ?? null;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={open}
      aria-label={`Show ${side.team.name}`}
      className={`relative flex min-h-14 min-w-0 flex-1 items-center gap-2 px-3 py-2 ${
        mirrored ? "flex-row-reverse" : ""
      } ${open ? "bg-raised" : ""}`}
    >
      <TeamBadge team={side.team} url={side.badge} />
      <span
        className={`min-w-0 flex-1 truncate text-xs font-semibold ${
          mirrored ? "text-right" : "text-left"
        } ${side.mine ? "text-accent" : open ? "text-ink" : "text-muted"}`}
      >
        {side.team.name}
      </span>

      <ScoreFigure
        points={points}
        other={other}
        className="numeric shrink-0 text-2xl font-bold leading-none"
      />

      {/* The open half owns what is below it, and says so with a foot bar rather
          than colour alone. */}
      {open ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-cream/70" /> : null}
    </button>
  );
}
