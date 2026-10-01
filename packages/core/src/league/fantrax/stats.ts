import type {
  PoolStatRow,
  PoolStats,
  StatColumn,
  StatGroup,
  StatLine,
  StatSeason,
  TeamStats,
} from "../stats";

// Fantrax's stat tables — one team's squad (`getTeamRosterInfo`) and the whole
// pool (`getPlayerStats`). Both are public, and both hand back a rendered table
// rather than data: header cells carrying display labels, body cells carrying
// pre-formatted strings. One file because it is one dialect; splitting it would
// duplicate the string handling and the season label on both sides of the seam.
//
// These are Fantrax's points under our league's scoring, which is the whole
// reason to read them. Our own engine could only ever have approximated the five
// categories FPL does not publish, and Fantrax computes the number that decides
// the match. So: no scoring here, only reading.
//
// Two traps live in these payloads, both proven by probe (PLATFORM_NOTES,
// 13 Aug). The first is that every stat endpoint defaults to a PROJECTION —
// which is why `StatSeason` is carried out of both mappers and rendered beside
// the numbers. The second is that the columns are the league's own scoring
// categories, so they are read per response and never listed here.

/** The wire, mirrored as far as we read it. Every field optional: this is a
 *  screen payload and Fantrax varies it between leagues, not only between
 *  states. */
export interface RawStatTables {
  tables?: RawStatTable[];
  displayedSelections?: RawSelections;
}

export interface RawStatTable {
  /** "Goalkeeper" / "Outfielder" — their name for the scoring group. */
  scGroupScorerHeader?: string;
  header?: { cells?: RawHeaderCell[] };
  rows?: RawStatRow[];
}

export interface RawHeaderCell {
  /** `fpts`, `fptsPerGame`, `opponent`, or a scoring category's composite id. */
  key?: string;
  /** Present only on scoring categories, which is how a category is told apart
   *  from a fixed column without matching on display labels. */
  scipId?: string;
  shortName?: string;
  /** Their long name, carrying their own definition after " -- ". */
  name?: string;
}

export interface RawStatRow {
  /** Absent on an empty roster slot, which is a real row with real blank cells
   *  and no player. Modelled as absence rather than filtered upstream. */
  scorer?: RawScorer;
  cells?: RawCell[];
}

/** The player a row is about. Only the id is read: he is named on the pool read
 *  every caller already holds, and by his own club there rather than by the
 *  short form this payload uses. */
export interface RawScorer {
  scorerId?: string;
  /** "D", or "M,F" for a man eligible at both; the pool's points score him at the last. */
  posShortNames?: string;
}

export interface RawCell {
  /** Pre-formatted: thousands separators, a bare dash for nothing, a trailing
   *  percent, and `<br/>` inside the fixture column. */
  content?: string;
}

export interface RawSelections {
  displayedFantasyTeamId?: string;
  displayedSeasonOrProjection?: RawSeason;
}

export interface RawSeason {
  code?: string;
  name?: string;
  /** `YEAR_TO_DATE`, `PROJECTED_SEASON`, `BY_PERIOD`… Theirs, and the only
   *  honest way to know whether a number was played or predicted. */
  timeframeTypeCode?: string;
  /** Epoch milliseconds. Read only to tell this season from last one. */
  startDate?: number;
}

export interface RawPoolStats {
  tableHeader?: { cells?: RawHeaderCell[] };
  statsTable?: RawStatRow[];
  displayedLists?: { displayedSeasonOrProjections?: RawSeason[] };
  displayedSeasonOrProjection?: RawSeason;
  paginatedResultSet?: { totalNumResults?: number };
}

/** A formatted cell as a number, or null.
 *
 *  Null covers three different printings of "nothing here": an empty cell in an
 *  empty slot, the dash Fantrax uses for a category a player has not registered,
 *  and anything that is not a number at all. All three are absence, and none is
 *  nought — a defender on nought clean sheets and a defender whose clean sheets
 *  we could not read are different rows. */
export function numeric(content: string | undefined): number | null {
  if (!content) return null;
  const cleaned = content.replace(/,/g, "").replace(/%$/, "").trim();
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Which numbers these are. Unknown rather than assumed when Fantrax says
 *  nothing, and `projected` is true unless it explicitly said otherwise —
 *  failing toward the label that admits a doubt. */
export function season(raw: RawSeason | undefined): StatSeason {
  const timeframe = raw?.timeframeTypeCode;
  return {
    code: raw?.code ?? "",
    name: raw?.name ?? "",
    projected: timeframe === undefined || timeframe.startsWith("PROJECT"),
  };
}

/** One team's squad with a season's numbers against each player. */
export function mapTeamStats(raw: RawStatTables): TeamStats {
  return {
    season: season(raw.displayedSelections?.displayedSeasonOrProjection),
    groups: (raw.tables ?? []).map(mapGroup),
  };
}

function mapGroup(table: RawStatTable): StatGroup {
  const header = table.header?.cells ?? [];
  const columns: StatColumn[] = [];
  const columnAt: number[] = [];

  header.forEach((cell, index) => {
    // A scoring category is the one with a `scipId`. The fixed columns —
    // opponent, points, points per game — are read by key below, and matching
    // categories on their display label would break the day Fantrax translates
    // one.
    if (cell.scipId === undefined) return;
    columns.push({ code: cell.shortName ?? cell.key ?? "", name: cell.name ?? "" });
    columnAt.push(index);
  });

  const pointsAt = header.findIndex((cell) => cell.key === "fpts");
  const perGameAt = header.findIndex((cell) => cell.key === "fptsPerGame");

  const lines = (table.rows ?? []).flatMap((row): StatLine[] => {
    const scorer = row.scorer;
    if (!scorer?.scorerId) return [];
    const cells = row.cells ?? [];
    return [
      {
        fantraxId: scorer.scorerId,
        points: pointsAt < 0 ? null : numeric(cells[pointsAt]?.content),
        perGame: perGameAt < 0 ? null : numeric(cells[perGameAt]?.content),
        // Built from the column indices rather than from the row, so a row that
        // arrives short still lines up with its header instead of sliding a
        // keeper's saves under his goals against.
        values: columnAt.map((index) => numeric(cells[index]?.content)),
      },
    ];
  });

  return { name: table.scGroupScorerHeader ?? "", columns, lines };
}

/** The whole pool, ranked. One page — ask for all of it at once. */
export function mapPoolStats(raw: RawPoolStats): PoolStats {
  const header = raw.tableHeader?.cells ?? [];
  const at = (key: string) => header.findIndex((cell) => cell.key === key);
  const rankAt = at("rankOv");
  const pointsAt = at("fpts");
  const perGameAt = at("fptsPerGame");
  const opponentAt = at("opponent");
  // The two ownership columns publish no `key` at all — only a `shortName` — so
  // they are the one pair here matched on their label. Fragile in the way a
  // label always is, and the failure is the honest one: a column we can no
  // longer find reads as absent rather than as another column's numbers.
  const rosteredAt = labelled(header, "Ros");
  const trendAt = labelled(header, "+/-");

  const rows = (raw.statsTable ?? []).flatMap((row): PoolStatRow[] => {
    if (!row.scorer?.scorerId) return [];
    const cells = row.cells ?? [];
    const cell = (index: number) => (index < 0 ? null : numeric(cells[index]?.content));
    return [
      {
        fantraxId: row.scorer.scorerId,
        rank: cell(rankAt),
        points: cell(pointsAt),
        perGame: cell(perGameAt),
        rostered: cell(rosteredAt),
        trend: cell(trendAt),
        opponent: opponentAt < 0 ? null : plain(cells[opponentAt]?.content),
        position: row.scorer.posShortNames?.split(",").at(-1)?.trim() || null,
      },
    ];
  });

  return {
    season: season(raw.displayedSeasonOrProjection),
    rows,
    total: raw.paginatedResultSet?.totalNumResults ?? null,
    yearToDate: latestSeason(raw.displayedLists?.displayedSeasonOrProjections ?? [], "YEAR_TO_DATE"),
    byDate: latestSeason(raw.displayedLists?.displayedSeasonOrProjections ?? [], "BY_DATE"),
  };
}

/** The code for the current season's numbers in one timeframe (`YEAR_TO_DATE`, `BY_DATE`).
 *
 *  Chosen by start date rather than by list position or by parsing the season
 *  number out of the code, because both of those are guesses about a format
 *  Fantrax never documented, while the dates are data they publish. The current
 *  season is simply the latest one that has a start.
 *
 *  Null when they offer none — honoured by the caller as "ask for nothing and
 *  label whatever comes back", never as licence to compose a code ourselves. */
function latestSeason(seasons: readonly RawSeason[], timeframe: string): string | null {
  let best: RawSeason | null = null;
  for (const entry of seasons) {
    if (entry.timeframeTypeCode !== timeframe || !entry.code) continue;
    if (typeof entry.startDate !== "number") continue;
    if (best === null || entry.startDate > (best.startDate ?? -Infinity)) best = entry;
  }
  return best?.code ?? null;
}

/** A column Fantrax heads but does not key. */
function labelled(header: readonly { shortName?: string }[], shortName: string): number {
  return header.findIndex((cell) => cell.shortName === shortName);
}

/** One of Fantrax's pre-formatted cells as a line of text.
 *
 *  They put a literal `<br/>` inside the opponent cell — `"BOU<br/>Sun 9:00AM"`
 *  — and a `<small>` around the day in a waiver one. Turned into a space and
 *  otherwise left alone: the tag is theirs and the words are theirs, and
 *  parsing a scoreline out of it would be inventing a format they never
 *  documented. */
function plain(content: string | undefined): string | null {
  if (content === undefined) return null;
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
}
