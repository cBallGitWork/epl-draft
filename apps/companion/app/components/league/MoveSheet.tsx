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

function labelFor(move: Move, nameOf: (id: string) => string): string {
  switch (move.kind) {
    case "promote":
      return `Start at ${move.to}`;
    case "shift":
      return `Move to ${move.to}`;
    case "demote":
      return "Move to reserves";
    case "swap":
      return `Start at ${move.to} for ${nameOf(move.withId)}`;
  }
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
  return (
    <div className="mt-1 flex flex-col gap-1 rounded-lg border border-line bg-raised p-2">
      {moves.map((move) => (
        <button
          key={labelFor(move, nameOf)}
          type="button"
          onClick={() => onPlay(move)}
          className="min-h-11 rounded-md border border-line bg-surface px-3 text-left text-sm font-medium hover:bg-raised"
        >
          {labelFor(move, nameOf)}
        </button>
      ))}

      {/* Closed positions are listed WITH their reason. "Why can't he play
          there" is the question, and a list of only the possibilities cannot
          answer it. */}
      {options
        .filter((option) => !option.open && option.blockedBy)
        .map((option) => (
          <p key={option.position} className="px-3 py-1 text-2xs text-faint">
            {option.position} — {option.blockedBy ? BLOCKED[option.blockedBy] : null}
          </p>
        ))}

      {moves.length === 0 ? (
        <p className="px-3 py-1 text-2xs text-faint">Nowhere to move him.</p>
      ) : null}
    </div>
  );
}
