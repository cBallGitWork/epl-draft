// The Premiership section's subject routes, named once.
// No JSX here: client modules import these, and `PremNav` would drag its tab strip along.

/** The competition itself — the table. */
export const PREM = "/prem";

/** The route the club pages hang off. */
export const CLUB = "/prem/club";

/** One match, keyed on the fixture id. */
export const MATCH = "/prem/match";
