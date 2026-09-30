import type { Blocker, Move, SlotOption } from "@epl/core";
import { LABEL } from "@/app/desk";
import { swapGroups } from "./moveGroups";

// The sheet under a tapped player: everywhere he can go, and why he cannot go
// anywhere else.
//
// No `"use client"` of its own. Only the boundary file needs the directive, and
// the planner that renders this is already across it.

/** Why a position is closed, in the manager's words. `unknown-eligibility` is
 *  deliberately blunt: it means our data is missing, not that Fantrax refused. */
const BLOCKED: Record<Blocker, string> = {
  "not-eligible": "not eligible",
  "position-full": "position full",
  "squad-full": "XI is full",
  "unknown-eligibility": "eligibility unknown",
};

function Action({ label, onPlay }: { label: string; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="cm-bevel flex min-h-11 w-full items-center px-3 text-left text-sm font-medium hover:brightness-110 lg:min-h-9"
    >
      {label}
    </button>
  );
}

export default function MoveSheet({
  subject,
  moves,
  options,
  nameOf,
  onPlay,
}: {
  /** The tapped man, whose side of each swap the sheet speaks from. */
  subject: string;
  moves: Move[];
  options: SlotOption[];
  nameOf: (id: string) => string;
  onPlay: (move: Move) => void;
}) {
  // One heading per position for a reserve, one list of who could come on for a man in the side.
  const groups = swapGroups(moves, subject, nameOf);
  // Positions he himself reaches by a swap, whose closed note would contradict the offer.
  const swapped = new Set(moves.flatMap((move) => (move.kind === "swap" && move.fantraxId === subject ? [move.to] : [])));
  const direct = moves.filter((move) => move.kind !== "swap");

  return (
    <div className="mt-1 flex flex-col gap-2 border border-line bg-raised p-2">
      {direct.length > 0 ? (
        <div className="flex flex-col gap-1">
          {direct.map((move) => (
            <Action
              key={move.kind + ("to" in move ? move.to : "")}
              label={
                move.kind === "demote"
                  ? "Move to reserves"
                  : `${move.kind === "promote" ? "Start" : "Move"} at ${move.to}`
              }
              onPlay={() => onPlay(move)}
            />
          ))}
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.heading} className="flex flex-col gap-1">
          <h4 className={`px-1 font-display ${LABEL}`}>{group.heading}</h4>
          {group.options.map((option) => (
            <Action key={option.key} label={option.label} onPlay={() => onPlay(option.move)} />
          ))}
        </div>
      ))}

      {/* Closed positions are listed WITH their reason. "Why can't he play
          there" is the question, and a list of only the possibilities cannot
          answer it.

          Except where a move above already reaches the position. A full XI
          reports every position as `squad-full` and is answered by a swap out of
          any of them, so the sheet was offering eight ways into midfield and
          then saying midfield was closed. */}
      {options
        .filter((option) => !option.open && option.blockedBy && !swapped.has(option.position))
        .map((option) => (
          <p key={option.position} className="px-3 text-2xs text-faint">
            {option.position} — {option.blockedBy ? BLOCKED[option.blockedBy] : null}
          </p>
        ))}

      {moves.length === 0 ? (
        <p className="px-3 py-1 text-2xs text-faint">Nowhere to move him.</p>
      ) : null}
    </div>
  );
}
