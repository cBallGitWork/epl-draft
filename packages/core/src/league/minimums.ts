// The fewest a league may start at each position, from `data/leagues/roster-limits.json`: no Fantrax
// endpoint publishes a minimum, so `scripts/roster-limits.ts` scrapes the commissioner's setup page.

interface RecordedLimits {
  /** Set instead of the positions when the script could not read the page. */
  unreadable?: string;
  minimumsInForce?: boolean;
  positions?: { shortName: string; minActive: number }[];
}

/** By position letter. Null for a league not read, or whose commissioner switched minimums off. */
export function minimumsOf(file: { leagues: Record<string, RecordedLimits> }, leagueId: string): Record<string, number> | null {
  const league = file.leagues[leagueId];
  if (league === undefined || !league.minimumsInForce || league.positions === undefined) return null;
  return Object.fromEntries(
    league.positions.filter((position) => position.minActive > 0).map((position) => [position.shortName, position.minActive]),
  );
}
