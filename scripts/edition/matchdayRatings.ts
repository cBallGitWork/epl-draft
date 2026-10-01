import {
  KEEPER,
  OUTFIELD,
  RATING_WEIGHTS,
  STRENGTH_SO_FAR,
  fetchPoolStats,
  mapPoolStats,
  mapStatSheet,
  rateMatch,
  returnPoints,
  strengthBefore,
  type ClubResult,
  type ScoringRules,
  type StatSheet,
} from "@epl/core";
import { STATS_LEAGUE } from "../leagues";
import { FANTRAX_STAT } from "../stats/columns";

// Our mark for each man who played on one London day: the served league's own points for that day, split by its rules,
// the stats league's Opta counts for the mistakes and extras, and the opponent as the season has gone. Six reads a day,
// one after another (Fantrax throttles a burst); null when any fails, and the report then files without marks.

const PAGE = 1000;

/** Every man's line from one league for one day, by Fantrax id. */
async function dayRead(leagueId: string, day: string) {
  const code = mapPoolStats(await fetchPoolStats(leagueId, 1)).byDate;
  if (code === null) throw new Error(`no per-date season from ${leagueId}`);
  const reads = [];
  for (const group of [OUTFIELD, KEEPER]) {
    const raw = await fetchPoolStats(leagueId, PAGE, code, group, undefined, day);
    reads.push({ pool: mapPoolStats(raw), sheet: mapStatSheet(raw) });
  }
  return reads;
}

/** A sheet's counts per man, keyed by `keyOf(column)`; a column it does not name is left out. */
function countsBy(sheet: StatSheet, keyOf: (column: StatSheet["columns"][number]) => string | undefined) {
  return new Map(
    sheet.lines.map((line) => [line.fantraxId, Object.fromEntries(sheet.columns.flatMap((c, i) => (keyOf(c) === undefined ? [] : [[keyOf(c)!, line.values[i]]])))]),
  );
}

export type MarkFor = (code: number, opponentClubId: number, kickoff: string) => number | null;

export async function dayMarks(opts: {
  leagueId: string;
  rules: ScoringRules | null;
  day: string;
  results: readonly ClubResult[];
  fantraxIds: ReadonlyMap<number, string>;
  minutesOf: (code: number) => number;
  say: (message: string) => void;
}): Promise<MarkFor | null> {
  const { rules, results, fantraxIds } = opts;
  if (rules === null) return opts.say("  ratings: the league described no scoring"), null;
  try {
    const served = await dayRead(opts.leagueId, opts.day);
    const stats = await dayRead(STATS_LEAGUE.leagueId, opts.day);
    const points = new Map(served.flatMap((r) => r.pool.rows.map((row) => [row.fantraxId, row] as const)));
    const shorts = new Map(served.flatMap((r) => [...countsBy(r.sheet, (c) => c.short)]));
    const opta = new Map(stats.flatMap((r) => [...countsBy(r.sheet, (c) => FANTRAX_STAT[c.stat])]));
    return (code, opponentClubId, kickoff) => {
      const id = fantraxIds.get(code);
      const row = id === undefined ? undefined : points.get(id);
      if (id === undefined || row === undefined || row.points === null || row.position === null) return null;
      const split = returnPoints(shorts.get(id) ?? {}, rules, row.position);
      return rateMatch(
        {
          minutes: opts.minutesOf(code),
          points: { total: row.points, ...split },
          stats: opta.get(id) ?? {},
          opponent: strengthBefore(results, String(opponentClubId), kickoff, STRENGTH_SO_FAR),
        },
        RATING_WEIGHTS,
      ).rating;
    };
  } catch (error) {
    opts.say(`  ratings: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
