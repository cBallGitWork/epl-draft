"use client";

import { useEffect, useState } from "react";
import {
  type SquadPlayerDetail,
  isDoubtful,
  isResolved,
  fullPlayerName,
  kickedOff,
  londonDayAndDate,
  londonTime,
  noteBesideChance,
} from "@epl/core";
import DialogFoot from "../shell/DialogFoot";
import DialogHead from "../shell/DialogHead";
import Modal from "../shell/Modal";
import FullMatchStats from "./FullMatchStats";
import MinutesRun from "./MinutesRun";
import Note from "./Note";
import PlayerIdentity from "./PlayerIdentity";
import { unresolvedReason } from "../../unresolved";
import { playerHref } from "../../players/routes";
import { latestNews } from "../../players/[fantraxId]/latestNews";
import { filedAt, noteBody, type NewsItem } from "../../players/[fantraxId]/newsItems";
import { LABEL, QUIET_FIGURE, SMALL_CAPS } from "@/app/desk";

// One player over the squad or match he was tapped from: who he is, whether he is fit, and what he did once his match
// has kicked off. `LivePlayerCard` is the same dialog with Fantrax's breakdown in the middle.

export default function PlayerCard({
  player: { rostered, club, opposition, minutes },
  onClose,
}: {
  player: SquadPlayerDetail;
  onClose: () => void;
}) {
  const footballer = isResolved(rostered) ? rostered.player : null;
  const fantraxId = rostered.slot.fantraxId;
  // His newest Fantrax note, read on open. A read that fails costs the card the block, as on his News tab.
  const [story, setStory] = useState<NewsItem | null>(null);
  useEffect(() => {
    let open = true;
    latestNews(fantraxId).then(
      (item) => open && setStory(item),
      () => undefined,
    );
    return () => {
      open = false;
    };
  }, [fantraxId]);

  return (
    <Modal onClose={onClose} width="24rem">
      <DialogHead title={fullPlayerName(rostered)} club={club?.shortName ?? null} />

      <div className="flex flex-col gap-2 p-3">
        <PlayerIdentity rostered={rostered} club={club} opposition={opposition} />

        {/* Silent for a fit player: a "no news" panel on every card is noise. */}
        {footballer && isDoubtful(footballer) ? (
          <div
            className={`cm-panel flex flex-col gap-0.5 px-3 py-2 ${
              footballer.chanceOfPlaying === 0 ? "border-bad" : "border-mid"
            }`}
          >
            <span className={`${SMALL_CAPS} text-muted`}>
              {footballer.chanceOfPlaying === null
                ? "Doubt"
                : `${footballer.chanceOfPlaying}% chance of playing`}
            </span>
            {footballer.news ? (
              <p className="text-sm">{noteBesideChance(footballer.news, footballer.chanceOfPlaying)}</p>
            ) : null}
          </div>
        ) : null}

        {isResolved(rostered) && kickedOff(opposition) ? (
          <FullMatchStats
            stats={rostered.stats}
            opta={rostered.player.optaCode}
            position={rostered.slot.position}
            opposition={opposition}
          />
        ) : null}

        <MinutesRun weeks={minutes} />

        {story ? <Story story={story} /> : null}

        {isResolved(rostered) ? null : <Note>{unresolvedReason(rostered.unresolved)}</Note>}

        <DialogFoot
          href={playerHref(fantraxId)}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
}

/** Fantrax's newest note on him, whole and dated: the headline, the rest of the story, the analysis. */
function Story({ story }: { story: NewsItem }) {
  const at = filedAt(story);
  return (
    <section className="cm-panel flex flex-col gap-1.5 px-3 py-2">
      <p className="flex items-baseline justify-between gap-2">
        <span className={LABEL}>News</span>
        {at === null ? null : (
          <span className={QUIET_FIGURE}>
            {londonDayAndDate(at)} {londonTime(at)}
          </span>
        )}
      </p>
      <p className="text-sm font-bold leading-snug text-ink">{story.headline}</p>
      {noteBody(story).map((paragraph) => (
        <p key={paragraph} className="text-sm leading-snug text-ink">
          {paragraph}
        </p>
      ))}
    </section>
  );
}
