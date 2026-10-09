import { byPositionDepth, positionDepth, type FootballPlayer } from "@epl/core";
import type { LeagueOpinion } from "../../leagueOpinions";

// The order a club's squad reads in: our league's position, then the sister's depth chart, then what each has done.

/** Our league's position for a man as a sort key; a man it has no opinion about sorts last. */
export function fantasyDepth(opinion: LeagueOpinion | undefined): number {
  const first = [...(opinion?.positions ?? [])].sort(byPositionDepth)[0];
  return first === undefined ? Number.MAX_SAFE_INTEGER : positionDepth(first);
}

/** A man's depth-chart tier to sort on; no tier, or tier 0 (unavailable), sorts last. */
function depth(tier: number | null | undefined): number {
  return tier === null || tier === undefined || tier === 0 ? Number.MAX_SAFE_INTEGER : tier;
}

/** The Squad tab's order, so each block reads as a depth chart rather than an alphabet. */
export function squadOrder(
  league: ReadonlyMap<number, LeagueOpinion>,
  tierOf: (code: number) => number | null | undefined,
): (a: FootballPlayer, b: FootballPlayer) => number {
  return (a, b) =>
    fantasyDepth(league.get(a.code)) - fantasyDepth(league.get(b.code)) ||
    // The sister's depth chart before minutes, which get a returning first choice wrong.
    depth(tierOf(a.code)) - depth(tierOf(b.code)) ||
    b.season.minutes - a.season.minutes ||
    b.season.starts - a.season.starts ||
    a.name.localeCompare(b.name);
}
