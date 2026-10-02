import { type DefConPeriod, type ScoringRules, defConPoints } from "@epl/core";
import type { PeriodLine } from "../../../statsLeague";

/** Each man's DefCon points at the slot he fills, by Fantrax id, off the stats league's periods; every man null when
 *  a period could not be read, and a man with no slot null too. */
export function squadDefcon(
  rules: ScoringRules,
  codes: readonly string[],
  slots: Readonly<Record<string, string | null>>,
  periods: readonly PeriodLine[][] | null,
): Record<string, number | null> {
  const byPeriod = (periods ?? []).map(
    (lines) => new Map(lines.map(([fantraxId, played, counts]): [string, DefConPeriod] => [fantraxId, { played, counts }])),
  );
  return Object.fromEntries(
    Object.entries(slots).map(([fantraxId, slot]) => {
      const his = byPeriod.flatMap((period) => period.get(fantraxId) ?? []);
      return [fantraxId, periods === null || slot === null ? null : defConPoints(rules, codes, slot, his)];
    }),
  );
}
