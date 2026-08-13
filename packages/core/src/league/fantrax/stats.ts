import type { PoolStatRow, PoolStats, StatColumn, StatGroup, StatLine, StatSeason, TeamStats } from "../types";

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

export interface RawScorer {
  scorerId?: string;
  name?: string;
  shortName?: string;
  teamShortName?: string;
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
    teamId: raw.displayedSelections?.displayedFantasyTeamId ?? null,
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
        name: scorer.name ?? scorer.shortName ?? "",
        clubCode: scorer.teamShortName ?? null,
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

  const rows = (raw.statsTable ?? []).flatMap((row): PoolStatRow[] => {
    if (!row.scorer?.scorerId) return [];
    const cells = row.cells ?? [];
    return [
      {
        fantraxId: row.scorer.scorerId,
        rank: rankAt < 0 ? null : numeric(cells[rankAt]?.content),
        points: pointsAt < 0 ? null : numeric(cells[pointsAt]?.content),
        perGame: perGameAt < 0 ? null : numeric(cells[perGameAt]?.content),
      },
    ];
  });

  return {
    season: season(raw.displayedSeasonOrProjection),
    rows,
    total: raw.paginatedResultSet?.totalNumResults ?? null,
    yearToDate: yearToDateCode(raw.displayedLists?.displayedSeasonOrProjections ?? []),
  };
}

/** The code for the current season's year-to-date numbers.
 *
 *  Chosen by start date rather than by list position or by parsing the season
 *  number out of the code, because both of those are guesses about a format
 *  Fantrax never documented, while the dates are data they publish. The current
 *  season is simply the latest one that has a start.
 *
 *  Null when they offer none — honoured by the caller as "ask for nothing and
 *  label whatever comes back", never as licence to compose a code ourselves. */
function yearToDateCode(seasons: readonly RawSeason[]): string | null {
  let best: RawSeason | null = null;
  for (const entry of seasons) {
    if (entry.timeframeTypeCode !== "YEAR_TO_DATE" || !entry.code) continue;
    if (typeof entry.startDate !== "number") continue;
    if (best === null || entry.startDate > (best.startDate ?? -Infinity)) best = entry;
  }
  return best?.code ?? null;
}
