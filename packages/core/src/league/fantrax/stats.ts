import type {
  PoolStatRow,
  PoolStats,
  StatColumn,
  StatGroup,
  StatLine,
  StatSeason,
  TeamStats,
} from "../stats";

// Fantrax's public stat tables, one squad (`getTeamRosterInfo`) and the whole pool (`getPlayerStats`), read, never scored.
// Every stat endpoint defaults to a PROJECTION, so `StatSeason` travels with the numbers; the columns are the league's
// own scoring categories, read per response and never listed here.

/** The wire, as far as we read it; every field optional, as Fantrax varies it between leagues. */
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
  /** Present only on scoring categories: how a category is told from a fixed column without reading labels. */
  scipId?: string;
  shortName?: string;
  /** Their long name, carrying their own definition after " -- ". */
  name?: string;
}

export interface RawStatRow {
  /** Absent on an empty roster slot: a real row of blank cells with no player. */
  scorer?: RawScorer;
  cells?: RawCell[];
}

/** The player a row is about; only the id is read, as every caller names him from the pool. */
export interface RawScorer {
  scorerId?: string;
  /** "D", or "M,F" for a man eligible at both; the pool's points score him at the last. */
  posShortNames?: string;
}

export interface RawCell {
  /** Pre-formatted: thousands separators, a bare dash for nothing, a trailing percent, `<br/>` in the fixture column. */
  content?: string;
}

export interface RawSelections {
  displayedFantasyTeamId?: string;
  displayedSeasonOrProjection?: RawSeason;
}

export interface RawSeason {
  code?: string;
  name?: string;
  /** `YEAR_TO_DATE`, `PROJECTED_SEASON`, `BY_PERIOD`…: the only way to tell played from predicted. */
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

/** A formatted cell as a number; null, never nought, for an empty cell, Fantrax's dash, or anything not a number. */
export function numeric(content: string | undefined): number | null {
  if (!content) return null;
  const cleaned = content.replace(/,/g, "").replace(/%$/, "").trim();
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Which numbers these are: `projected` unless Fantrax explicitly said otherwise. */
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
    // A scoring category is the column with a `scipId`; fixed columns are read by key, never by display label.
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
        // Indexed by header column, so a short row cannot slide a keeper's saves under his goals against.
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
  // The ownership pair has no `key`, only a `shortName`, so it is matched on label; a lost label reads as absent.
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

/** The latest-starting season's code in one timeframe (`YEAR_TO_DATE`, `BY_DATE`), by published start date, never by
 *  list position or a parsed code. Null when none: the caller then asks for nothing and never composes a code. */
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

/** A pre-formatted cell as one line of text: tags (`"BOU<br/>Sun 9:00AM"`) become spaces, and nothing is parsed out. */
function plain(content: string | undefined): string | null {
  if (content === undefined) return null;
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
}
