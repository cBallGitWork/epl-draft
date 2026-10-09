import Image from "next/image";
import {
  type Club,
  type Opposition,
  type RosteredPlayer,
  crestUrl,
  isGoalkeeper,
  isResolved,
  kickedOff,
  londonDayAndTime,
  DASH,
} from "@epl/core";
import EmptySlot from "./EmptySlot";
import PlayerImage from "./PlayerImage";
import { fdrStep } from "../football/fdr";
import { positionLabel } from "../../positions";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

// Who the man on a card is, atop both player dialogs: his photograph, his club and slot, and the fixture.
// The photograph, not a pitch card, whose name plate and points band would repeat the dialog's title bar.

export default function PlayerIdentity({
  rostered,
  club,
  opposition,
}: {
  rostered: RosteredPlayer;
  club: Club | undefined;
  opposition: Opposition[] | undefined;
}) {
  const started = kickedOff(opposition);
  // Only for a single match: beside a double's two chips, one kickoff reads as the time of both.
  const kickoff = opposition?.length === 1 ? (opposition[0]?.fixture.kickoff ?? null) : null;

  return (
    <div className="flex items-center gap-3">
      <span className="w-[var(--player-card-figure)] shrink-0 overflow-hidden">
        {isResolved(rostered) ? (
          <PlayerImage
            player={rostered.player}
            club={club}
            keeper={isGoalkeeper(rostered.slot.position)}
            kickedOff={started}
          />
        ) : (
          // Every slot on an open XI is tappable, so a card answers for one the bridge could not settle too.
          <EmptySlot label={positionLabel(rostered.slot.position) ?? "?"} />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* The slot his manager has him in, not every position he is eligible for. */}
        <p className="truncate text-sm text-muted">
          {[club?.name, positionLabel(rostered.slot.position)].filter(Boolean).join(" · ") || DASH}
        </p>
        <Fixture club={club} opposition={opposition} />
        {/* Nothing to come for a man with no fixture: "No fixture" above already says so. */}
        {started || opposition === undefined || opposition.length === 0 ? null : (
          <p className={QUIET_FIGURE}>
            {kickoff ? `Kicks off ${londonDayAndTime(kickoff)}` : "Yet to play"}
          </p>
        )}
      </div>
    </div>
  );
}

/** His club's crest, a "v", and each opponent, `@` when away; shares `fdrStep`'s colour, not a chip's layout. */
function Fixture({
  club,
  opposition,
}: {
  club: Club | undefined;
  opposition: Opposition[] | undefined;
}) {
  return (
    <p className="flex flex-wrap items-center gap-1.5">
      {club === undefined ? null : (
        // Decorative: the line above names his club in full.
        <Image src={crestUrl(club)} alt="" width={18} height={18} className="shrink-0" />
      )}
      {opposition === undefined || opposition.length === 0 ? (
        <span className={LABEL}>No fixture</span>
      ) : (
        <>
          <span className="text-2xs text-faint">v</span>
          {/* One chip per fixture: none in a blank gameweek, two in a double, each rated on its own. */}
          {opposition.map((against) => (
            <span
              key={against.fixture.id}
              className={`numeric px-1.5 py-0.5 text-sm font-bold leading-snug ${fdrStep(against.difficulty).ink}`}
              style={{ backgroundColor: fdrStep(against.difficulty).ground }}
            >
              {against.home ? "" : "@"}
              {against.club.shortName}
            </span>
          ))}
        </>
      )}
    </p>
  );
}
