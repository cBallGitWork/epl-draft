"use client";

import { useState } from "react";
import type { SquadDetailLine, SquadPlayerDetail, SquadReason } from "@epl/core";
import PlayerCard from "./PlayerCard";
import SquadRows from "./SquadRows";

// A squad with no gameweek to report: all fifteen as a list, no pitch, since the gate withholds the shape.
// It arrives joined on the server (`squadDetail`); the client boundary is here for the list and card's one selection.

/** Why the lineup is withheld, only where our side failed to read something; `not-locked` is the ordinary state. */
const EXPLANATION: Partial<Record<SquadReason, string>> = {
  "unknown-period":
    "Fantrax did not say which gameweek this squad is for, so the lineup stays hidden.",
  "no-calendar": "We cannot read the league's deadlines right now, so the lineup stays hidden.",
  "period-not-in-calendar":
    "This squad names a gameweek the calendar does not have, so the lineup stays hidden.",
  "unknown-lock":
    "We cannot work out when this gameweek's lineups lock, so the lineup stays hidden.",
};

export default function SquadBoard({
  lines,
  because,
  projected,
  eligibility,
}: {
  lines: SquadDetailLine[];
  because: SquadReason;
  /** Whether the points are Fantrax's projection, not a season played; the list then heads its column "Proj". */
  projected: boolean;
  /** Eligible positions by Fantrax id; a record, not a `Map`, as it crosses to the browser. */
  eligibility?: Record<string, string[]>;
}) {
  const [open, setOpen] = useState<SquadPlayerDetail | null>(null);

  const explanation = EXPLANATION[because];

  return (
    <div className="flex flex-col gap-2">
      {explanation ? (
        <p className="border border-line bg-surface px-3 py-2 text-2xs text-muted">
          {explanation}
        </p>
      ) : null}

      <SquadRows lines={lines} projected={projected} onOpen={setOpen} eligibility={eligibility} />

      {open ? (
        <PlayerCard
          // Remounts per player, so the dialog opens clean with no effect keeping `showModal` in step.
          key={open.rostered.slot.fantraxId}
          player={open}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
