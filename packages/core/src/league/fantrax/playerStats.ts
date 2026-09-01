// Per-player RAW stats — goals, assists, clean sheets, saves, cards — from
// `getPlayerStats`, which only answers them when asked by position group.
//
// Craig, 1 Sep 2026, wanting CM's "Average Rating" board for players: rank, the
// man, his fantasy team, his club, and one raw count. Fantasy points are not the
// question on that screen; what he did is.
//
// **Two calls cover the pool**, because Fantrax splits its stat vocabulary the
// same way `SEASON_STATS` does — a keeper's columns are not an outfielder's. The
// split is real rather than cosmetic: `CS` means the 60-minute clean sheet in
// both, but only a keeper has `Sv` and `GA`, and only an outfielder has `GAO`.
//
// **Combining is a CONCATENATION here, not a sum**, and that is the difference
// from `seasonStats.ts` one file over. There, both halves describe the same
// squad and their figures add; here each player is in exactly one half —
// measured 1 Sep 2026 on the dummy league: 563 outfield, 83 keepers, 646 total,
// **zero overlap**. So the two lists are appended and nothing is added up. Every
// row carried a club name and 150 of the 646 carried an owner, the rest being
// free agents.
//
// `SOCCER_GOALIE` and `POS_704` are the same group and return byte-identical
// columns and rows (checked). The readable one is used.

/** Which half of the pool to ask for. Fantrax's own strings. */
export type PositionGroup = "SOCCER_NON_GOALIE" | "SOCCER_GOALIE";

export const OUTFIELD: PositionGroup = "SOCCER_NON_GOALIE";
export const KEEPER: PositionGroup = "SOCCER_GOALIE";

interface RawHeaderCell {
  /** "G", "A", "CS". The only stable handle on a column — `key` is `sc` for
   *  every stat, which is the same trap `SEASON_STATS` sets one file over. */
  shortName?: string;
  name?: string;
}

interface RawStatCell {
  content?: string;
  /** Present on the STATUS cell when a team holds him, and it is how the board
   *  names an owner without a second read or a name match. */
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
}

export interface RawPlayerStats {
  statsTable?: { scorer?: RawScorer; cells?: RawStatCell[] }[];
  tableHeader?: { cells?: RawHeaderCell[] };
}

/** One player's line: who he is, who holds him, and every raw stat the read
 *  carried, keyed by Fantrax's own column abbreviation. */
export interface PlayerStatLine {
  fantraxId: string;
  name: string;
  /** His Premier League club, as Fantrax spells it. Null when the read did not
   *  say — an ordinary state for a player between clubs. */
  club: string | null;
  clubShort: string | null;
  /** What Fantrax lists him as. Not the league's eligibility, which is the
   *  commissioner's setting and lives on `PoolPlayer.eligiblePositions`. */
  position: string | null;
  /** The fantasy team holding him, or null for nobody. Null is the honest
   *  answer for a free agent and the board says so in words. */
  ownerTeamId: string | null;
  /** Raw counts by column abbreviation — `G`, `A`, `CS`, `Sv`, `YC`. Absent
   *  rather than nought when the column was not in this half's vocabulary: a
   *  keeper has no `GAO` and an outfielder has no `Sv`, and printing nought for
   *  either would be a statistic about a thing that cannot happen. */
  stats: Record<string, number | null>;
}

/** The columns before the stats begin. `Rk Sta Opp FPts FP/G Ros +/-` are on
 *  every response whatever the group, and the raw stats follow them. Named
 *  rather than counted so that a column appearing or vanishing at the front
 *  cannot shift every stat by one. */
const FANTASY_COLUMNS = new Set(["Rk", "Sta", "Opp", "FPts", "FP/G", "Ros", "+/-"]);

/** The STATUS cell, which carries the owner. Third of the seven, but found by
 *  its header rather than at index 1 — the same rule the rest of this file
 *  follows and for the same reason. */
const STATUS = "Sta";

/** Read one group's response.
 *
 *  **Columns by header, values by index.** The header names each column and the
 *  row is a flat array in the same order, so the two are zipped rather than the
 *  values being read at literal positions — a column added at the front is then
 *  a column added, not every figure shifted by one. This is the inverse of
 *  `mapStandings`' read-by-key rule and the same inversion `mapSeasonStats`
 *  needs, because `key` is the useless `sc` on every stat column. */
export function mapPlayerStats(raw: RawPlayerStats): PlayerStatLine[] {
  const heads = (raw.tableHeader?.cells ?? []).map((cell) => cell.shortName ?? "");
  const lines: PlayerStatLine[] = [];

  for (const row of raw.statsTable ?? []) {
    const scorerId = row.scorer?.scorerId;
    if (scorerId === undefined) continue;

    const cells = row.cells ?? [];
    const stats: Record<string, number | null> = {};
    let ownerTeamId: string | null = null;

    for (const [at, head] of heads.entries()) {
      const cell = cells[at];
      if (head === STATUS) {
        ownerTeamId = cell?.teamId ?? null;
        continue;
      }
      if (head === "" || FANTASY_COLUMNS.has(head)) continue;
      stats[head] = number(cell?.content);
    }

    lines.push({
      fantraxId: scorerId,
      name: row.scorer?.name ?? scorerId,
      club: row.scorer?.teamName ?? null,
      clubShort: row.scorer?.teamShortName ?? null,
      position: row.scorer?.posShortNames ?? null,
      ownerTeamId,
      stats,
    });
  }

  return lines;
}

/** Fantrax comma-groups thousands — "3,368" minutes — so the separator is
 *  stripped before parsing. Without it every four-figure total reads as 3. */
function number(content: string | undefined): number | null {
  if (content === undefined || content.trim() === "") return null;
  const parsed = Number(content.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
