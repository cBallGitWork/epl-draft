import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
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
} from "@epl/core";
import type { PoolRow } from "./pool";
import type { PoolGroup } from "./groups";
import { ATTRIBUTE_COLUMNS } from "./attributeColumns";

// Every column the directory draws, phone-first: the figures a thumb sees beside a name come first.
//
// **The landing screen is the board** (Craig, 6 Sep 2026: *"I think the landing
// screen for scout should really be showing as many columns as possible like
// Fantrax"*, and *"a blue bar for assists isn't needed"*). What stood here was a
// CM leaderboard of one measure with two rows of blue plates above it to choose
// WHICH measure — goals, then assists, then penalties missed, one at a time. A
// sortable table with every column shows all of them at once and answers the
// same question with one tap instead of two, which is what both references do:
// Fantrax's own players screen, and Fantasy Football Scout's Stats Centre.
//
// **Two payloads, no new reads.** The seven fantasy columns come off the plain
// `getPlayerStats` (`PoolStatRow`), and the raw counts off the same endpoint
// asked by position group — 18 columns for the outfield and 20 for keepers, and
// the app was already fetching both halves to feed the board it is replacing.
// `mapPlayerStats` deliberately drops the fantasy seven from its `stats` bag so
// the two do not overlap, which is why each column below reads from exactly one
// of them.
//
// **A keeper's blanks are absences, not noughts.** An outfielder has no `Sv` and
// a keeper no `GAO`, because they are not in that half's vocabulary — so the key
// is missing rather than nought, and the table dashes it. Printing 0 saves for
// Haaland is a statistic about a thing that cannot happen.

/** The raw counts for one man, keyed by Fantrax's own column abbreviation.
 *  Undefined for a player the grouped read did not carry. */
export type RawStats = Record<string, number | null> | undefined;

/** How a figure is drawn. The table owns the ink; this says what shape the
 *  value is, which is the one thing the column knows and the cell does not.
 *  Not exported: `PlayerTable` reads the FIELD and never names the type. */
type ColumnKind = "text" | "number" | "percent" | "signed";

/** Which end of a column is worth marking.
 *
 *  `high` is the ordinary case — goals, points, saves. `low` is a column where
 *  the top is the WRONG end, and it is deliberately not "low is good": nothing
 *  lights for a man on nought yellow cards, because not being booked is the
 *  default state of a footballer rather than an achievement. A `low` column
 *  marks its offenders and never its saints. */
type Mark = "high" | "low";

export interface PoolColumn {
  /** Short, because it ends up in the address bar. */
  key: string;
  label: string;
  title: string;
  kind: ColumnKind;
  /** Which plate it appears under. Absent is the spine — drawn under all of
   *  them. */
  group?: PoolGroup;
  /** Which end of it is worth lighting, if either. Absent means the column has
   *  no top worth marking: a rank, a fixture, a name. */
  mark?: Mark;
  /** True when the figure is a COUNT, so ninety minutes' worth of it is a
   *  meaningful number.
   *
   *  A rate is not, and neither is a total that is already one: `FP/G` is per
   *  game, `Ros` is a share, `Rk` is a position in a list and `GP` is the
   *  denominator's denominator. Dividing any of them by minutes produces a
   *  figure with no name. Only the columns marked here change under the toggle;
   *  the rest print what they always printed, which is why the toggle is safe to
   *  leave on. */
  rate?: true;
  /** Which way it runs when a reader first taps it: points highest-first,
   *  names and ranks from the top. */
  ascending: boolean;
  value: (row: PoolRow, stats: RawStats) => number | string | null;
  /** The Fantrax column a count reads, so a board drops it where the league scores no such category. */
  stat?: string;
}

/** A raw count read out of the grouped payload by its Fantrax abbreviation.
 *
 *  Every one of them is a count, so `rate` is set here rather than at each
 *  call site — the exceptions are the columns that do NOT come
 *  through this helper, which is exactly the set that should not be rated. */
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

/** A scoring category's count, with its plain words in the key. */
function count(category: FantraxCategory, group: PoolGroup, mark: Mark = "high"): PoolColumn {
  return byAbbreviation(category.short, wordsFor(category).key, group, mark);
}

/** The football BEHIND the figures — how many matches, and how many minutes.
 *
 *  Identical to `count` but for the one field that matters: these are never
 *  rated. Ninety minutes' worth of minutes is ninety, on every row, which is a
 *  tautology drawn as a column; and games per ninety minutes is the same fact as
 *  minutes per game, upside down. The board shipped for an hour with both going
 *  through `count`, so the per-90 view had a `Min` column reading `90.00` all the
 *  way down — which is what a helper that sets a flag for its callers does the
 *  first time a caller is not like the others.
 *
 *  They keep their `mark`: playing the most minutes in the pool is a real thing
 *  to be top of, even though the tie rule leaves the column dark until the
 *  ever-presents thin out. */
function denominator(key: string, title: string): PoolColumn {
  return { ...byAbbreviation(key, title, "scoring"), rate: undefined };
}

/** **Position, club and status are not columns any more** (Craig, 10 Sep 2026:
 *  *"position and club are constants, they should be next to the player in the
 *  same column… probably status too"*).
 *
 *  He is naming a real distinction. Every other column on this board is a
 *  MEASURE — a thing a reader compares down the column and sorts by. These three
 *  are the man's identity: they do not move, nobody ranks six hundred players by
 *  club, and three text columns between the name and the first figure pushed the
 *  numbers off a phone entirely. They belong beside the name, which is where
 *  every other table in the app already puts a club (`SquadRows`, `ClubRow`,
 *  `MatchList`).
 *
 *  **What went with them: three sorts.** `Pos`, `Club` and `Sta` were sortable
 *  and are not now. Position and status are both filters in the drawer, which is
 *  the better control for them anyway — you want defenders, not a table
 *  beginning at D. Club is a filter too. */
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
    group: "scoring",
    mark: "high",
    ascending: false,
    value: (row) => row.stats?.perGame ?? null,
  },
  denominator(MINUTES.short, wordsFor(MINUTES).key),
  denominator("GP", "Games played"),
  count(GOALS, "attacking"),
  count(ASSISTS_TOTAL, "attacking"),
  count(ASSISTS_OFFICIAL, "attacking"),
  count(ASSISTS_FANTASY, "attacking"),
  count(CLEAN_SHEETS, "defensive"),
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

/** What the board is ordered by when the URL says nothing.
 *
 *  **Fantrax's own default, and it is now ours** — their players screen opens
 *  sorted by `FPts` descending, which is the question a manager scanning the
 *  wire is actually asking. It was `Rk` by position in this list, which is the
 *  same order by a different name and made the rank column load-bearing on a
 *  screen that has just stood it down under a thumb. Named rather than taken as
 *  `COLUMNS[0]`, so reordering the table cannot silently change what it sorts
 *  by — the mistake `league/SectionNav` records having made with `SECTIONS[3]`. */
export const DEFAULT_SORT = "fpts";

export function columnFor(key: string | undefined): PoolColumn | undefined {
  return COLUMNS.find((column) => column.key === key);
}
