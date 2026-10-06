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
  matchesOver,
} from "@epl/core";
import DialogFoot from "../shell/DialogFoot";
import DialogHead from "../shell/DialogHead";
import Modal from "../shell/Modal";
import Breakdown from "./Breakdown";
import FullMatchStats from "./FullMatchStats";
import PlayerIdentity from "./PlayerIdentity";
import Note from "./Note";
import { playerHref } from "../../players/routes";
import { unresolvedReason } from "../../unresolved";
import { LABEL, QUIET_FIGURE } from "@/app/desk";

// What a player is scoring, and why: Fantrax's breakdown at his slot, then what he did under its own heading.

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
              over={matchesOver(opposition)}
            />
            {isResolved(rostered) ? (
              <FullMatchStats
                stats={rostered.stats}
                opta={rostered.player.optaCode}
                position={rostered.slot.position}
                opposition={opposition}
              />
            ) : null}
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
