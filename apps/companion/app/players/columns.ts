import type { PoolRow } from "./pool";

// Every column the directory draws, in Fantrax's own order.
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
 *  value is, which is the one thing the column knows and the cell does not. */
export type ColumnKind = "text" | "number" | "percent" | "signed";

export interface PoolColumn {
  /** Stands down under a thumb. **Only ever true of a column the table is not
   *  ORDERED by** — DESIGN §2: hiding the sorted column takes the pressed plate,
   *  the arrow and `aria-sort` with it, so a phone arriving on a shared `?sort=`
   *  link would show an order with no visible author and nothing in the
   *  accessibility tree to say what it was. `PlayerTable` keeps that promise by
   *  drawing a hidden column anyway when it is the one being sorted by. */
  phoneHidden?: true;
  /** Short, because it ends up in the address bar. */
  key: string;
  label: string;
  title: string;
  kind: ColumnKind;
  /** Which way it runs when a reader first taps it: points highest-first,
   *  names and ranks from the top. */
  ascending: boolean;
  value: (row: PoolRow, stats: RawStats) => number | string | null;
}

/** A raw count read out of the grouped payload by its Fantrax abbreviation. */
function count(key: string, label: string, title: string): PoolColumn {
  return {
    key: key.toLowerCase().replace(/[^a-z0-9]/g, ""),
    label,
    title,
    kind: "number",
    ascending: false,
    value: (_row, stats) => stats?.[key] ?? null,
  };
}

export const COLUMNS: PoolColumn[] = [
  {
    key: "rank",
    label: "Rk",
    title: "Fantrax's own ranking across the whole pool",
    kind: "number",
    ascending: true,
    // Craig, 6 Sep 2026: *"for mobile ditch the rank column in scout, wasted
    // space"*. It is the widest cheap column and the one a phone can most afford
    // to lose — the rows are in an order the reader chose, and the absolute
    // ranking is a desk question.
    phoneHidden: true,
    value: (row) => row.stats?.rank ?? null,
  },
  {
    key: "name",
    label: "Player",
    title: "Name",
    kind: "text",
    ascending: true,
    value: (row) => row.entry.player.displayName,
  },
  {
    key: "pos",
    label: "Pos",
    // OUR eligibility and not Fantrax's global letter: "F/M" is what the
    // commissioner set and what the planner obeys.
    title: "What this league lets him be filed as",
    kind: "text",
    ascending: true,
    value: (row) => row.entry.eligiblePositions.join("/") || null,
  },
  {
    key: "club",
    label: "Club",
    title: "His Premier League club",
    kind: "text",
    ascending: true,
    value: (row) => row.entry.player.clubCode ?? null,
  },
  {
    key: "owner",
    label: "Sta",
    title: "Who holds him in this league, or what may be done with him",
    kind: "text",
    ascending: true,
    value: (row) => row.entry.ownerTeamId ?? row.entry.status ?? null,
  },
  {
    key: "opp",
    // The zone is in the heading because Fantrax's kickoff times are in the
    // league's own — US Eastern — and every other time in this app is London.
    // "Sun 9:00AM" here is a 14:00 kickoff, and unlabelled that is the one
    // mistake `londonTime.ts` exists to prevent. Their words, their clock, named.
    label: "Opp (ET)",
    title: "His fixture, in Fantrax's words and Fantrax's US Eastern clock",
    kind: "text",
    ascending: true,
    value: (row) => row.stats?.opponent ?? null,
  },
  {
    key: "fpts",
    label: "FPts",
    title: "Fantasy points, under this league's scoring",
    kind: "number",
    ascending: false,
    value: (row) => row.stats?.points ?? null,
  },
  {
    key: "fpg",
    label: "FP/G",
    title: "Fantasy points per game",
    kind: "number",
    ascending: false,
    value: (row) => row.stats?.perGame ?? null,
  },
  {
    key: "ros",
    label: "Ros",
    title: "Share of all Fantrax leagues rostering him",
    kind: "percent",
    ascending: false,
    value: (row) => row.stats?.rostered ?? null,
  },
  {
    key: "trend",
    label: "+/-",
    title: "How that share moved since last week",
    kind: "signed",
    ascending: false,
    value: (row) => row.stats?.trend ?? null,
  },
  count("GP", "GP", "Games played"),
  count("Min", "Min", "Minutes played"),
  count("G", "G", "Goals"),
  count("A", "A", "Assists, as the Premier League records them"),
  count("AF", "AF", "Assists as Fantrax scores them, which is the wider count"),
  count("CS", "CS", "Clean sheets, on 60 minutes on the field — Fantrax's own rule"),
  count("GAO", "GAO", "Goals conceded while he was on the field. Outfielders only"),
  count("GA", "GA", "Goals conceded. Keepers only"),
  count("Sv", "Sv", "Saves. Keepers only"),
  count("PKS", "PKS", "Penalties saved. Keepers only"),
  count("YC", "YC", "Yellow cards"),
  count("RC", "RC", "Red cards"),
  count("PKM", "PKM", "Penalties missed"),
  count("OG", "OG", "Own goals"),
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
