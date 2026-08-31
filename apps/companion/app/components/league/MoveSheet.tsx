import type { Blocker, Move, SlotOption } from "@epl/core";

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
      className="min-h-11 border border-line bg-surface px-3 text-left text-sm font-medium hover:bg-raised"
    >
      {label}
    </button>
  );
}

export default function MoveSheet({
  moves,
  options,
  nameOf,
  onPlay,
}: {
  moves: Move[];
  options: SlotOption[];
  nameOf: (id: string) => string;
  onPlay: (move: Move) => void;
}) {
  // Swaps are grouped by where he is going, and the rest are listed as they are.
  //
  // A full XI is the ordinary state of a team, and every position is then
  // reachable only by a swap — which is fourteen buttons on this squad, each
  // repeating "Start at M for" in front of a name. Grouped, the manager picks
  // the position once and then reads eleven names.
  const swaps = new Map<string, Extract<Move, { kind: "swap" }>[]>();
  const direct: Move[] = [];

  for (const move of moves) {
    if (move.kind !== "swap") {
      direct.push(move);
      continue;
    }
    const to = swaps.get(move.to);
    if (to) to.push(move);
    else swaps.set(move.to, [move]);
  }

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

      {[...swaps.entries()].map(([position, group]) => (
        <div key={position} className="flex flex-col gap-1">
          <h4 className="px-1 font-display text-2xs font-bold uppercase text-faint">
            Start at {position} — who comes off?
          </h4>
          {group.map((move) => (
            <Action
              key={move.withId}
              label={nameOf(move.withId)}
              onPlay={() => onPlay(move)}
            />
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
        .filter((option) => !option.open && option.blockedBy && !swaps.has(option.position))
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
