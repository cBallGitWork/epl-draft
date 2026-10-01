import { PLAYER_CATEGORIES, carries, type GroupKey, type PlayerStatLine } from "@epl/core";

// The squad board's views and the columns in each: the league's categories off the served league's read, then the
// counts beneath them that only the stats league carries. Pure, so heads, cells, key, cuts and sort read one list.

/** One man's counts by column abbreviation, as a league's getPlayerStats files them. */
export type Counts = Readonly<Record<string, number | null>>;

/** Every category the league scores, then each group with the counts beneath it. */
export const VIEWS = [
  { key: "scoring", label: "Scoring" },
  { key: "attacking", label: "Attacking" },
  { key: "defensive", label: "Defensive" },
  { key: "discipline", label: "Discipline" },
  { key: "appearances", label: "Appearances" },
] as const satisfies readonly { key: "scoring" | GroupKey; label: string }[];

export type ViewKey = (typeof VIEWS)[number]["key"];

/** What the stats league counts under the scored categories, in its own abbreviations. No league scores these. */
const BENEATH: readonly { key: string; group: GroupKey; label: string; lowIsGood?: boolean }[] = [
  { key: "GP", group: "appearances", label: "Games played" },
  { key: "GS", group: "appearances", label: "Games started" },
  { key: "S", group: "attacking", label: "Shots" },
  { key: "SOT", group: "attacking", label: "Shots on target" },
  { key: "KP", group: "attacking", label: "Key passes" },
  { key: "BCC", group: "attacking", label: "Big chances created" },
  { key: "TkW", group: "defensive", label: "Tackles won" },
  { key: "Int", group: "defensive", label: "Interceptions" },
  { key: "CLR", group: "defensive", label: "Clearances" },
  { key: "BR", group: "defensive", label: "Ball recoveries" },
  { key: "FC", group: "discipline", label: "Fouls committed", lowIsGood: true },
];

/** One column: its head, what it means, and how to read it off a row. */
export type Measure = {
  key: string;
  head: string;
  label: string;
  read: (line: PlayerStatLine, statsLeague: Counts | undefined) => number | null;
  /** A column whose top is the bad end, lit red rather than yellow and orange. */
  worse: boolean;
};

/** A measure with what places it: its group, every name a read may file it under, and whether a league scores it. */
type Column = { group: GroupKey; names: readonly string[]; scored: boolean; measure: Measure };

/** His count under any of a column's names off one read; undefined when that read has no such column for him. */
function held(counts: Counts | undefined, names: readonly string[]): number | null | undefined {
  if (counts === undefined) return undefined;
  const name = names.find((each) => each in counts);
  return name === undefined ? undefined : (counts[name] ?? null);
}

/** The served league's figure where its read has the column, else the stats league's: one count, two leagues. */
function column(
  entry: { key: string; group: GroupKey; label: string; lowIsGood?: boolean; also?: string },
  scored: boolean,
): Column {
  const names = entry.also ? [entry.key, entry.also] : [entry.key];
  const read = (line: PlayerStatLine, statsLeague: Counts | undefined) => {
    const served = held(line.stats, names);
    return served === undefined ? (held(statsLeague, names) ?? null) : served;
  };
  return { group: entry.group, names, scored, measure: { key: entry.key, head: entry.key, label: entry.label, worse: entry.lowIsGood === true, read } };
}

const COLUMNS: readonly Column[] = [
  ...PLAYER_CATEGORIES.map((category) => column(category, true)),
  ...BENEATH.map((count) => column(count, false)),
];

/** Every column the board can read off the stats league, so its read keeps these and no more. */
export const STATS_LEAGUE_KEYS: readonly string[] = COLUMNS.flatMap((each) => each.names);

/** A view's columns in order, with no total: the categories are raw counts, so a sum would add cards to goals.
 *  `served` is what the served league's read carries, and an empty one keeps every category. The stats league's
 *  columns fill a group but never the Scoring view, which is only what the league itself carries. */
export function measuresFor(view: ViewKey, served: ReadonlySet<string>, statsLeague: ReadonlySet<string>): readonly Measure[] {
  return COLUMNS.filter((each) => {
    const inView = view === "scoring" ? each.scored : each.group === view;
    const ownRead = each.scored ? carries(served, ...each.names) : each.names.some((name) => served.has(name));
    const statsRead = view !== "scoring" && each.names.some((name) => statsLeague.has(name));
    return inView && (ownRead || statsRead);
  }).map((each) => each.measure);
}

/** Every sortable column by key, so a sort outlives a switch of view. */
const SORTABLE = new Map(COLUMNS.map((each) => [each.measure.key, each.measure]));

/** One reading by column key: the sort's way in, and the same read the cell prints. */
export function readingOf(line: PlayerStatLine, statsLeague: Counts | undefined, key: string): number | null {
  return SORTABLE.get(key)?.read(line, statsLeague) ?? null;
}
