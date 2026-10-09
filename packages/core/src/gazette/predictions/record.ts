import { groupedBy } from "../../grouped";
import type { TeamForm } from "../../league/form";
import type { EditionTie } from "../published";

// How Lawro's calls turned out, marked afresh against the rounds Fantrax has settled: only the calls are stored.

export interface Marked {
  right: number;
  called: number;
}

/** A call he got wrong, and the score that proved it. */
export interface Miss {
  gameweek: number;
  calledTeamId: string;
  winnerTeamId: string;
  loserTeamId: string;
  winnerPoints: number;
  loserPoints: number;
  gut: boolean;
}

export interface Marks {
  all: Marked;
  /** His calls against the favourite; null when none of them had a winner. */
  gut: Marked | null;
  /** His calls, and his gut calls among them, that ended level: marked in neither. */
  level: { all: number; gut: number };
  misses: Miss[];
}

export interface PredictionRecord {
  /** His newest column, with its marks; null marks while its round is unsettled. */
  last: { gameweek: number; marks: Marks | null } | null;
  season: { all: Marked | null; gut: Marked | null };
}

/** One archived column: the round it called and the calls it made. */
export interface CalledColumn {
  period: number;
  gameweek: number;
  ties: readonly EditionTie[];
}

type Settled = TeamForm["run"][number];

/** Every column marked; a dead heat and an unsettled tie count for nothing, and so does a tie
 *  he declined, or silence would be the cheapest way to look right. */
export function predictionRecord(columns: readonly CalledColumn[], form: readonly TeamForm[]): PredictionRecord {
  // A double header is two games in one period, so a team's period holds a list.
  const settled = new Map<string, Settled[]>();
  for (const team of form) for (const [period, games] of groupedBy(team.run, (game) => game.period)) settled.set(`${period}:${team.teamId}`, games);

  const marked = [...columns]
    .sort((a, b) => a.gameweek - b.gameweek)
    .map((column) => ({ column, marks: markColumn(column, settled) }));
  const newest = marked.at(-1);
  return {
    last: newest === undefined ? null : { gameweek: newest.column.gameweek, marks: newest.marks },
    season: {
      all: total(marked.map(({ marks }) => marks?.all ?? null)),
      gut: total(marked.map(({ marks }) => marks?.gut ?? null)),
    },
  };
}

function markColumn(column: CalledColumn, settled: ReadonlyMap<string, readonly Settled[]>): Marks | null {
  const all: Marked = { right: 0, called: 0 };
  const gut: Marked = { right: 0, called: 0 };
  const level = { all: 0, gut: 0 };
  const misses: Miss[] = [];
  for (const tie of column.ties) {
    const call = tie.callsTeamId;
    const home = gameOf(column.period, tie, settled);
    if (typeof call !== "string" || home === undefined) continue;
    if (home.result === "D") {
      level.all += 1;
      if (tie.instinct !== undefined) level.gut += 1;
      continue;
    }

    const homeWon = home.result === "W";
    const winner = homeWon ? tie.homeTeamId : tie.awayTeamId;
    const right = call === winner;
    for (const count of tie.instinct === undefined ? [all] : [all, gut]) {
      count.called += 1;
      if (right) count.right += 1;
    }
    if (right) continue;
    misses.push({
      gameweek: column.gameweek,
      calledTeamId: call,
      winnerTeamId: winner,
      loserTeamId: homeWon ? tie.awayTeamId : tie.homeTeamId,
      winnerPoints: homeWon ? home.pointsFor : home.pointsAgainst,
      loserPoints: homeWon ? home.pointsAgainst : home.pointsFor,
      gut: tie.instinct !== undefined,
    });
  }
  return all.called + level.all === 0 ? null : { all, gut: gut.called === 0 ? null : gut, level, misses };
}

/** The home side's game in this tie; in a double header, the one whose other total is the away side's own. */
function gameOf(period: number, tie: EditionTie, settled: ReadonlyMap<string, readonly Settled[]>): Settled | undefined {
  const games = settled.get(`${period}:${tie.homeTeamId}`) ?? [];
  if (games.length <= 1) return games[0];
  const away = settled.get(`${period}:${tie.awayTeamId}`)?.[0]?.pointsFor;
  return games.find((game) => game.pointsAgainst === away);
}

function total(marks: readonly (Marked | null)[]): Marked | null {
  const counted = marks.filter((each): each is Marked => each !== null && each.called > 0);
  if (counted.length === 0) return null;
  return {
    right: counted.reduce((sum, each) => sum + each.right, 0),
    called: counted.reduce((sum, each) => sum + each.called, 0),
  };
}
