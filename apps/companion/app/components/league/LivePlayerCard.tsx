"use client";

import {
  type BreakdownLine,
  type PlayerStory,
  type SquadPlayerDetail,
  contribution,
  fullPlayerName,
  isResolved,
  kickedOff,
  londonDayAndTime,
} from "@epl/core";
import DialogFoot from "../shell/DialogFoot";
import DialogHead from "../shell/DialogHead";
import Modal from "../shell/Modal";
import Breakdown from "./Breakdown";
import FplRecords from "./FplRecords";
import PlayerIdentity from "./PlayerIdentity";
import Note from "./Note";
import { playerHref } from "../../players/routes";
import { unresolvedReason } from "../../unresolved";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

// What a player is scoring, and why.
//
// A second card rather than a wider `PlayerCard`: that one is "who is this, and
// is he fit", read midweek. This is read at ten past four, and the only question
// is which categories put him where he is.
//
// Every number in the breakdown is Fantrax's, under our league's own scoring,
// and the parts add up to the whole exactly. What he *did* is FPL's, joined
// through the identity bridge, and sits under its own heading.
//
// The title bar is `PageHeader`'s plated mechanism in his club's colours, and it
// carries the name and nothing else (Craig, 21 Sep 2026: "prem team colour?").
// The position sits under it beside the club, where `PlayerCard` has it.

export default function LivePlayerCard({
  player: { rostered, club, opposition, points },
  breakdown,
  reserve,
  story,
  onClose,
}: {
  player: SquadPlayerDetail;
  /** His categories, largest contribution first. Empty for a player the table
   *  names on nought, and for one it does not name at all — the difference is
   *  in `points`, which is the number the table actually gave. */
  breakdown: BreakdownLine[];
  /** Whether he is on the bench this gameweek: priced, but not counted. */
  reserve: boolean;
  /** Fantrax's latest on him, or null for the great majority. The pool feed is
   *  a day wide (`poolNews.ts`), so an absent story means nothing was filed
   *  today — never that there is none. */
  story?: PlayerStory | null;
  onClose: () => void;
}) {
  const done = contribution(isResolved(rostered) ? rostered.stats : []);
  const started = kickedOff(opposition);
  return (
    <Modal onClose={onClose} width="24rem">
      <DialogHead title={fullPlayerName(rostered)} club={club?.shortName ?? null} />

      <div className="flex flex-col gap-2 p-3">
        <PlayerIdentity rostered={rostered} club={club} opposition={opposition} />

        {/* Why there is nobody behind the slot, in `PlayerCard`'s own words. */}
        {isResolved(rostered) ? null : (
          <Note>
            {unresolvedReason(rostered.unresolved)}
          </Note>
        )}

        {/* Nothing to explain before he has been on. An empty table under a live
            score reads as a score of nought, which is a different claim. */}
        {started ? (
          <>
            <Breakdown
              breakdown={breakdown}
              points={points}
              reserve={reserve}
              minutes={done.minutes}
            />
            <FplRecords done={done} />
          </>
        ) : null}

        {story ? <Story story={story} /> : null}

        <DialogFoot
          href={playerHref(rostered.slot.fantraxId)}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
}

/** Fantrax's own words about him, when there are any from today.
 *
 *  The body and not the headline: `headlineNoBrief` is the same sentence
 *  truncated, so printing both prints one of them twice. The analysis is a
 *  paragraph and stays on the profile — this card is read with a match on. */
function Story({ story }: { story: PlayerStory }) {
  return (
    <div className="cm-panel flex flex-col gap-1 px-2 py-1.5">
      <p className="flex items-baseline justify-between gap-2">
        <span className={LABEL}>News</span>
        {story.at === null ? null : (
          <span className={QUIET_FIGURE}>
            {londonDayAndTime(new Date(story.at).toISOString())}
          </span>
        )}
      </p>
      <p className="text-sm leading-snug text-ink">{story.content}</p>
    </div>
  );
}
