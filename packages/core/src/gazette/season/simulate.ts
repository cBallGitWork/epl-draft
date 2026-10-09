import { placeTable } from "../../league/fantrax/standings";

// The season played out many times: each side's period score drawn from its expected score and spread, set against
// every opponent the schedule gives it that period, the table placed by the league's rule. Seeded, so pure.

/** A side's score for one period: the expected total and its standard deviation. */
export interface PeriodScore {
  mean: number;
  sd: number;
}

interface SeasonInput {
  teams: readonly { teamId: string; name: string }[];
  /** Every head-to-head pairing; a period with two per side is a double header. */
  matchups: readonly { period: number; homeTeamId: string; awayTeamId: string }[];
  /** Each side's score by period; a period with no reading scores nothing. */
  scores: ReadonlyMap<string, ReadonlyMap<number, PeriodScore>>;
  runs: number;
  seed: number;
}

export interface SeasonOutcome {
  teamId: string;
  name: string;
  meanPlace: number;
  /** How many runs it finished in each place, first place first. */
  placed: number[];
}

/** Every side's season over `runs` playings, best expected place first. */
export function simulateSeason(input: SeasonInput): SeasonOutcome[] {
  const random = mulberry32(input.seed);
  const periods = [...new Set(input.matchups.map((each) => each.period))].sort((a, b) => a - b).map((period) => ({ period, ties: input.matchups.filter((each) => each.period === period) }));
  const size = input.teams.length;
  const tally = new Map(input.teams.map((team) => [team.teamId, { place: 0, placed: new Array<number>(size).fill(0) }]));

  for (let run = 0; run < input.runs; run += 1) {
    const wins = new Map(input.teams.map((team) => [team.teamId, 0]));
    const scored = new Map(input.teams.map((team) => [team.teamId, 0]));
    for (const { period, ties } of periods) {
      const drawn = new Map(
        input.teams.map((team) => {
          const score = input.scores.get(team.teamId)?.get(period);
          return [team.teamId, score === undefined ? 0 : score.mean + score.sd * normal(random)];
        }),
      );
      for (const tie of ties) {
        const [home, away] = [drawn.get(tie.homeTeamId) ?? 0, drawn.get(tie.awayTeamId) ?? 0];
        scored.set(tie.homeTeamId, (scored.get(tie.homeTeamId) ?? 0) + home);
        scored.set(tie.awayTeamId, (scored.get(tie.awayTeamId) ?? 0) + away);
        // Two drawn totals are never equal, so there is no draw and wins order the table whatever a win pays.
        const winner = home > away ? tie.homeTeamId : tie.awayTeamId;
        wins.set(winner, (wins.get(winner) ?? 0) + 1);
      }
    }
    const table = placeTable(
      input.teams.map((team) => {
        const won = wins.get(team.teamId) ?? 0;
        return { teamId: team.teamId, teamName: team.name, won, drawn: 0, lost: 0, played: 0, points: won, pointsFor: scored.get(team.teamId) ?? 0, pointsAgainst: 0 };
      }),
    );
    for (const row of table) {
      const each = tally.get(row.teamId);
      if (each === undefined) continue;
      each.place += row.rank;
      each.placed[row.rank - 1] += 1;
    }
  }

  const runs = Math.max(input.runs, 1);
  return input.teams
    .map((team) => {
      const each = tally.get(team.teamId) ?? { place: 0, placed: new Array<number>(size).fill(0) };
      return { teamId: team.teamId, name: team.name, meanPlace: each.place / runs, placed: each.placed };
    })
    .sort((a, b) => a.meanPlace - b.meanPlace || b.placed[0] - a.placed[0] || a.name.localeCompare(b.name, "en"));
}

/** A seeded uniform on [0, 1): the same seed plays the same season. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A standard normal draw, Box-Muller. */
function normal(random: () => number): number {
  const u = Math.max(random(), Number.MIN_VALUE);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}
