"use client";

import { useState } from "react";
import type { SquadDetailLine, SquadPlayerDetail, SquadReason } from "@epl/core";
import PlayerCard from "./PlayerCard";
import SquadPitch from "./SquadPitch";
import SquadRows from "./SquadRows";
import ViewToggle, { type View } from "./ViewToggle";

// A squad with no gameweek to report: the state every squad is in most of the
// week, and the only state a rival's squad is ever in before its lineups lock.
//
// Two arrangements of the same fifteen and one card over the top of them. The
// client boundary is here rather than lower down because all three share one
// selection: tapping a face on the pitch and tapping a row in the list have to
// open the same card, or the two views are two features.
//
// It is handed the squad already joined to its clubs, fixtures and points
// (`squadDetail`). That join is a server job: it is pure, it is tested, and
// doing it here would mean shipping every club in the league and every fixture
// in the round to a phone so fifteen players could look two of them up.

/** Why the lineup is being withheld — and only for the reasons a reader could
 *  not otherwise work out.
 *
 *  `not-locked` is deliberately absent. It is the ordinary state of every squad
 *  for most of every week, the header already says "squad", and a paragraph
 *  explaining the normal case cost the pitch a screenful of height on a phone.
 *  The rest are our side failing to read something, and a squad that silently
 *  withheld a lineup because our calendar was missing would look like the rule
 *  when it is a fault. */
const EXPLANATION: Partial<Record<SquadReason, string>> = {
  "unknown-period":
    "Fantrax did not say which gameweek this squad is for, so the lineup stays hidden.",
  "no-calendar": "We cannot read the league's deadlines right now, so the lineup stays hidden.",
  "period-not-in-calendar":
    "This squad names a gameweek the calendar does not have, so the lineup stays hidden.",
  "unknown-lock":
    "We cannot work out when this round's lineups lock, so the lineup stays hidden.",
};

export default function SquadBoard({
  lines,
  because,
  projected,
}: {
  lines: SquadDetailLine[];
  because: SquadReason;
  /** Whether the points on those lines are Fantrax's projection rather than a
   *  season played. Never dropped, only moved: Fantrax answers a PROJECTION
   *  unless the year-to-date code is both known and honoured, so the list heads
   *  its column "Proj" instead of "FPts". A points column that silently switched
   *  between a projection and a season total is the confident wrong answer, and
   *  a heading costs no height where a sentence cost a screenful. */
  projected: boolean;
}) {
  const [view, setView] = useState<View>("pitch");
  const [open, setOpen] = useState<SquadPlayerDetail | null>(null);

  const explanation = EXPLANATION[because];
  const players = lines.reduce((total, line) => total + line.players.length, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <ViewToggle view={view} onPick={setView} />
        <span className="numeric text-2xs text-faint">{players} players</span>
      </div>

      {explanation ? (
        <p className=" border border-line bg-surface px-3 py-2 text-2xs text-muted">
          {explanation}
        </p>
      ) : null}

      {view === "pitch" ? (
        <SquadPitch lines={lines} onOpen={setOpen} />
      ) : (
        <SquadRows lines={lines} projected={projected} onOpen={setOpen} />
      )}

      {open ? (
        <PlayerCard
          // Remounts per player, so the dialog opens from a clean state rather
          // than needing an effect to keep `showModal` in step with the choice.
          key={open.rostered.slot.fantraxId}
          player={open}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
