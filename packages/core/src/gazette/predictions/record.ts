import type { TeamForm } from "../../league/form";
import type { EditionTie } from "../published";

// How Lawro's calls turned out: his archived columns marked against the rounds Fantrax has settled,
// recomputed every time, so nothing about his record is stored but the calls themselves.

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
  /** His calls against the favourite; null when he made none. */
  gut: Marked | null;
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
  const settled = new Map<string, Settled>();
  for (const team of form) for (const game of team.run) settled.set(`${game.period}:${team.teamId}`, game);

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

function markColumn(column: CalledColumn, settled: ReadonlyMap<string, Settled>): Marks | null {
  const all: Marked = { right: 0, called: 0 };
  const gut: Marked = { right: 0, called: 0 };
  const misses: Miss[] = [];
  for (const tie of column.ties) {
    const call = tie.callsTeamId;
    const home = settled.get(`${column.period}:${tie.homeTeamId}`);
    if (typeof call !== "string" || home === undefined || home.result === "D") continue;

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
  return all.called === 0 ? null : { all, gut: gut.called === 0 ? null : gut, misses };
}

function total(marks: readonly (Marked | null)[]): Marked | null {
  const counted = marks.filter((each): each is Marked => each !== null);
  if (counted.length === 0) return null;
  return {
    right: counted.reduce((sum, each) => sum + each.right, 0),
    called: counted.reduce((sum, each) => sum + each.called, 0),
  };
}
