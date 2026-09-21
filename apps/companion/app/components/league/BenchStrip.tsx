import type { ReactNode } from "react";
import type { SquadPlayerDetail } from "@epl/core";
import { FAR_INSET, GAP_CLASS, cardBasis, rowBudget } from "./PitchRows";
import { positionLabel } from "../../positions";

// The reserves, in a strip under the grass.
//
// Off the pitch and off the grass: a bench on green of its own put four cut-outs
// on the same colour they were standing on ten pixels above, with nothing but a
// shade between the two — the players stopped being on a pitch and the bench
// stopped being a bench.
//
// **Written twice until 21 Sep 2026**, on `TeamSheet` and on `LineupPitch`, and
// `PitchRows`' own docblock already records what that cost: each strip carried a
// card width of its own — 3.3rem against 3.9rem against the pitch's 4.35 — so a
// reserve stood a quarter smaller than the man he would come on for, on the same
// screen, at every width. The sizing was pulled into `PitchRows` then and the
// strip itself was left duplicated. It is extracted now because the next change
// would have been made twice: a label a reader can actually see.
//
// What the callers keep is the CELL, which is the part that genuinely differs —
// a rival's reserve opens a card, and your own is a tap target that may or may
// not be a legal substitution.

export default function BenchStrip({
  bench,
  rows,
  widest,
  inColumn = false,
  children,
}: {
  bench: SquadPlayerDetail[];
  /** The GRASS's row count, not this strip's. A reserve stands the same height
   *  as the man he would replace, and the strip is one row but is not sized as
   *  one — see `rowBudget`. */
  rows: number;
  /** The card width the pitch above agreed on. */
  widest: number;
  /** Fill the column rather than bleeding through the page's gutters — the same
   *  question `CmGround` asks, and it has to be asked twice because the grass and
   *  the strip are two elements.
   *
   *  **It was not asked here at all**, which is the whole of Craig's "pitch view
   *  doesnt fit either, goes under bench" (21 Sep 2026): beside the list at
   *  `lg`, a negative inline margin pulled the strip out of its own column and
   *  across the grass it was meant to sit under. */
  inColumn?: boolean;
  children: (player: SquadPlayerDetail) => ReactNode;
}) {
  // A manager with all fifteen active has no bench, and an empty strip is a
  // bordered full-bleed bar saying nothing.
  if (bench.length === 0) return null;

  return (
    <section
      // `pitch-strip`: the card's height budget is bounded by the grass's own
      // height as well as by the screen, and a reserve has to land on the same
      // number as the man he would replace. See `pitch.css`.
      className={`pitch-strip border-t border-line bg-surface pb-3 pt-2 ${inColumn ? "" : "bleed"}`}
    >
      {/* The pitch's own inset, not a padding of its own: `cardBasis` is a share
          of the row it stands in, so the same share is the same pixels only in a
          row the same width as the pitch column. */}
      <ul
        className={`flex justify-center ${GAP_CLASS}`}
        style={{ paddingInline: `${FAR_INSET}%`, ...rowBudget(rows) }}
      >
        {bench.map((player, at) => (
          <li
            key={player.rostered.slot.fantraxId}
            className="min-w-0 shrink-0"
            style={{ flexBasis: cardBasis(widest) }}
          >
            {/* **The order, and it reads left to right** (Craig, 21 Sep 2026:
                "bench labels are too small, cant see them (number them too, 1st
                is left)"). The position alone was set at `text-3xs` in `faint` —
                nine pixels of the quietest ink in the palette, under a card
                carrying an eleven-pixel name — so the one line on the strip that
                says what a reserve IS was the hardest thing on the screen to
                read.

                The number is the blue index block, which is where Championship
                Manager keeps an ordinal and where every board in this app that
                lists these men already keeps one. It is a position in a queue
                rather than a squad number: FPL's `squad_number` is a key that is
                present on all 622 elements and null on every one of them. */}
            <p className="flex items-center justify-center gap-1 pb-0.5 leading-none">
              <span className="cm-index numeric px-1 text-3xs">{at + 1}</span>
              <span className="font-display text-2xs font-bold uppercase text-ink">
                {positionLabel(player.rostered.slot.position) ?? "—"}
              </span>
            </p>
            {children(player)}
          </li>
        ))}
      </ul>
    </section>
  );
}
