"use client";

import { useState, type ReactNode } from "react";
import type { LeagueTeam, LiveTeamScore } from "@epl/core";

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
type View = "pitch" | "list";

export interface MatchupSide {
  team: LeagueTeam;
  /** Fantrax's own total, or undefined when they had none for this team. */
  score: LiveTeamScore | undefined;
  mine: boolean;
  /** Both drawn on the server: his eleven and bench on the grass, and the same
   *  squad as rows. Nodes rather than a roster, so the clubs and fixtures they
   *  are joined against never cross to the browser. When his lineup is not
   *  public yet, both are the panel saying so. */
  pitch: ReactNode;
  list: ReactNode;
}

export default function MatchupBoard({
  team,
  opponent,
  live,
}: {
  /** The side the URL named, and the one the board opens on. */
  team: MatchupSide;
  opponent: MatchupSide;
  live: boolean;
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
      <div className="elev flex items-stretch overflow-hidden rounded-xl border border-line bg-surface">
        <Side side={team} against={opponent} open={open === "team"} onOpen={() => setOpen("team")} />
        <span className="self-center px-1 text-2xs font-bold uppercase tracking-widest text-faint">
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

      <div className="flex items-center justify-between gap-3 px-0.5">
        {live ? (
          <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-widest text-live">
            <span className="live-dot" />
            Live
          </span>
        ) : (
          <span />
        )}
        <div
          role="group"
          aria-label="How to show the squad"
          className="flex gap-0.5 rounded-md bg-surface p-0.5"
        >
          <ViewButton current={view} value="pitch" onPick={setView} />
          <ViewButton current={view} value="list" onPick={setView} />
        </div>
      </div>

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
  // Nobody is behind while a total is missing: a dash is not a low score.
  const behind = points !== null && other !== null && points < other;

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
      <span
        className={`min-w-0 flex-1 truncate text-xs font-semibold ${
          mirrored ? "text-right" : "text-left"
        } ${side.mine ? "text-accent" : open ? "text-ink" : "text-muted"}`}
      >
        {side.team.name}
      </span>

      {/* A team Fantrax has no number for gets a dash, never a nought. */}
      <span
        className={`numeric shrink-0 text-2xl font-bold leading-none ${
          behind ? "text-muted" : "text-ink"
        }`}
      >
        {points ?? "—"}
      </span>

      {/* The open half owns what is below it, and says so with a foot bar rather
          than colour alone. */}
      {open ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-cream/70" /> : null}
    </button>
  );
}

function ViewButton({
  current,
  value,
  onPick,
}: {
  current: View;
  value: View;
  onPick: (view: View) => void;
}) {
  const here = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      aria-pressed={here}
      className={`min-h-9 rounded px-3 text-2xs font-bold uppercase tracking-widest ${
        here ? "bg-raised text-ink" : "text-faint hover:text-muted"
      }`}
    >
      {value}
    </button>
  );
}
