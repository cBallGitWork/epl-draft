import { ON_THE_PITCH, type FigureKind, type PlClubSeason, type SeasonTotals } from "@epl/core";
import { byFigure } from "../../components/league/order";
import type { TeamRow } from "./teamRows";

// The board's measures as data, so the heads, the cells, the sort and the standouts cannot disagree.

export interface TeamColumn {
  key: string;
  group: string;
  head: string;
  title: string;
  of: (row: TeamRow) => number | null;
  /** The kind of figure, which sets its places; a count when absent. */
  kind?: FigureKind;
  /** Which end is good: its standouts are lit, red where more is worse; that end also sorts first. */
  rank: "high" | "low";
}

/** One of Opta's figures, a dash where the Premier League has no season for the club. */
const opta = (key: Exclude<keyof PlClubSeason, "clubCode">) => (row: TeamRow) => row.season?.[key] ?? null;

/** One of the squad's FPL figures, a dash where FPL files nobody at the club. */
const squad = (key: keyof SeasonTotals, share = 1) => (row: TeamRow) => (row.squad ? row.squad[key] / share : null);

export const TEAM_COLUMNS: readonly TeamColumn[] = [
  { key: "g", group: "Attack", head: "G", title: "Goals", of: opta("goals"), rank: "high" },
  { key: "sh", group: "Attack", head: "Sh", title: "Shots", of: opta("shots"), rank: "high" },
  { key: "sot", group: "Attack", head: "SoT", title: "Shots on target", of: opta("shotsOnTarget"), rank: "high" },
  { key: "bc", group: "Attack", head: "BC", title: "Big chances, scored or missed", of: opta("bigChances"), rank: "high" },
  { key: "xg", group: "Attack", head: "xG", title: "Expected goals, the squad's", of: squad("expectedGoals"), kind: "expected", rank: "high" },
  { key: "a", group: "Chances", head: "A", title: "Assists", of: opta("assists"), rank: "high" },
  { key: "kp", group: "Chances", head: "KP", title: "Chances created: passes that led to a shot", of: opta("chancesCreated"), rank: "high" },
  { key: "bcc", group: "Chances", head: "BCC", title: "Big chances created", of: opta("bigChancesCreated"), rank: "high" },
  { key: "xa", group: "Chances", head: "xA", title: "Expected assists, the squad's", of: squad("expectedAssists"), kind: "expected", rank: "high" },
  { key: "gc", group: "Defence", head: "GC", title: "Goals conceded", of: opta("goalsConceded"), rank: "low" },
  // FPL counts each chance against once per man on the pitch, so eleven share one.
  { key: "xgc", group: "Defence", head: "xGC", title: "Expected goals conceded", of: squad("expectedGoalsConceded", ON_THE_PITCH), kind: "expected", rank: "low" },
  { key: "cs", group: "Defence", head: "CS", title: "Clean sheets", of: opta("cleanSheets"), rank: "high" },
  { key: "sha", group: "Defence", head: "ShA", title: "Shots conceded", of: opta("shotsConceded"), rank: "low" },
  { key: "tk", group: "Defence", head: "Tk", title: "Tackles", of: opta("tackles"), rank: "high" },
  { key: "int", group: "Defence", head: "Int", title: "Interceptions", of: opta("interceptions"), rank: "high" },
  { key: "rec", group: "Defence", head: "Rec", title: "Ball recoveries", of: opta("recoveries"), rank: "high" },
  { key: "blk", group: "Defence", head: "Blk", title: "Shots blocked", of: opta("blocks"), rank: "high" },
  { key: "ers", group: "Errors", head: "ErS", title: "Errors leading to a shot", of: opta("errorsLeadingToShot"), rank: "low" },
  { key: "erg", group: "Errors", head: "ErG", title: "Errors leading to a goal", of: opta("errorsLeadingToGoal"), rank: "low" },
  { key: "fls", group: "Discipline", head: "Fls", title: "Fouls committed", of: opta("fouls"), rank: "low" },
  { key: "yc", group: "Discipline", head: "YC", title: "Yellow cards", of: opta("yellowCards"), rank: "low" },
  { key: "rc", group: "Discipline", head: "RC", title: "Red cards", of: opta("redCards"), rank: "low" },
];

export function teamColumn(key: string | undefined): TeamColumn {
  return TEAM_COLUMNS.find((column) => column.key === key) ?? TEAM_COLUMNS[0];
}

/** Ordered by one column; an absent figure sinks either way, and a tie falls to the name. */
export function sortedTeams(rows: readonly TeamRow[], column: TeamColumn, descending: boolean): TeamRow[] {
  return [...rows].sort(
    (a, b) => byFigure(column.of(a), column.of(b), descending) || a.club.shortName.localeCompare(b.club.shortName),
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
