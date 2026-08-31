import type { Opposition } from "@epl/core";

// Who a club plays this round, coloured by how hard FPL thinks it is.
//
// The colour is the point. "NEW (A)" is three letters that mean nothing to a
// reader who does not hold the table in their head, and the same three letters
// on a red ground mean "he has a week off" without being read at all.
//
// The rating is FPL's, never ours. Difficulty is an opinion, and the only
// defensible one to print is the one the whole fantasy world is already reading
// — which is also why an unrated fixture is drawn neutral rather than given a
// middle score we invented.
//
// One chip per fixture: a blank gameweek has none and a double has two, and both
// halves of a double can be rated differently.
//
// It is set at `--text-3xs`, the scale's last step, wherever it lands — the strip
// under a player on the grass, and the three dialogs and the list row that draw
// it at a column's width. It was a hard `0.5rem`, which is 8px, is not on the
// scale, and did not move with the card above it: the one size on a player's
// card that a wider card would not have fixed.
//
// **It never wraps.** The band under a sticker is a fixed 20px with
// `overflow-hidden` on it, so a label that takes a second line does not spill —
// it is guillotined through the middle of the glyphs, which is what "MUN (H)"
// did on a seven-across pitch once the section rail took 64px off the content
// column (measured 31 Aug 2026: a 31px cell against a 37px label). A label
// clipped at its right edge can still be read; one cut in half horizontally
// cannot. The padding is `px-0.5` for the same 6px: at nine pixels two of them
// are enough to keep the type off the chip's own edge, and four were buying
// nothing the colour was not already doing.

/** How hard, in five steps, and the ink each step carries.
 *
 *  Both halves, because contrast is a property of the pair and only the step
 *  knows which pair it is. The scale is built so 5 is DARKER than 4 rather than
 *  brighter — a hard fixture should look heavy — and past about the fourth step
 *  no dark ink survives it: black at 85% on step 5 is 2.9:1. So the last step
 *  turns its ink over, at 5.5:1.
 *
 *  Names the token rather than the colour so the scale lives in one place and a
 *  fixture chip can never introduce a sixth. Written out rather than
 *  interpolated from the number: Tailwind keeps a theme variable only when its
 *  name appears literally in the source it scans, so `var(--color-fdr-${n})`
 *  compiles to five variables that are never emitted and five chips with no
 *  colour on them — which is exactly how this shipped once. */
const STEPS: Record<number, { ground: string; ink: string }> = {
  1: { ground: "var(--color-fdr-1)", ink: "text-black/85" },
  2: { ground: "var(--color-fdr-2)", ink: "text-black/85" },
  3: { ground: "var(--color-fdr-3)", ink: "text-black/85" },
  4: { ground: "var(--color-fdr-4)", ink: "text-black/85" },
  5: { ground: "var(--color-fdr-5)", ink: "text-cream" },
};

/** An unrated fixture is drawn neutral rather than given a middle score we
 *  invented, and a rating outside their scale is treated the same way. */
const UNRATED = { ground: "var(--color-raised)", ink: "text-muted" };

/** The scale, for anything that draws a fixture by how hard it is.
 *
 *  Exported rather than copied because a second rendering of these five colours
 *  is how the scale drifts — the same mistake the chip vocabulary in
 *  `league/Chips.tsx` was pulled together to undo. The profile's fixture run
 *  needs the colours at a readable size and this chip is built to fill four
 *  pixels of headroom under a sticker, so they share the scale and nothing
 *  else. */
export function fdrStep(difficulty: number | null): { ground: string; ink: string } {
  return (difficulty === null ? undefined : STEPS[difficulty]) ?? UNRATED;
}

export default function FixtureChip({
  opposition,
  blank,
}: {
  opposition: Opposition[] | undefined;
  /** What to say when the club has no match. The word differs by the space
   *  available — a sticker's strip has three characters and a list row has a
   *  column — so the caller supplies it. */
  blank: string;
}) {
  if (opposition === undefined || opposition.length === 0) {
    return (
      // It brings its own ground, exactly as a rated fixture does. Left
      // transparent it borrowed whatever it was sitting on, which is three
      // different surfaces — and on the pitch's cream band a light grey on
      // near-white was a blank gameweek nobody could read.
      <span
        className={`numeric grid flex-1 place-items-center whitespace-nowrap px-0.5 text-3xs font-bold leading-[1.5] ${UNRATED.ink}`}
        style={{ backgroundColor: UNRATED.ground }}
      >
        {blank}
      </span>
    );
  }

  return (
    // Fills whatever it is given, edge to edge, and a double splits it in two.
    // The colour IS the row rather than a chip floating on one — the strip under
    // a sticker is four pixels of headroom, and a badge inside it read as a
    // mistake. Rounding and width are the parent's business.
    <span className="flex w-full items-stretch">
      {opposition.map((against) => (
        <span
          key={against.fixture.id}
          // Centred by grid rather than by line height: the pitch's band is a
          // fixed height and the colour is asked to fill it, so the text has to
          // be placed inside the stretch rather than defining it.
          //
          // `text-cream` on the hardest step is the desk's cream, which is the
          // one thing here that is not medium-independent: a chip only ever
          // renders on the desk or on a colour plate, never on the paper's
          // stock, where `--color-cream` is deliberately ink.
          className={`numeric grid flex-1 place-items-center whitespace-nowrap px-0.5 text-3xs font-bold leading-[1.5] ${fdrStep(against.difficulty).ink}`}
          style={{ backgroundColor: fdrStep(against.difficulty).ground }}
        >
          {against.club.shortName} ({against.home ? "H" : "A"})
        </span>
      ))}
    </span>
  );
}
