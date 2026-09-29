import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LEAGUE_LIMITS } from "../paths";

/** A league's position minimums from the file `npm run roster-limits` writes, since no Fantrax endpoint carries them;
 *  null when the league's are not recorded or not in force. */
export function minimums(leagueId: string): Record<string, number> | null {
  const file = JSON.parse(readFileSync(join(LEAGUE_LIMITS, "roster-limits.json"), "utf8")) as {
    leagues: Record<string, { minimumsInForce?: boolean; positions?: { shortName: string; minActive: number }[] }>;
  };
  const league = file.leagues[leagueId];
  if (league?.minimumsInForce !== true || league.positions === undefined) return null;
  return Object.fromEntries(league.positions.map((p) => [p.shortName, p.minActive]));
}
