import type { LeagueOpinion } from "./leagueOpinions";
import { playerHref } from "../players/routes";

// Apart from `leagueOpinions` so a client board can import it without the league's server reads.

/** His own page, `/players/{fantraxId}`, or null for a man our league does not list (Craig, 26 Sep 2026). */
export function poolHref(league: ReadonlyMap<number, LeagueOpinion>, code: number): string | null {
  const fantraxId = league.get(code)?.fantraxId;
  return fantraxId === undefined ? null : playerHref(fantraxId);
}
