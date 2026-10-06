import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  DEFCON,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_POINTS,
  MINUTES,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  SAVES,
  YELLOW_CARDS,
  wordsFor,
  type FantraxCategory,
  type FigureKind,
} from "@epl/core";
import type { PoolRow } from "./pool";
import type { PoolGroup } from "./groups";
import { ATTRIBUTE_COLUMNS } from "./attributeColumns";

// Every column the Data board draws, phone-first. The fantasy figures come off `PoolRow`, the raw counts off the
// grouped read's bag; a count a man's half does not carry (a keeper's GAO, an outfielder's Sv) is a dash, never 0.

/** The raw counts for one man, keyed by Fantrax's column abbreviation; undefined where the grouped read missed him. */
export type RawStats = Record<string, number | null> | undefined;

/** The shape of a value; the table owns the ink. */
type ColumnKind = "text" | "number" | "percent" | "signed";

/** Which end of a column is lit. `low` marks offenders only: nothing lights for a man on nought yellow cards. */
type Mark = "high" | "low";

export interface PoolColumn {
  /** Short, because it ends up in the address bar. */
  key: string;
  label: string;
  title: string;
  kind: ColumnKind;
  /** Which plate it appears under; absent is the spine, drawn under all of them. */
  group?: PoolGroup;
  /** Which end of it is lit, if either. */
  mark?: Mark;
  /** A count, which the per-90 toggle divides by minutes. A rate, a share or a denominator never is. */
  rate?: true;
  /** Which way it runs when first tapped. */
  ascending: boolean;
  value: (row: PoolRow, stats: RawStats) => number | string | null;
  /** The Fantrax column a count reads, so a board drops it where the league scores no such category. */
  stat?: string;
  /** The kind of figure, where it prints at fixed places rather than as it arrives. */
  places?: FigureKind;
}

/** A raw count read out of the grouped payload by its Fantrax abbreviation, rated under the toggle. */
function byAbbreviation(key: string, title: string, group: PoolGroup, mark: Mark = "high"): PoolColumn {
  return {
    key: key.toLowerCase().replace(/[^a-z0-9]/g, ""),
    label: key,
    title,
    kind: "number",
    group,
    mark,
    rate: true,
    ascending: false,
    value: (_row, stats) => stats?.[key] ?? null,
    stat: key,
  };
}

/** A scoring category's count, read by Fantrax's code, headed and keyed in our words. */
function count(category: FantraxCategory, group: PoolGroup, mark: Mark = "high"): PoolColumn {
  const words = wordsFor(category);
  return { ...byAbbreviation(category.short, words.key, group, mark), label: words.head };
}

/** Minutes and games, never rated: ninety minutes' worth of minutes is ninety on every row. */
function denominator(column: PoolColumn): PoolColumn {
  return { ...column, rate: undefined };
}

/** Position, club and status sit beside the name (Craig, 10 Sep 2026), filtered in the drawer rather than sorted. */
export const COLUMNS: PoolColumn[] = [
  {
    key: "name",
    label: "Player",
    title: "Name",
    kind: "text",
    ascending: true,
    value: (row) => row.entry.player.displayName,
  },
  {
    key: "fpts",
    label: "FPts",
    title: "Fantasy points, under this league's scoring",
    kind: "number",
    group: "scoring",
    mark: "high",
    rate: true,
    ascending: false,
    value: (row) => row.stats?.points ?? null,
  },
  {
    key: "fpg",
    label: "FP/G",
    title: "Fantasy points per game",
    kind: "number",
    places: "perGame",
    group: "scoring",
    mark: "high",
    ascending: false,
    value: (row) => row.stats?.perGame ?? null,
  },
  denominator(count(MINUTES, "scoring")),
  denominator(byAbbreviation("GP", "Games played", "scoring")),
  count(GOALS, "attacking"),
  count(ASSISTS_TOTAL, "attacking"),
  count(ASSISTS_OFFICIAL, "attacking"),
  count(ASSISTS_FANTASY, "attacking"),
  count(CLEAN_SHEETS, "defensive"),
  ...DEFCON.map((category) => count(category, "defensive")),
  count(GOALS_AGAINST_OUTFIELD, "defensive", "low"),
  count(GOALS_AGAINST, "defensive", "low"),
  count(SAVES, "defensive"),
  count(KEEPER_POINTS, "defensive"),
  count(PENALTY_SAVES, "defensive"),
  count(YELLOW_CARDS, "discipline", "low"),
  count(RED_CARDS, "discipline", "low"),
  count(PENALTIES_MISSED, "attacking", "low"),
  count(OWN_GOALS, "defensive", "low"),
  {
    key: "ros",
    label: "Ros",
    title: "Share of all Fantrax leagues rostering him",
    kind: "percent",
    group: "market",
    mark: "high",
    ascending: false,
    value: (row) => row.stats?.rostered ?? null,
  },
  {
    key: "trend",
    label: "+/-",
    title: "How that share moved since last week",
    kind: "signed",
    group: "market",
    ascending: false,
    value: (row) => row.stats?.trend ?? null,
  },
  ...ATTRIBUTE_COLUMNS,
];

/** Fantrax's own default, FPts highest first; named so reordering `COLUMNS` cannot change it. */
export const DEFAULT_SORT = "fpts";

export function columnFor(key: string | undefined): PoolColumn | undefined {
  return COLUMNS.find((column) => column.key === key);
}
