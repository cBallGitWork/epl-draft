// The headlines already on the page, so the next one is not the same joke.
//
// **A writer who cannot see the page writes the page's headline five times.**
// The Gazetta files one story per model call, each from its own scoped brief and
// each blind to the others, and on 3 Sep 2026 the front page went out with FIVE
// headlines built on "bank" — "Sunderland Bank The Sheet", "test3 Banks a City
// Slicker", "123 Banks a Big-Money Backline", "test2 Bank Nine", "Bank Nothing
// But Third" — and two on "Left Wanting", both filed in the same firing.
//
// It is not a fault in any one of them. Given the same house voice, the same
// register and a comparable set of facts, a model converges, and there is no
// prompt rule that prevents convergence between calls that cannot see each
// other. What a sub-editor does is look at the page; this is that, handed over.
//
// Its own block rather than a line inside each brief, because every kind wants
// it and the orchestrator is the only place that knows what is already in
// print — the brief builders are pure and are handed one story's facts.

/** How many standing headlines the block names. Twelve: a front page's worth,
 *  which is what a reader sees at once and therefore what may not rhyme. Beyond
 *  that they are further down and last week's, where a repeated construction is
 *  nobody's problem. */
const STANDING_SHOWN = 12;

export function standingHeadlines(headlines: readonly string[]): string | null {
  const printed = headlines.filter((headline) => headline !== "").slice(0, STANDING_SHOWN);
  if (printed.length === 0) return null;

  return [
    "ALREADY ON THIS PAGE. These headlines are printed around yours, so yours must not rhyme with them — not the same verb, not the same construction, not the same joke on a different name. If your best pun collides with one of these, take the second-best one.",
    ...printed.map((headline) => `- ${headline}`),
  ].join("\n");
}
