"use client";

import { useState } from "react";
import type { BreakdownLine, SquadDetailLine, SquadPlayerDetail } from "@epl/core";
import { playerName } from "@epl/core";
import LivePlayerCard from "./LivePlayerCard";
import PitchPlayer from "./PitchPlayer";
import PitchRows from "./PitchRows";
import SquadRows from "./SquadRows";
import { positionLabel } from "../../positions";

// A team as it lines up on a day that counts: the eleven on the grass, the
// reserves in a strip under them, and every one of them a way into what he is
// scoring.
//
// It replaced a server-rendered pitch, and the tap is the whole reason. A live
// board that shows a manager 47 points and eleven faces, and answers nothing
// when he presses one of them, has stopped one question short of the one he is
// asking.
//
// The rows come from counting active players per position, because Fantrax has
// no formation field — see `join/lineup.ts`. FPL solves the same problem with
// eight hardcoded row components, one per formation it allows; we cannot, since
// our position caps are commissioner-set and a 1-5-2-3 is legal here.
//
// One mode per instance rather than a toggle of its own: the head-to-head board
// already owns a Pitch/List control shared by both sides, and a second one
// inside each side would be two controls saying the same thing.

export default function TeamSheet({
  rows,
  bench,
  lines,
  breakdown,
  projected,
  mode,
}: {
  /** The XI in its positional lines, arranged on the server — `slot.status` is
   *  blanked on the way here, so this is the last shape that knows the split. */
  rows: SquadDetailLine[];
  bench: SquadPlayerDetail[];
  /** The same squad grouped for the list, reserves among the starters. */
  lines: SquadDetailLine[];
  /** Each player's points broken into the league's own scoring categories,
   *  keyed by Fantrax id. Empty when Fantrax refused the table. */
  breakdown: Record<string, BreakdownLine[]>;
  projected: boolean;
  mode: "pitch" | "list";
}) {
  const [open, setOpen] = useState<SquadPlayerDetail | null>(null);

  return (
    <div className="flex flex-col">
      {mode === "pitch" ? (
        <>
          <PitchRows
            rows={rows.map((line) => ({ label: line.position, players: line.players }))}
            keyOf={(player) => player.rostered.slot.fantraxId}
          >
            {(player) => <Cell player={player} onOpen={() => setOpen(player)} />}
          </PitchRows>

          {bench.length > 0 ? (
            // Off the pitch, and off the grass. A bench on green of its own put
            // four cut-outs on the same colour they were standing on ten pixels
            // above, with nothing but a shade between the two — the players
            // stopped being on a pitch and the bench stopped being a bench.
            <section className="bleed border-t border-line bg-surface px-2 pb-2 pt-2">
              <ul className="flex justify-center gap-2">
                {bench.map((player) => (
                  <li
                    key={player.rostered.slot.fantraxId}
                    className="min-w-0 flex-1 max-w-[3.3rem]"
                  >
                    <p className="pb-0.5 text-center font-display text-[0.5625rem] font-bold uppercase tracking-widest text-faint">
                      {positionLabel(player.rostered.slot.position) ?? "—"}
                    </p>
                    <Cell player={player} onOpen={() => setOpen(player)} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <SquadRows lines={lines} projected={projected} onOpen={setOpen} />
      )}

      {open ? (
        <LivePlayerCard
          // Remounts per player, so the dialog opens from a clean state rather
          // than needing an effect to keep `showModal` in step with the choice.
          key={open.rostered.slot.fantraxId}
          player={open}
          breakdown={breakdown[open.rostered.slot.fantraxId] ?? []}
          projected={projected}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

function Cell({ player, onOpen }: { player: SquadPlayerDetail; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      // Named, because five buttons labelled "D" tell a screen reader nothing
      // about which of the five it is on.
      aria-label={playerName(player.rostered)}
      className="block w-full"
    >
      <PitchPlayer
        rostered={player.rostered}
        club={player.club}
        opposition={player.opposition}
        points={player.points}
      />
    </button>
  );
}
