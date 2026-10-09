import type {
  PoolStatRow,
  PoolStats,
  StatColumn,
  StatGroup,
  StatLine,
  StatSeason,
  TeamStats,
} from "../stats";
import { plainText } from "./markup";

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

  const pointsAt = keyed(header, "fpts");
  const perGameAt = keyed(header, "fptsPerGame");

  const lines = (table.rows ?? []).flatMap((row): StatLine[] => {
    const scorer = row.scorer;
    if (!scorer?.scorerId) return [];
    const cells = row.cells ?? [];
    return [
      {
        fantraxId: scorer.scorerId,
        points: figureAt(cells, pointsAt),
        perGame: figureAt(cells, perGameAt),
        // Indexed by header column, so a short row cannot slide a keeper's saves under his goals against.
        values: columnAt.map((index) => figureAt(cells, index)),
      },
    ];
  });

  return { name: table.scGroupScorerHeader ?? "", columns, lines };
}

/** The whole pool, ranked. One page — ask for all of it at once. */
export function mapPoolStats(raw: RawPoolStats): PoolStats {
  const header = raw.tableHeader?.cells ?? [];
  const rankAt = keyed(header, "rankOv");
  const pointsAt = keyed(header, "fpts");
  const perGameAt = keyed(header, "fptsPerGame");
  const opponentAt = keyed(header, "opponent");
  // The ownership pair has no `key`, only a `shortName`, so it is matched on label; a lost label reads as absent.
  const rosteredAt = labelled(header, "Ros");
  const trendAt = labelled(header, "+/-");

  const rows = (raw.statsTable ?? []).flatMap((row): PoolStatRow[] => {
    if (!row.scorer?.scorerId) return [];
    const cells = row.cells ?? [];
    return [
      {
        fantraxId: row.scorer.scorerId,
        rank: figureAt(cells, rankAt),
        points: figureAt(cells, pointsAt),
        perGame: figureAt(cells, perGameAt),
        rostered: figureAt(cells, rosteredAt),
        trend: figureAt(cells, trendAt),
        opponent: opponentAt < 0 ? null : plainText(cells[opponentAt]?.content),
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

/** A column by Fantrax's key for it; -1 where the header lacks it. */
export function keyed(header: readonly { key?: string }[], key: string): number {
  return header.findIndex((cell) => cell.key === key);
}

/** A column Fantrax heads but does not key. */
function labelled(header: readonly { shortName?: string }[], shortName: string): number {
  return header.findIndex((cell) => cell.shortName === shortName);
}

/** The figure in a row under a header column; null where the header lacks the column, as `numeric` reads a blank. */
function figureAt(cells: readonly RawCell[], index: number): number | null {
  return index < 0 ? null : numeric(cells[index]?.content);
}
