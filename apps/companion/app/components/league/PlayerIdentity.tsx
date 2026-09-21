import Image from "next/image";
import {
  type Club,
  type Opposition,
  type RosteredPlayer,
  crestUrl,
  isGoalkeeper,
  isResolved,
  kickedOff,
} from "@epl/core";
import EmptySlot from "./EmptySlot";
import PlayerImage from "./PlayerImage";
import { fdrStep } from "../football/fdr";
import { londonDayAndTime } from "../../londonTime";
import { positionLabel } from "../../positions";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

// Who the man on a card is: his photograph, his club and slot, and the fixture.
//
// Both player dialogs open with this — the squad card read midweek and the live
// card read at ten past four. They ask different questions BELOW it and the same
// one here, so the block moved rather than being written twice.
//
// **The count is 2 and §1 says leave two alone.** It does not apply: the rule
// stops a coincidence being promoted to a pattern, and this was not two things
// that turned out alike — the second card was about to be given a hand-made copy
// of the first's thirty lines. Copying is what the rule asks for when two files
// arrived at similar shapes independently, and it is the opposite of what it
// asks for here.
//
// **The photograph alone, not a pitch card.** A marker carries a name plate and
// a points band, so a card that also has a title bar prints his name twice and
// his total twice. `LivePlayerCard` made that swap when it took a bar;
// `PlayerCard` inherits it for the same reason.

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
  // Only when there is one match to time: a double gameweek has two kickoffs,
  // and naming the first beside two chips reads as the time of both.
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
          // Every slot on an open XI is tappable, so a card answers for all
          // fifteen — including the ones the bridge could not settle.
          <EmptySlot label={positionLabel(rostered.slot.position) ?? "?"} />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* The position his manager has him filling, not the list he is
            eligible for — a Fantrax player can hold several. */}
        <p className="truncate text-sm text-muted">
          {[club?.name, positionLabel(rostered.slot.position)].filter(Boolean).join(" · ") || "—"}
        </p>
        <Fixture club={club} opposition={opposition} />
        {/* Only before he has been on. On the live card "90' played" was the
            figure its stats panel opens with; a kickoff time is not, because
            nothing below renders before one. */}
        {started ? null : (
          <p className={QUIET_FIGURE}>
            {kickoff ? `Kicks off ${londonDayAndTime(kickoff)}` : "Yet to play"}
          </p>
        )}
      </div>
    </div>
  );
}

/** His club, then who it plays: a crest, a "v", and the opponent (Craig, 21 Sep
 *  2026 — "put his team logo in and v opponent").
 *
 *  **Not the chip that used to draw this.** It filled four pixels of headroom under a sticker at
 *  `--text-3xs`, stretched edge to edge, and a card handing it 88px turns three
 *  letters into a bar with a word at one end ("the long fixture graphics looks
 *  crap"). Its own docblock says "rounding and width are the parent's business".
 *  So it shares `fdrStep` and nothing else — third consumer, and the geometry
 *  differs at all three, so the colour stays shared and the layout stays local.
 *
 *  **The `@` stays beside the "v".** It is this app's word for away in five
 *  places and Fantrax's own (`IPS 2 @MUN 5 F`): "v" says a fixture is being
 *  named, `@` says which end of it he is at. */
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
          {/* One chip per fixture: a blank gameweek has none, a double has two,
              and both halves of a double can be rated differently. */}
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
