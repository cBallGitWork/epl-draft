import type { StandingsRow } from "../types";
import type { RawStandingsPage, RawStandingsTable, RawTableCell } from "./standingsPage";

// The league table, off Fantrax's own standings page. Pure.
//
// **It reads the fxpa page and not the fxea array, and that is the whole point
// of this file.** The array carries a rank, a total and a record squashed into
// one string; the page carries the columns Fantrax's own table is drawn from —
// `win`, `draw`, `loss` and `points`. Points is the number a league table is
// read for, three for a win in this league, and it exists on no other read.
//
// **And it is READ, never computed.** What a win is worth is a commissioner
// setting, not a fact about football (§3), so adding up three-a-win ourselves
// would be this app inventing a league rule it happens to have guessed right.
// Fantrax scores the competition; we print their number.
//
// The order is theirs too. `rank` comes off the row rather than from sorting on
// anything of ours: a table whose points tie is broken by fantasy points scored
// — and then by whatever else they do — is their arrangement to make.

/** Which columns we read, by Fantrax's own key. Never by position: the header
 *  publishes a key per column, their site lets a manager reorder them, and a
 *  table read positionally would file wins under draws the day that happens. */
const RANK = "rank";
const TEAM = "team";

export function mapStandings(raw: RawStandingsPage): StandingsRow[] {
  const table = standingsTable(raw);
  if (table === null) return [];

  const fixed = columns(table.fixedHeader?.cells);
  const scrolling = columns(table.header?.cells);

  const rows: StandingsRow[] = [];
  for (const row of table.rows ?? []) {
    // The team is in the pinned columns, and it is the only cell carrying an
    // id. A row that names no team cannot be shown against anything.
    const team = at(row.fixedCells, fixed.get(TEAM));
    if (team?.teamId === undefined) continue;

    const cell = (key: string) => number(at(row.cells, scrolling.get(key))?.content);

    rows.push({
      teamId: team.teamId,
      teamName: team.content ?? "",
      rank: number(at(row.fixedCells, fixed.get(RANK))?.content),
      won: cell("win"),
      drawn: cell("draw"),
      lost: cell("loss"),
      points: cell("points"),
      pointsFor: cell("pointsFor"),
    });
  }

  return rows.sort((a, b) => a.rank - b.rank);
}

/** The standings table, out of a page that also carries one table per played
 *  round.
 *
 *  Found by the pinned TEAM column, which only the standings table has: the
 *  round tables put both sides in ordinary cells and have no `fixedHeader` at
 *  all. Not by the caption — "Standings" is a display string, and the round
 *  captions ("Gameweek 2") are already Fantrax's word for something we call a
 *  period. */
function standingsTable(raw: RawStandingsPage): RawStandingsTable | null {
  return (
    raw.tableList?.find((table) =>
      table.fixedHeader?.cells?.some((cell) => cell.key === TEAM),
    ) ?? null
  );
}

/** Column key → its index, for a header we have. */
function columns(cells: { key?: string }[] | undefined): Map<string, number> {
  const found = new Map<string, number>();
  cells?.forEach((cell, at) => {
    if (cell.key !== undefined && !found.has(cell.key)) found.set(cell.key, at);
  });
  return found;
}

function at(cells: RawTableCell[] | undefined, index: number | undefined): RawTableCell | undefined {
  return index === undefined ? undefined : cells?.[index];
}

/** Nought for a cell we cannot read, which is what every other number on this
 *  table already does — and for a column Fantrax stops publishing, which is a
 *  shape change `npm run shape-diff` is the thing that reports. */
function number(content: string | undefined): number {
  const value = Number(content);
  return Number.isFinite(value) ? value : 0;
}
