// How hard a fixture is, in FPL's five steps, and the ink each step carries.
//
// The rating is FPL's, never ours. Difficulty is an opinion, and the only
// defensible one to print is the one the whole fantasy world is already reading
// — which is also why an unrated fixture is drawn neutral rather than given a
// middle score we invented.
//
// **This was `FixtureChip.tsx`, and the chip is gone** (21 Sep 2026). That
// component filled four pixels of headroom under the planner's sticker, and the
// planner moved to `PitchMarker`, whose band takes the OPPONENT's colour instead
// — so the chip lost its last caller the same day its docblock was counting two.
// What survived is the scale, which two screens draw at a readable size, and a
// file named for a component nobody renders is the drift these notes exist to
// stop.

/** Both halves, because contrast is a property of the pair and only the step
 *  knows which pair it is. The scale is built so 5 is DARKER than 4 rather than
 *  brighter — a hard fixture should look heavy — and past about the fourth step
 *  no dark ink survives it: black at 85% on step 5 is 2.9:1. So the last step
 *  turns its ink over, at 5.5:1.
 *
 *  Names the token rather than the colour so the scale lives in one place and a
 *  fixture can never introduce a sixth. Written out rather than interpolated
 *  from the number: Tailwind keeps a theme variable only when its name appears
 *  literally in the source it scans, so `var(--color-fdr-${n})` compiles to five
 *  variables that are never emitted and five chips with no colour on them —
 *  which is exactly how this shipped once. */
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
 *  Shared rather than copied because a second rendering of these five colours is
 *  how a scale drifts — the same mistake `league/Chips.tsx` was pulled together
 *  to undo. Two consumers, counted 21 Sep 2026: the profile's fixture run and
 *  the player dialog's own fixture line. They differ in geometry at both, so the
 *  colour is shared and the layout stays local. */
export function fdrStep(difficulty: number | null): { ground: string; ink: string } {
  return (difficulty === null ? undefined : STEPS[difficulty]) ?? UNRATED;
}
