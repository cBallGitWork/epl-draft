import { type DefConPeriod, type PoolPlayer, type ScoringRules, bestDefConPoints, defConScored } from "@epl/core";
import { now } from "./clock";
import { leagueScoring } from "./scoring";
import { type PeriodLine, statsLeaguePeriods } from "./statsLeague";

// Our DefCon points for any set of men, priced match by match off the stats league's periods.

/** Each man's DefCon points at the best of the positions given him, by Fantrax id; every man null when a period
 *  could not be read, and a man given no position null too. */
export function defconBy(
  rules: ScoringRules,
  codes: readonly string[],
  positions: Readonly<Record<string, readonly string[]>>,
  periods: readonly PeriodLine[][] | null,
): Record<string, number | null> {
  const byPeriod = (periods ?? []).map(
    (lines) => new Map(lines.map(([fantraxId, played, counts]): [string, DefConPeriod] => [fantraxId, { played, counts }])),
  );
  return Object.fromEntries(
    Object.entries(positions).map(([fantraxId, slots]) => {
      const his = byPeriod.flatMap((period) => period.get(fantraxId) ?? []);
      return [fantraxId, periods === null ? null : bestDefConPoints(rules, codes, slots, his)];
    }),
  );
}

/** Where each pool entry is priced, by Fantrax id: the slot his manager has him in, else every position the league
 *  lets him fill. */
export function poolPositions(rows: readonly { entry: PoolPlayer }[]): Record<string, readonly string[]> {
  return Object.fromEntries(rows.map(({ entry }) => [entry.player.fantraxId, entry.slot === null ? entry.eligiblePositions : [entry.slot]]));
}

/** Prices a set of men, each by Fantrax id at the positions given him. */
export type DefconPricing = (positions: Readonly<Record<string, readonly string[]>>) => Record<string, number | null>;

/** The league's DefCon pricing over the stats league's periods so far; null when the league prices no DefCon. */
export async function defconPricing(): Promise<DefconPricing | null> {
  const scoring = await leagueScoring();
  const codes = scoring === null ? [] : defConScored(scoring.categories).map((category) => category.short);
  if (scoring === null || codes.length === 0) return null;
  const periods = await statsLeaguePeriods(codes, now());
  return (positions) => defconBy(scoring.rules, codes, positions, periods);
}
