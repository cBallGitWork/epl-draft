// The Premiership section's subject routes, named once.
// No JSX here: client modules import these, and `PremNav` would drag its tab strip along.

/** The competition itself — the table. */
export const PREM = "/prem";

/** Where the Prem section opens from the nav (Craig, 24 Sep 2026: "default should land on results"). */
export const PREM_RESULTS = `${PREM}/results`;

/** The route the club pages hang off. */
export const CLUB = `${PREM}/club`;

/** One club's page, keyed on FPL's season-stable club code and never its `id`, which FPL recycles. */
export function clubHref(code: number): string {
  return `${CLUB}/${code}`;
}

/** One match, keyed on the fixture id. */
export const MATCH = `${PREM}/match`;
