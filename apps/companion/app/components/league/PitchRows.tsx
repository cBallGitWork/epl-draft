import type { CSSProperties, ReactNode } from "react";
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
 *  disagree — which is the same trap `PlayerPortrait` records for `sizes`.
 *
 *  `GAP_CLASS` is exported for the same reason `cardBasis` is: the two bench
 *  strips size their cards with the arithmetic and would otherwise write the
 *  class out by hand, so changing `GAP` here would silently misalign a strip
 *  from the grass above it — which is the defect this file was already twice
 *  amended to remove. */
const GAP = "0.5rem";
export const GAP_CLASS = "gap-x-2";
/** 110px, which is the width of the Premier League's own portrait file — 110×140
 *  — and therefore the point at which a wider card would be upscaling the one
 *  photograph it exists to show.
 *
 *  It was 4.35rem, and that pinned the card from about a 768px frame upward: with
 *  `--page-frame` at 72rem the pitch has 1152px to spend and was spending 69.6 of
 *  them per man. A desktop printed a nine-pixel name for want of a ceiling rather
 *  than for want of room. */
const MAX_CARD = "6.875rem";

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

/** How many rows the card's HEIGHT is bounded against — the formation's own
 *  count, handed to `.pitch-figure` in `globals.css`.
 *
 *  The card has two bounds and they come from opposite directions. Width is a
 *  share of the fullest LINE, so a crowded line makes a narrow card. Height is a
 *  share of the screen divided by the number of ROWS, because that is what the
 *  pitch has to fit into. Tying height to width instead — which is what a bare
 *  `aspect-ratio` does — inverts the hard case: a 1-3-4-3 has a fuller row-count
 *  budget and a slacker line, so it drew the TALLEST card of any squad in the
 *  league and put the lineup planner 199px past a phone screen.
 *
 *  Exported because the two bench strips stand outside this frame and must land
 *  on the same number: a reserve is the same card as the man he would replace,
 *  in height as well as width. */
export function rowBudget(rows: number): CSSProperties {
  return { "--pitch-rows": rows } as CSSProperties;
}

/** The size a player's name is set at on a pitch. One step on the scale, and the
 *  same step on every line of every squad.
 *
 *  **The card shrinks; the type never does.** It used to be
 *  `clamp(7px, 13cqw, 11px)` — a share of the CARD — so a crowded line took its
 *  width out of the name, and a line of seven printed it at the clamp's floor of
 *  seven pixels. That is backwards: the card is the thing a crowded line can
 *  afford to give up, and the name is what the reader came for. The ceiling was
 *  unreachable at every width this app is ever drawn at, so the clamp only ever
 *  expressed its floor — which is the exception DESIGN.md §8 recorded, and this
 *  closes it.
 *
 *  A line so full that the plate cannot hold a name does not shrink it either:
 *  it truncates. That is the whole graceful end of the rule — there is no
 *  smaller thing to say instead, because FPL's `squad_number` is null on every
 *  one of its 622 elements.
 *
 *  A token and never a component. The three plates it sets genuinely differ — a
 *  cream band across the pitch, and the team of the week's dark rounded strip —
 *  and a shared component reconciling them would be the §1 abstraction that is
 *  forbidden. Only the size was ever the same.
 *
 *  ONE size, and that is a decision rather than a default. It used to step down
 *  in three bands by name length so a long name survived whole, which kept the
 *  words and lost the line: eleven cards in three type sizes read as eleven
 *  different components, and the two men whose names had been shrunk were the
 *  ones a manager could no longer scan. Craig's call, 22 Aug — same size, same
 *  font, truncate the long ones.
 *
 *  The plate is a fixed band with the name centred in it, for the same reason:
 *  type set on its own line height made every plate a different height, so
 *  Haaland and João Pedro stood at different heights in the same row. */
export const NAME_SIZE = "text-2xs";

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
          // The whole set's row count, not this row's index: every card on the
          // pitch is bounded by the same share of the screen, or a line would
          // stand at a different height from the line above it.
          style={rowBudget(rows.length)}
          // Shrinks rather than wraps. A back five is an ordinary line and does
          // not fit five cards at full width on a phone — wrapping put one
          // defender on a row of his own below the other four, which reads as a
          // formation nobody picked. They give up width instead — and only they
          // do: the type inside is on the scale and does not come down with the
          // card.
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
