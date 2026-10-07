// The headlines already on the page, handed to each writer so separate calls do not converge on one joke.

/** How many standing headlines the block names: a front page's worth. */
const STANDING_SHOWN = 12;

export function standingHeadlines(headlines: readonly string[]): string | null {
  const printed = headlines.filter((headline) => headline !== "").slice(0, STANDING_SHOWN);
  if (printed.length === 0) return null;

  return [
    "ALREADY ON THIS PAGE. These headlines are printed around yours, so yours must not rhyme with them — not the same verb, not the same construction, not the same joke on a different name. If your best pun collides with one of these, take the second-best one.",
    ...printed.map((headline) => `- ${headline}`),
  ].join("\n");
}
