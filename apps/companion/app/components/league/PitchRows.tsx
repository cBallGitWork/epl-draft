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
//
// **Every card is the same width, on every line.** They used to be `flex-1`
// under a max, which sizes a card by how many are beside it: a back five got
// narrow cards and a front two got wide ones, so the same eleven men stood at
// three sizes down the pitch. The basis is now taken from the FULLEST line in
// the set and given to all of them, so a line with fewer simply centres in the
// space — which is what a formation looks like on paper.
//
// `widestLine` and `cardBasis` are exported for the bench strips, which stand
// outside this frame and under it. A reserve is the same card as the man he
// replaces and has to be the same width; both strips had drifted to a rem of
// their own.

/** The gap between two cards, and the widest a card may be drawn.
 *
 *  Both are needed as values rather than only as classes, because the card's
 *  width is computed from them: `flex-basis` has to subtract the gaps the row
 *  will actually have. Written once each so the class and the arithmetic cannot
 *  disagree — which is the same trap `PlayerPortrait` records for `sizes`. */
const GAP = "0.5rem";
const GAP_CLASS = "gap-x-2";
const MAX_CARD = "4.35rem";

/** The fullest line in a set — the line that decides the card.
 *
 *  Exported because the bench strip under two of these pitches has to draw cards
 *  the size of the men above it, and the only way to be the same size is to read
 *  the same number. Each strip was carrying a rem of its own — 3.3rem and 3.9rem
 *  against the pitch's 4.35rem — so a reserve stood a quarter smaller than the
 *  man he would come on for, on the same screen, at every width. */
export function widestLine(rows: readonly { players: readonly unknown[] }[]): number {
  return Math.max(1, ...rows.map((row) => row.players.length));
}

/** The width every card is drawn at, as a share of the row it stands in.
 *
 *  A share and not a length, so a caller outside `PitchFrame` gets the same
 *  pixels only inside a row of the same width — which is why the strips take the
 *  pitch's own inset rather than a padding of their own. */
export function cardBasis(widest: number): string {
  return `min(${MAX_CARD}, calc((100% - ${widest - 1} * ${GAP}) / ${widest}))`;
}

/** The size a player's name is set at on a pitch.
 *
 *  `13cqw` — a share of the CARD, not of the page — so a name shrinks with the
 *  card `cardBasis` chose and a back five stays readable. That is why it lives
 *  here: the container it measures is the one this file sizes.
 *
 *  A token and never a component. The three plates it sets genuinely differ — a
 *  cream band across the pitch, and the team of the week's dark rounded strip —
 *  and a shared component reconciling them would be the §1 abstraction that is
 *  forbidden. Only the size was ever the same. */
export const NAME_SIZE = "text-[clamp(7px,13cqw,11px)]";

export interface PitchRow<T> {
  /** The position, or whatever names this line. Also its key. */
  label: string;
  players: T[];
}

export default function PitchRows<T>({
  rows,
  keyOf,
  widest: agreed,
  children,
}: {
  rows: PitchRow<T>[];
  keyOf: (player: T) => string;
  /** A fullest-line count to size against instead of this pitch's own.
   *
   *  For a caller drawing TWO pitches that must agree. The head-to-head is one
   *  view toggled between two elevens, so each sizing itself redrew every man on
   *  the page when the reader tapped the other half — a 3-4-3 at 69.6px against
   *  a 3-5-2 at 64.3px. One number across both sides holds the pitch still.
   *  Omitted, a pitch answers for itself, which is right for the five screens
   *  that draw only one. */
  widest?: number;
  children: (player: T) => ReactNode;
}) {
  // The widest line decides the card, and one card decides the pitch. Read from
  // the rows rather than from the league's position caps: a keeper line of one
  // and a back five are both `rows`, and the caps would answer for a squad this
  // component may not have all of.
  const widest = agreed ?? widestLine(rows);

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
          className={`flex items-start justify-center ${GAP_CLASS}`}
          aria-label={`${row.label} — ${row.players.length}`}
        >
          {row.players.map((player) => (
            <li
              key={keyOf(player)}
              className="min-w-0 shrink-0"
              // Fixed, not flexed: the fullest line's share, given to every card
              // on every line. `max-w` keeps a two-man front line from drawing
              // cards wider than a squad screen ever wants.
              style={{ flexBasis: cardBasis(widest) }}
            >
              {children(player)}
            </li>
          ))}
        </ul>
      ))}
    </PitchFrame>
  );
}
