import type { PeriodPairing } from "@epl/core";
import { FANTRAX_SILENT } from "../../config";
import type { LeagueSquads } from "../../squads";

/** The desk before the draft. `scripts/smoke.ts` keys an undrafted league on its first five words. */
export const NOT_DRAFTED = "The league has not drafted yet, so there are no pairings to post.";

/** A drafted league whose gameweek has no pairings, as the real league's period 5 has none. */
export const NO_PAIRINGS = "Fantrax has no pairings for this gameweek, so there is nothing to post.";

/** Why the head-to-head section is empty, or null when it has pairings to post. */
export function headToHeadQuiet(
  squads: LeagueSquads,
  pairings: readonly PeriodPairing[],
): string | null {
  if ("undrafted" in squads) return NOT_DRAFTED;
  if ("unavailable" in squads) return `${FANTRAX_SILENT}, so there are no pairings to show.`;
  return pairings.length === 0 ? NO_PAIRINGS : null;
}
