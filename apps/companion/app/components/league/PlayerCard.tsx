"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { type RosteredPlayer, type SquadPlayerDetail, type Unresolved, isDoubtful, isResolved, playerName } from "@epl/core";
import FixtureChip from "../football/FixtureChip";
import PitchPlayer from "./PitchPlayer";
import { londonDayAndTime } from "../../londonTime";

// One player, over the squad rather than instead of it.
//
// A dialog and not a route: the question a tap asks is "who is this, and is he
// fit" while reading somebody else's fifteen, and navigating away to answer it
// loses the squad the manager was reading. The way out to the full profile is
// still offered, because that page knows things this one cannot fit.
//
// Native `<dialog>`, so Escape, the focus trap and the inert background are the
// browser's job rather than four effects of ours.
//
// The subject of the card is the sticker itself, at album size. Tapping a
// sticker to be shown the same sticker larger is the point: it is the object the
// manager was pointing at, and rendering a second, plainer portrait beside it
// would make the card look like a different player.

/** Why there is no footballer behind the slot, in words a manager can act on.
 *  A second copy of the sticker's — two is a coincidence (§1), and the two
 *  screens have room for different wording the day either needs it. */
const WHY: Record<Unresolved, string> = {
  unmapped: "Not in FPL — Fantrax carries academy and fringe players the Premier League game does not list.",
  unbridged: "Not mapped yet. He joined the pool since the last bridge run.",
  absent: "FPL has dropped him since our snapshot, so there is nothing to join to.",
};

export default function PlayerCard({
  player: { rostered, club, opposition },
  onClose,
}: {
  player: SquadPlayerDetail;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const name = playerName(rostered);
  const footballer = isResolved(rostered) ? rostered.player : null;
  // Only when there is one match to time. A double gameweek has two kickoffs and
  // naming the first beside two chips reads as the time of both.
  const kickoff = opposition?.length === 1 ? opposition[0]?.fixture.kickoff ?? null : null;

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself; one on
      // anything inside lands on a child. That is the whole test.
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current?.close();
      }}
      className="m-auto w-[min(24rem,92vw)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/70"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="w-[5.5rem] shrink-0">
            <PitchPlayer rostered={rostered} club={club} opposition={opposition} />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight">{name}</h2>
            <p className="numeric text-2xs tracking-widest text-faint">
              {/* The position is the one his manager has him filling, not the
                  list he is eligible for — a Fantrax player can hold several. */}
              {[club?.name, rostered.slot.position, squadNumber(rostered)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3 rounded-lg border border-line bg-raised px-3 py-2">
          <span className="text-2xs uppercase tracking-widest text-faint">This gameweek</span>
          <span className="flex items-baseline gap-2">
            <span className="inline-flex w-[5.5rem] overflow-hidden rounded-[3px]">
              <FixtureChip opposition={opposition} blank="No fixture" />
            </span>
            {kickoff ? (
              <span className="numeric text-2xs text-faint">{londonDayAndTime(kickoff)}</span>
            ) : null}
          </span>
        </div>

        {/* Silent for a fit player: a "no news" panel on every card is noise on
            fifteen of them. */}
        {footballer && isDoubtful(footballer) ? (
          <div
            className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2 ${
              footballer.chanceOfPlaying === 0 ? "border-bad" : "border-mid"
            }`}
          >
            <span className="font-display text-2xs font-bold uppercase tracking-widest text-muted">
              {footballer.chanceOfPlaying === null
                ? "Doubt"
                : `${footballer.chanceOfPlaying}% chance of playing`}
            </span>
            {footballer.news ? <p className="text-sm">{footballer.news}</p> : null}
          </div>
        ) : null}

        {isResolved(rostered) ? null : (
          <p className="rounded-lg border border-line bg-raised px-3 py-2 text-2xs text-mid">
            {WHY[rostered.unresolved]}
          </p>
        )}

        <div className="flex gap-2">
          <Link
            href={`/players/${rostered.slot.fantraxId}`}
            className="min-h-11 flex-1 rounded-lg border border-line px-3 py-2.5 text-center text-sm font-medium hover:bg-raised"
          >
            Full profile
          </Link>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="min-h-11 flex-1 rounded-lg border border-line px-3 py-2.5 text-sm font-medium hover:bg-raised"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** His shirt number, when FPL publishes one. Absent for a slot with no
 *  footballer behind it, and for a January signing FPL has not numbered yet. */
function squadNumber(rostered: RosteredPlayer): string | null {
  if (!isResolved(rostered) || rostered.player.squadNumber === null) return null;
  return `#${rostered.player.squadNumber}`;
}
