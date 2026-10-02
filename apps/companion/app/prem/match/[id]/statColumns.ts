import { byFigure } from "../../../components/league/order";
import type { FigureKind, IntelMatchPlayer, MatchSheetLine, PlayerMatchStats } from "@epl/core";

// A club board's measures, declared as data so the head and the body cannot disagree.
// `MatchSheetLine` is per-fixture; the expected family is the live endpoint's GAMEWEEK total (`docs/ui/match.md`).

/** One man's figures, off the three providers that hold them. Every field is absent for a man who sat. */
export interface StatLine {
  line: MatchSheetLine | undefined;
  stats: PlayerMatchStats | undefined;
  logged: IntelMatchPlayer | undefined;
}

interface Column {
  head: string;
  title: string;
  of: (r: StatLine) => number | null;
  /** Decimal places; whole numbers when absent. */
  kind?: FigureKind;
  /** A reading we or SofaScore derived, in cyan (DESIGN §3) and never lit. */
  derived?: boolean;
  /** Which end of the column is good: its standouts are lit yellow and orange, or red where high is bad. */
  rank?: "high" | "low";
}

export const COLUMNS = [
  { head: "Pts", title: "FPL's own points for this fixture", of: (r) => r.stats?.fplPoints ?? null, derived: true },
  { head: "Min", title: "Minutes played", of: (r) => r.stats?.minutes ?? null },
  { head: "G", title: "Goals", of: (r) => r.line?.goals ?? null, rank: "high" },
  { head: "A", title: "Assists", of: (r) => r.line?.assists ?? null, rank: "high" },
  { head: "xG", title: "Expected goals", of: (r) => r.stats?.expectedGoals ?? null, kind: "expected", rank: "high" },
  { head: "xA", title: "Expected assists", of: (r) => r.stats?.expectedAssists ?? null, kind: "expected", rank: "high" },
  { head: "CS", title: "Clean sheet", of: (r) => (r.stats?.cleanSheet === true ? 1 : 0), rank: "high" },
  { head: "GC", title: "Goals conceded", of: (r) => r.stats?.goalsConceded ?? null, rank: "low" },
  { head: "Sv", title: "Saves", of: (r) => r.line?.saves ?? null, rank: "high" },
  {
    head: "DC",
    title: "Defensive contribution — tackles, interceptions, clearances, recoveries",
    of: (r) => r.line?.defensiveContribution ?? null,
    rank: "high",
  },
  { head: "B", title: "FPL bonus", of: (r) => r.line?.bonus ?? null, rank: "high" },
  { head: "YC", title: "Yellow cards", of: (r) => r.line?.yellowCards ?? null, rank: "low" },
  { head: "Rtg", title: "SofaScore's rating out of ten", of: (r) => r.logged?.rating ?? null, kind: "rating", derived: true },
] as const satisfies readonly Column[];

/** A column's head doubles as its query value. */
export type StatSort = (typeof COLUMNS)[number]["head"];

/** A club board opens ranked by fantasy points (Craig, 23 Sep 2026). */
export const DEFAULT_SORT: StatSort = "Pts";

export function isStatSort(value: string | undefined): value is StatSort {
  return COLUMNS.some((column) => column.head === value);
}

/** Ordered by one column; ties keep the team sheet's order, and a man with no figure sinks either way. */
export function sorted<T extends StatLine>(rows: readonly T[], sort: StatSort, descending: boolean): T[] {
  const column = COLUMNS.find((entry) => entry.head === sort) ?? COLUMNS[0];
  return [...rows].sort((a, b) => byFigure(column.of(a), column.of(b), descending));
}

