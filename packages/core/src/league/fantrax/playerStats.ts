import { numeric } from "./stats";

// Per-player RAW stats (goals, assists, clean sheets, saves, cards) from `getPlayerStats`, asked by position group.
// Two calls cover the pool, keepers and outfielders, with different columns; each man is in one, so append, never sum.

/** Which half of the pool to ask for. Fantrax's own strings. */
export type PositionGroup = "SOCCER_NON_GOALIE" | "SOCCER_GOALIE";

export const OUTFIELD: PositionGroup = "SOCCER_NON_GOALIE";
export const KEEPER: PositionGroup = "SOCCER_GOALIE";

interface RawHeaderCell {
  /** "G", "A", "CS": the only stable handle on a column, as `key` is `sc` on every stat. */
  shortName?: string;
  name?: string;
}

interface RawStatCell {
  content?: string;
  /** Present on the STATUS cell when a team holds him: his owner, with no second read or name match. */
  teamId?: string;
}

interface RawScorer {
  scorerId?: string;
  name?: string;
  shortName?: string;
  /** The Premier League club, spelled out — "Arsenal". */
  teamName?: string;
  /** And abbreviated — "ARS". */
  teamShortName?: string;
  /** Fantrax's position letters for him, e.g. "F" or "F,M". */
  posShortNames?: string;
  /** The position his points are priced at, as an id into `posOrGroupList`: "702". */
  defaultPosId?: string;
}

export interface RawPlayerStats {
  statsTable?: { scorer?: RawScorer; cells?: RawStatCell[] }[];
  tableHeader?: { cells?: RawHeaderCell[] };
  /** Each position's id and letter: `{ id: "POS_702", shortName: "M" }`. */
  posOrGroupList?: { id?: string; shortName?: string }[];
}

/** One player's line: who he is, who holds him, and every raw stat read, by Fantrax's column abbreviation. */
export interface PlayerStatLine {
  fantraxId: string;
  name: string;
  /** His Premier League club as Fantrax spells it; null when unsaid, as for a man between clubs. */
  club: string | null;
  clubShort: string | null;
  /** What Fantrax lists him as, not the league's eligibility (`PoolPlayer.eligiblePositions`). */
  position: string | null;
  /** The fantasy team holding him, or null for a free agent. */
  ownerTeamId: string | null;
  /** The letter his points are priced at: a free agent has no slot, so this is the only honest one. */
  defaultPosition: string | null;
  /** Fantrax's points over whatever the read covered. */
  points: number | null;
  /** Raw counts by column abbreviation (`G`, `A`, `CS`, `Sv`, `YC`); absent, not nought, where this half lacks one. */
  stats: Record<string, number | null>;
}

/** The fantasy columns before the raw stats, named rather than counted so one appearing at the front shifts nothing. */
const FANTASY_COLUMNS = new Set(["Rk", "Sta", "Opp", "FPts", "FP/G", "Ros", "+/-"]);

/** The STATUS cell, which carries the owner, found by header like every other column. */
const STATUS = "Sta";
const POINTS = "FPts";
/** `defaultPosId` "702" is `posOrGroupList`'s "POS_702". */
const POSITION_ID = "POS_";

/** Read one group's response: each header zipped with the row cell at its index, as `key` is `sc` on every stat. */
export function mapPlayerStats(raw: RawPlayerStats): PlayerStatLine[] {
  const heads = (raw.tableHeader?.cells ?? []).map((cell) => cell.shortName ?? "");
  const letters = new Map((raw.posOrGroupList ?? []).map((each) => [each.id ?? "", each.shortName ?? null]));
  const lines: PlayerStatLine[] = [];

  for (const row of raw.statsTable ?? []) {
    const scorerId = row.scorer?.scorerId;
    if (scorerId === undefined) continue;

    const cells = row.cells ?? [];
    const stats: Record<string, number | null> = {};
    let ownerTeamId: string | null = null;
    let points: number | null = null;

    for (const [at, head] of heads.entries()) {
      const cell = cells[at];
      if (head === STATUS) {
        ownerTeamId = cell?.teamId ?? null;
        continue;
      }
      if (head === POINTS) points = numeric(cell?.content);
      if (head === "" || FANTASY_COLUMNS.has(head)) continue;
      stats[head] = numeric(cell?.content);
    }

    lines.push({
      fantraxId: scorerId,
      name: row.scorer?.name ?? scorerId,
      club: row.scorer?.teamName ?? null,
      clubShort: row.scorer?.teamShortName ?? null,
      position: row.scorer?.posShortNames ?? null,
      ownerTeamId,
      defaultPosition: letters.get(`${POSITION_ID}${row.scorer?.defaultPosId ?? ""}`) ?? null,
      points,
      stats,
    });
  }

  return lines;
}

