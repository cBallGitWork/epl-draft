import type { ShotLine } from "./shotLine";
import type { FootballPlayer } from "./types";

// Where his season totals rank among the men he is rated against (Craig, 25 Sep 2026:
// "rankings for data such as xg"). Totals, not rates: this is the league table of a figure.

/** One figure and its place. `rank` is null when he has no figure; ties share a place. */
export interface Ranked {
  head: string;
  title: string;
  value: number | null;
  /** Decimal places the figure is printed to. */
  digits: number;
  rank: number | null;
  /** How many in the cohort have the figure at all. */
  of: number;
}

/** A man's season as FPL counts it, and his line on the shot map. */
export interface Tallied {
  player: FootballPlayer;
  shots: ShotLine | null;
}

interface Ranking {
  head: string;
  title: string;
  digits?: number;
  of: (man: Tallied) => number | null;
}

const s = (man: Tallied) => man.player.season;

export const OUTFIELD_RANKINGS: readonly Ranking[] = [
  { head: "Min", title: "Minutes played", of: (m) => s(m).minutes },
  { head: "Gls", title: "Goals", of: (m) => s(m).goals },
  { head: "xG", title: "Expected goals", digits: 2, of: (m) => s(m).expectedGoals },
  { head: "Ast", title: "Assists", of: (m) => s(m).assists },
  { head: "xA", title: "Expected assists", digits: 2, of: (m) => s(m).expectedAssists },
  { head: "Sh", title: "Shots, off the shot map", of: (m) => m.shots?.struck ?? null },
  { head: "Ch", title: "Shots he set up, off the shot map", of: (m) => m.shots?.created ?? null },
  { head: "Def", title: "Tackles, clearances, blocks, interceptions and recoveries", of: (m) => s(m).tackles + s(m).clearancesBlocksInterceptions + s(m).recoveries },
  { head: "BPS", title: "FPL's bonus-points score", of: (m) => s(m).bps },
];

export const KEEPER_RANKINGS: readonly Ranking[] = [
  { head: "Min", title: "Minutes played", of: (m) => s(m).minutes },
  { head: "Sv", title: "Saves", of: (m) => s(m).saves },
  { head: "CS", title: "Clean sheets", of: (m) => s(m).cleanSheets },
  { head: "Prv", title: "Goals prevented: expected goals conceded less goals conceded", digits: 2, of: (m) => s(m).expectedGoalsConceded - s(m).goalsConceded },
  { head: "BPS", title: "FPL's bonus-points score", of: (m) => s(m).bps },
];

/** His place on each figure among the cohort's men who have played. Pure. */
export function rankings(man: Tallied, cohort: readonly Tallied[], list: readonly Ranking[]): Ranked[] {
  const played = cohort.filter((other) => other.player.season.minutes > 0);
  return list.map((ranking) => {
    const value = ranking.of(man);
    const theirs = played.map(ranking.of).filter((figure): figure is number => figure !== null);
    return {
      head: ranking.head,
      title: ranking.title,
      value,
      digits: ranking.digits ?? 0,
      rank: value === null ? null : 1 + theirs.filter((figure) => figure > value).length,
      of: theirs.length,
    };
  });
}
