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

/** How hard, in five steps. Names the token rather than the colour so the scale
 *  lives in one place and a fixture chip can never introduce a sixth.
 *
 *  Written out rather than interpolated from the number. Tailwind keeps a theme
 *  variable only when its name appears literally in the source it scans, so
 *  `var(--color-fdr-${n})` compiles to five variables that are never emitted and
 *  five chips with no colour on them — which is exactly how this shipped once. */
const GROUND: Record<number, string> = {
  1: "var(--color-fdr-1)",
  2: "var(--color-fdr-2)",
  3: "var(--color-fdr-3)",
  4: "var(--color-fdr-4)",
  5: "var(--color-fdr-5)",
};

/** An unrated fixture is drawn neutral rather than given a middle score we
 *  invented, and a rating outside their scale is treated the same way. */
function ground(difficulty: number | null): string {
  return (difficulty === null ? undefined : GROUND[difficulty]) ?? "var(--color-raised)";
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
      // `muted` and not `faint`: this sits on the surface in a list, on a raised
      // panel in the card, and on the sticker's near-black strip, and faint
      // disappears on the third.
      <span className="numeric block px-1 text-center text-[0.5rem] font-bold leading-[1.5] text-muted">
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
          // Dark ink on every step of the scale, so the pair is legible without
          // asking which end of it this chip came from.
          className="numeric flex-1 px-1 text-center text-[0.5rem] font-bold leading-[1.5] text-black/85"
          style={{ backgroundColor: ground(against.difficulty) }}
        >
          {against.club.shortName} ({against.home ? "H" : "A"})
        </span>
      ))}
    </span>
  );
}
