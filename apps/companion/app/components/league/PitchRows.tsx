import type { CSSProperties, ReactNode } from "react";
import CmGround from "./CmGround";

// Players in their lines on a pitch; each caller supplies the cell. Every card takes the fullest line's width.

/** Values as well as a class: `cardBasis` subtracts the gaps, and the bench strips size by `GAP_CLASS`. */
const GAP = "0.5rem";
export const GAP_CLASS = "gap-x-2";
/** 110px, the width of the Premier League's portrait file; a wider card would upscale it. */
const MAX_CARD = "6.875rem";

/** The fullest line in a set; the bench strips read it so a reserve matches the men above. */
export function widestLine(
  rows: readonly { players: readonly unknown[] }[],
): number {
  return Math.max(1, ...rows.map((row) => row.players.length));
}

/** How far a row of cards stands in from the ground's edge, as a percentage; the bench strip pads by it. */
export const FAR_INSET = 5;

/** A card's width as a share of its row, so a strip outside the ground must take the pitch's inset to match. */
export function cardBasis(widest: number): string {
  return `min(${MAX_CARD}, calc((100% - ${widest - 1} * ${GAP}) / ${widest}))`;
}

/** The row count `.pitch-figure` in `globals.css` bounds a card's height by; the bench strip passes the same. */
export function rowBudget(rows: number): CSSProperties {
  return { "--pitch-rows": rows } as CSSProperties;
}

/** A reserve's kit as a share of a starter's; his name plate and fixture band stay full size. */
export const BENCH_KIT = { "--pitch-card-scale": 0.75 } as CSSProperties;

/** One line of a pitch card: a fixed band height, centred, truncating rather than wrapping.
 *  The height is load-bearing: `.pitch-figure` subtracts exactly `2 * --pitch-band` from a row's room. */
export const PITCH_BAND =
  "flex h-[var(--pitch-band)] w-full items-center justify-center overflow-hidden px-0.5 text-center font-bold leading-none";

/** One name size on every line of a pitch: a crowded card truncates the name, never shrinks it. */
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
  inColumn = false,
  children,
}: {
  rows: PitchRow<T>[];
  keyOf: (player: T) => string;
  /** Passed to `CmGround`: fill the column instead of bleeding. */
  inColumn?: boolean;
  /** A fullest-line count shared by two pitches toggled in one view, so the cards hold still. */
  widest?: number;
  children: (player: T) => ReactNode;
}) {
  // Read from the rows, not the league's position caps: this may not be the whole squad.
  const widest = agreed ?? widestLine(rows);

  // Keeper at the top: rows are drawn as given, goal-first, and `CmGround` draws its goal at the top.
  // Flip the view, never an arrangement: `lineup()` derives the shape string from the line order.
  const lines = rows.map((row) => (
    <ul
      key={row.label}
      // The whole set's row count, not this row's index, or lines would stand at different heights.
      style={rowBudget(rows.length)}
      // Shrinks rather than wraps: a back five gives up card width, never type size.
      className={`flex items-start justify-center ${GAP_CLASS}`}
      aria-label={`${row.label} — ${row.players.length}`}
    >
      {row.players.map((player) => (
        <li
          key={keyOf(player)}
          className="min-w-0 shrink-0"
          // Fixed, not flexed: the fullest line's share, given to every card on every line.
          style={{ flexBasis: cardBasis(widest) }}
        >
          {children(player)}
        </li>
      ))}
    </ul>
  ));

  return <CmGround inColumn={inColumn}>{lines}</CmGround>;
}
