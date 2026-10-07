import { type ClubStats, type FigureKind, type TableRow, fixed } from "@epl/core";

// What the board can rank the twenty by: a product choice, so it lives in the app, not core.
// Every category says which way is good, or a board would open on the worst side.

export interface Category {
  key: string;
  label: string;
  /** What the figure means, on the head. */
  title: string;
  /** Whether the biggest is the best. */
  descending: boolean;
  /** Decimal places; whole when absent. */
  kind?: FigureKind;
  of: (club: Club) => number;
}

/** Both halves of a club: the table row carries the record, `clubStats` the rest. */
export interface Club {
  table: TableRow;
  stats: ClubStats;
}

/** FPL counts each chance against once for every man on the pitch, so eleven share one (as Data › Teams divides). */
const ON_THE_PITCH = 11;

export const CATEGORIES: readonly Category[] = [
  { key: "for", label: "Goals scored", title: "Goals scored", descending: true, of: (c) => c.table.goalsFor },
  { key: "against", label: "Goals conceded", title: "Goals conceded — fewest is best", descending: false, of: (c) => c.table.goalsAgainst },
  { key: "gd", label: "Goal difference", title: "Goals scored less goals conceded", descending: true, of: (c) => c.table.goalDifference },
  { key: "cleanSheets", label: "Clean sheets", title: "Matches without conceding", descending: true, of: (c) => c.stats.cleanSheets },
  { key: "blanks", label: "Failed to score", title: "Matches without scoring — fewest is best", descending: false, of: (c) => c.stats.failedToScore },

  { key: "homeWon", label: "Home wins", title: "Won at home", descending: true, of: (c) => c.stats.home.won },
  { key: "awayWon", label: "Away wins", title: "Won away", descending: true, of: (c) => c.stats.away.won },
  { key: "homeFor", label: "Scored at home", title: "Goals scored at home", descending: true, of: (c) => c.stats.home.goalsFor },
  { key: "awayFor", label: "Scored away", title: "Goals scored away", descending: true, of: (c) => c.stats.away.goalsFor },

  // The squad's own season. Every man FPL files at the club, whether or not he
  // has played — the denominator is the squad, so a club with a big treatment
  // room reads as one.
  { key: "xg", label: "Expected goals", title: "FPL's expected goals, the squad added up", descending: true, kind: "expected", of: (c) => c.stats.squad.expectedGoals },
  { key: "xgc", label: "Expected conceded", title: "FPL's expected goals conceded — fewest is best", descending: false, kind: "expected", of: (c) => c.stats.squad.expectedGoalsConceded / ON_THE_PITCH },
  { key: "xa", label: "Expected assists", title: "FPL's expected assists, the squad added up", descending: true, kind: "expected", of: (c) => c.stats.squad.expectedAssists },
  { key: "saves", label: "Saves", title: "Saves made", descending: true, of: (c) => c.stats.squad.saves },
  { key: "tackles", label: "Tackles", title: "Tackles made", descending: true, of: (c) => c.stats.squad.tackles },
  { key: "cbi", label: "Clearances etc.", title: "Clearances, blocks and interceptions — FPL publishes the three as one figure", descending: true, of: (c) => c.stats.squad.clearancesBlocksInterceptions },
  { key: "recoveries", label: "Recoveries", title: "Ball recoveries", descending: true, of: (c) => c.stats.squad.recoveries },
];

/** The category asked for, or the first, so a stale name in a shared link still shows a board. */
export function categoryFor(key: string | undefined): Category {
  return CATEGORIES.find((entry) => entry.key === key) ?? CATEGORIES[0];
}

/** A figure as the board prints it: to the category's places, the British way (`1,234`, `4.04`). */
export function printed(category: Category, figure: number): string {
  return fixed(figure, category.kind ?? "count");
}
