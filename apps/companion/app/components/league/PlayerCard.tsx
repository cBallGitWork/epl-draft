"use client";

import { type SquadPlayerDetail, isDoubtful, isResolved, fullPlayerName } from "@epl/core";
import DialogFoot from "../shell/DialogFoot";
import DialogHead from "../shell/DialogHead";
import Modal from "../shell/Modal";
import Note from "./Note";
import PlayerIdentity from "./PlayerIdentity";
import { unresolvedReason } from "../../unresolved";
import { playerHref } from "../../players/routes";
import { SMALL_CAPS } from "@/app/desk";

// One player, over the squad rather than instead of it.
//
// A dialog and not a route: the question a tap asks is "who is this, and is he
// fit" while reading somebody else's fifteen, and navigating away to answer it
// loses the squad the manager was reading. The way out to the full profile is
// still offered, because that page knows things this one cannot fit.
//
// **It is `LivePlayerCard` with a different middle**, and that is the whole
// design. Both are a dialog about one rostered man: the bar, the identity block
// and the foot are the same object, and what differs is the question. This one
// is read midweek and answers "is he fit"; that one is read with a score on the
// screen and answers "why is he on that number".
//
// It was a web card until 21 Sep 2026 — no title bar, a hairline panel, the
// opponent stretched across 88px, and his name printed twice because the sticker
// carries a name plate of its own. Craig had already said all of that about the
// live card ("its not very CM like", "the long fixture graphics looks crap");
// this is the same screen one tab over and it kept every fault.

export default function PlayerCard({
  player: { rostered, club, opposition },
  onClose,
}: {
  player: SquadPlayerDetail;
  onClose: () => void;
}) {
  const footballer = isResolved(rostered) ? rostered.player : null;

  return (
    <Modal onClose={onClose} width="24rem">
      <DialogHead title={fullPlayerName(rostered)} club={club?.shortName ?? null} />

      <div className="flex flex-col gap-2 p-3">
        <PlayerIdentity rostered={rostered} club={club} opposition={opposition} />

        {/* Silent for a fit player: a "no news" panel on every card is noise on
            fifteen of them. */}
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
            {footballer.news ? <p className="text-sm">{footballer.news}</p> : null}
          </div>
        ) : null}

        {isResolved(rostered) ? null : <Note>{unresolvedReason(rostered.unresolved)}</Note>}

        <DialogFoot
          href={playerHref(rostered.slot.fantraxId)}
          label="Full profile"
          onClose={onClose}
        />
      </div>
    </Modal>
  );
}
