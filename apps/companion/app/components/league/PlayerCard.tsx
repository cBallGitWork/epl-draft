"use client";

import Link from "next/link";
import { type SquadPlayerDetail, isDoubtful, isResolved, playerName } from "@epl/core";
import Modal from "../shell/Modal";
import FixtureChip from "../football/FixtureChip";
import PitchPlayer from "./PitchPlayer";
import Note from "./Note";
import { londonDayAndTime } from "../../londonTime";
import { positionLabel } from "../../positions";
import { unresolvedReason } from "../../unresolved";
import { BUTTON } from "../shell/ButtonLink";
import { QUIET_FIGURE } from "@/app/desk";

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

export default function PlayerCard({
  player: { rostered, club, opposition, points },
  onClose,
}: {
  player: SquadPlayerDetail;
  onClose: () => void;
}) {
  const name = playerName(rostered);
  const footballer = isResolved(rostered) ? rostered.player : null;
  // Only when there is one match to time. A double gameweek has two kickoffs and
  // naming the first beside two chips reads as the time of both.
  const kickoff = opposition?.length === 1 ? opposition[0]?.fixture.kickoff ?? null : null;

  return (
    <Modal onClose={onClose} width="24rem">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="w-[var(--player-card-figure)] shrink-0">
            <PitchPlayer rostered={rostered} club={club} opposition={opposition} points={points} />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold tracking-tight">{name}</h2>
            <p className={QUIET_FIGURE}>
              {/* The position is the one his manager has him filling, not the
                  list he is eligible for — a Fantrax player can hold several. */}
              {[club?.name, positionLabel(rostered.slot.position)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3 border border-line bg-raised px-3 py-2">
          <span className="text-2xs uppercase text-faint">This gameweek</span>
          <span className="flex items-baseline gap-2">
            <span className="inline-flex w-[var(--player-card-figure)] overflow-hidden">
              <FixtureChip opposition={opposition} blank="No fixture" />
            </span>
            {kickoff ? (
              <span className={QUIET_FIGURE}>{londonDayAndTime(kickoff)}</span>
            ) : null}
          </span>
        </div>

        {/* Silent for a fit player: a "no news" panel on every card is noise on
            fifteen of them. */}
        {footballer && isDoubtful(footballer) ? (
          <div
            className={`flex flex-col gap-0.5 border px-3 py-2 ${
 footballer.chanceOfPlaying === 0 ?"border-bad":"border-mid"
}`}
          >
            <span className="font-display text-2xs font-bold uppercase text-muted">
              {footballer.chanceOfPlaying === null
                ? "Doubt"
                : `${footballer.chanceOfPlaying}% chance of playing`}
            </span>
            {footballer.news ? <p className="text-sm">{footballer.news}</p> : null}
          </div>
        ) : null}

        {isResolved(rostered) ? null : (
          <Note>
            {unresolvedReason(rostered.unresolved)}
          </Note>
        )}

        <div className="flex gap-2">
          <Link
            href={`/players/${rostered.slot.fantraxId}`}
            className={`${BUTTON} flex-1`}
          >
            Full profile
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={`${BUTTON} flex-1`}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

