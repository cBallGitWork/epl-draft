import type { ReactNode } from "react";
import type { SquadPlayerDetail } from "@epl/core";
import { BENCH_KIT, FAR_INSET, GAP_CLASS, cardBasis, rowBudget } from "./PitchRows";
import { positionLabel } from "../../positions";
import { DASH } from "@epl/core";
import { SMALL_CAPS } from "@/app/desk";

// The reserves in a strip under the grass; the caller draws each cell.

export default function BenchStrip({
  bench,
  rows,
  widest,
  inColumn = false,
  children,
}: {
  bench: SquadPlayerDetail[];
  /** The grass's row count, not this strip's, or a reserve outgrows the man he would replace. */
  rows: number;
  /** The card width the pitch above agreed on. */
  widest: number;
  /** Fill the column rather than bleed through the gutters; beside the list a bleed drags the strip across the grass. */
  inColumn?: boolean;
  children: (player: SquadPlayerDetail) => ReactNode;
}) {
  // No reserves: no strip, rather than an empty bordered bar.
  if (bench.length === 0) return null;

  return (
    <section
      // `pitch-strip` bounds the card height by the grass as well as the screen; see `pitch.css`.
      className={`pitch-strip border-t border-line bg-surface pb-3 pt-2 ${inColumn ? "" : "bleed"}`}
    >
      {/* The pitch's own inset: `cardBasis` is a share of the row, so the row must match the pitch's width. */}
      <ul
        className={`flex justify-center ${GAP_CLASS}`}
        style={{ paddingInline: `${FAR_INSET}%`, ...rowBudget(rows), ...BENCH_KIT }}
      >
        {bench.map((player, at) => (
          <li
            key={player.rostered.slot.fantraxId}
            className="min-w-0 shrink-0"
            style={{ flexBasis: cardBasis(widest) }}
          >
            {/* Bench order from the left, not a squad number (FPL's `squad_number` is always null). */}
            <p className="flex items-center justify-center gap-1 pb-0.5 leading-none">
              <span className="cm-index numeric px-1 text-3xs">{at + 1}</span>
              <span className={`font-display ${SMALL_CAPS} text-ink`}>
                {positionLabel(player.rostered.slot.position) ?? DASH}
              </span>
            </p>
            {children(player)}
          </li>
        ))}
      </ul>
    </section>
  );
}
