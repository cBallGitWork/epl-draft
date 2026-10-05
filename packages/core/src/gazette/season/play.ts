import type { Formation } from "../../league/formations";
import { bestEleven } from "./eleven";
import type { SeasonMan } from "./men";
import { simulateSeason, type PeriodScore, type SeasonOutcome } from "./simulate";

// The season as the desk calls it: each squad's best eleven for every period the schedule plays, then the schedule
// played out. Pure; the calls are the code's and never the writer's.

export interface SeasonSquad {
  teamId: string;
  name: string;
  men: readonly SeasonMan[];
}

export interface PlayedSeason {
  /** Best expected place first: the code's order of the squads. */
  table: SeasonOutcome[];
  /** Each side's elevens over the season, the points they are expected to score at each slot. */
  lines: ReadonlyMap<string, Readonly<Record<string, number>>>;
  /** Periods a side could field no allowed shape in, which score nothing. */
  short: { teamId: string; period: number }[];
}

export function playSeason(input: {
  squads: readonly SeasonSquad[];
  shapes: readonly Formation[];
  /** The correlation between any two men of one eleven in one period. */
  together: number;
  matchups: readonly { period: number; homeTeamId: string; awayTeamId: string }[];
  runs: number;
  seed: number;
}): PlayedSeason {
  const periods = [...new Set(input.matchups.map((each) => each.period))].sort((a, b) => a - b);
  const scores = new Map<string, Map<number, PeriodScore>>();
  const lines = new Map<string, Record<string, number>>();
  const short: PlayedSeason["short"] = [];

  for (const squad of input.squads) {
    const byId = new Map(squad.men.map((man) => [man.fantraxId, man]));
    const line: Record<string, number> = {};
    const scored = new Map<number, PeriodScore>();
    for (const period of periods) {
      const eleven = bestEleven(
        squad.men.map((man) => ({ id: man.fantraxId, slots: man.periods.get(period) ?? {} })),
        input.shapes,
      );
      if (eleven === null) {
        short.push({ teamId: squad.teamId, period });
        continue;
      }
      let [own, shared] = [0, 0];
      for (const pick of eleven.picks) {
        const man = byId.get(pick.id);
        const points = man?.periods.get(period)?.[pick.slot] ?? 0;
        line[pick.slot] = (line[pick.slot] ?? 0) + points;
        own += ((man?.spread ?? 0) * points) ** 2;
        shared += (man?.spread ?? 0) * points;
      }
      // The variance of a sum whose terms share one correlation r: (1 - r) of the variances plus r of the deviations squared.
      scored.set(period, { mean: eleven.total, sd: Math.sqrt((1 - input.together) * own + input.together * shared ** 2) });
    }
    scores.set(squad.teamId, scored);
    lines.set(squad.teamId, line);
  }

  const table = simulateSeason({
    teams: input.squads.map(({ teamId, name }) => ({ teamId, name })),
    matchups: input.matchups,
    scores,
    runs: input.runs,
    seed: input.seed,
  });
  return { table, lines, short };
}
