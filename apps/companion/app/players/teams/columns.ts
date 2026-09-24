import { PLANNER_RUN } from "@epl/core";
import { byFigure } from "../../components/league/order";
import type { TeamRow } from "./teamRows";

// The board's measures as data, so the heads, the cells, the sort and the standouts cannot disagree.

export interface TeamColumn {
  key: "fpts" | "fa" | "attack" | "defence" | "gk" | "def" | "mid" | "fwd" | "cs" | "ga" | "xg" | "xa" | "xgc";
  group: string;
  head: string;
  title: string;
  of: (row: TeamRow) => number | null;
  /** Decimal places; whole numbers when absent. */
  dp?: number;
  /** Which end is good: its standouts are lit, red where high is bad. Absent is never lit. */
  rank?: "high" | "low";
  /** Ours, in cyan (DESIGN §3), and never lit. */
  derived?: true;
  /** Low first when a reader first taps it: a kind run and a thin defence are both small numbers. */
  ascending?: true;
}

export const TEAM_COLUMNS: readonly TeamColumn[] = [
  { key: "fpts", group: "Points", head: "FPts", title: "Fantrax points, every man at the club", of: (r) => r.fpts, rank: "high" },
  { key: "fa", group: "Points", head: "FA", title: "Fantrax points held by men nobody in the league owns", of: (r) => r.fa, rank: "high" },
  { key: "attack", group: "Run", head: "Attack", title: `Ours: the next ${PLANNER_RUN} opponents' defences, mean rank, 1 the weakest`, of: (r) => r.attack, dp: 1, derived: true, ascending: true },
  { key: "defence", group: "Run", head: "Defence", title: `Ours: the next ${PLANNER_RUN} opponents' attacks, mean rank, 1 the weakest`, of: (r) => r.defence, dp: 1, derived: true, ascending: true },
  { key: "gk", group: "Points by position", head: "GK", title: "Fantrax points, keepers", of: (r) => r.gk, rank: "high" },
  { key: "def", group: "Points by position", head: "DEF", title: "Fantrax points, defenders", of: (r) => r.def, rank: "high" },
  { key: "mid", group: "Points by position", head: "MID", title: "Fantrax points, midfielders", of: (r) => r.mid, rank: "high" },
  { key: "fwd", group: "Points by position", head: "FWD", title: "Fantrax points, forwards", of: (r) => r.fwd, rank: "high" },
  { key: "cs", group: "Keepers", head: "CS", title: "Clean sheets, Fantrax's keeper lines", of: (r) => r.cs, rank: "high" },
  { key: "ga", group: "Keepers", head: "GA", title: "Goals against, Fantrax's keeper lines", of: (r) => r.ga, rank: "low", ascending: true },
  { key: "xg", group: "FPL expected", head: "xG", title: "FPL's expected goals, the squad's", of: (r) => r.xg, dp: 1, rank: "high" },
  { key: "xa", group: "FPL expected", head: "xA", title: "FPL's expected assists, the squad's", of: (r) => r.xa, dp: 1, rank: "high" },
  { key: "xgc", group: "FPL expected", head: "xGC", title: "FPL's expected goals conceded, per team rather than per man", of: (r) => r.xgc, dp: 1, rank: "low", ascending: true },
];

export function teamColumn(key: string | undefined): TeamColumn {
  return TEAM_COLUMNS.find((column) => column.key === key) ?? TEAM_COLUMNS[0];
}

/** Ordered by one column; an absent figure sinks either way, and a tie falls to points, then the name. */
export function sortedTeams(rows: readonly TeamRow[], column: TeamColumn, descending: boolean): TeamRow[] {
  return [...rows].sort(
    (a, b) =>
      byFigure(column.of(a), column.of(b), descending) ||
      (b.fpts ?? -Infinity) - (a.fpts ?? -Infinity) ||
      a.club.shortName.localeCompare(b.club.shortName),
  );
}

/** The groups in order with how many columns each spans, for the plate row over the heads. */
export function columnGroups(columns: readonly TeamColumn[]): { group: string; span: number }[] {
  const groups: { group: string; span: number }[] = [];
  for (const column of columns) {
    const last = groups.at(-1);
    if (last?.group === column.group) last.span += 1;
    else groups.push({ group: column.group, span: 1 });
  }
  return groups;
}
