import type { ReactNode } from "react";
import PitchFrame from "./PitchFrame";

// Players in their lines on a pitch, whatever a line is made of.
//
// Three screens draw this — a rival's XI while his period is open, a rival's
// whole squad before it, and your own lineup — and they had drifted into three
// answers to the same two questions: how wide is a card, and what happens when a
// line will not fit. One of them still wrapped and used sizes from an earlier
// design, which is exactly the drift the rule of three exists to stop.
//
// What varies between them is the cell, and only the cell, so that is the part
// each caller supplies.

export interface PitchRow<T> {
  /** The position, or whatever names this line. Also its key. */
  label: string;
  players: T[];
}

export default function PitchRows<T>({
  rows,
  keyOf,
  children,
}: {
  rows: PitchRow<T>[];
  keyOf: (player: T) => string;
  children: (player: T) => ReactNode;
}) {
  return (
    <PitchFrame>
      {rows.map((row) => (
        <ul
          key={row.label}
          // Shrinks rather than wraps. A back five is an ordinary line and does
          // not fit five cards at full width on a phone — wrapping put one
          // defender on a row of his own below the other four, which reads as a
          // formation nobody picked. They give up width instead, and the name
          // inside is sized in container units so it comes with them.
          className="flex items-start justify-center gap-x-2"
          aria-label={`${row.label} — ${row.players.length}`}
        >
          {row.players.map((player) => (
            <li key={keyOf(player)} className="min-w-0 flex-1 max-w-[4.35rem]">
              {children(player)}
            </li>
          ))}
        </ul>
      ))}
    </PitchFrame>
  );
}
