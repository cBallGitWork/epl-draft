import type { StandingsRow } from "../types";
import type { RawStandingsPage, RawStandingsTable, RawTableCell } from "./standingsPage";

// The league table, off the page Fantrax draws for its own site. Pure.
//
// **The page is the whole source, and that is new.** The fxea array carries a
// rank, a total and a record squashed into one string; the page carries the
// columns Fantrax's own table is drawn from — `win`, `draw`, `loss`, `points`,
// `pointsFor`, `pointsAgainst`. Points is the number a league table is read for,
// three for a win in this league, and it exists on no other read.
//
// **The array used to be read alongside it, for `gamesBack` and nothing else.**
// That column is gone: games-back is a baseball convention, and on 31 Aug 2026
// the table was redrawn as a football one — `Pld W D L F A Pts`, which is
// `cm9900/24.jpg`'s own header and every league table printed in England. With
// it went the only reason the app and the edition writer each made a second
// provider call per cache window. The capture and shape-diff scripts still read
// the array, which is where a payload we do not print belongs.
//
// **Points is READ, never computed.** What a win is worth is a commissioner
// setting, not a fact about football (§3), so adding up three-a-win ourselves
// would be this app inventing a league rule it happens to have guessed right.
// Fantrax scores the competition; we print their number. `played` is the one
// exception and it is not really one — see the field's own note.
//
// The order is the league's rule: points, then fantasy points for (Craig, 23 Sep 2026). Level on
// both, Fantrax deals ranks afresh on every read, so those teams go by name and stay put.

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

    const won = cell("win");
    const drawn = cell("draw");
    const lost = cell("loss");

    rows.push({
      teamId: team.teamId,
      teamName: team.content ?? "",
      rank: number(at(row.fixedCells, fixed.get(RANK))?.content),
      won,
      drawn,
      lost,
      played: won + drawn + lost,
      points: cell("points"),
      pointsFor: cell("pointsFor"),
      pointsAgainst: cell("pointsAgainst"),
    });
  }

  return placeTable(rows);
}

/** The table in the league's order, placed 1st to last: points, then fantasy points for, then
 *  name, so teams level on both stop swapping places between reads. */
export function placeTable(rows: readonly StandingsRow[]): StandingsRow[] {
  return [...rows]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.pointsFor - a.pointsFor ||
        a.teamName.localeCompare(b.teamName, "en") ||
        a.teamId.localeCompare(b.teamId),
    )
    .map((row, at) => ({ ...row, rank: at + 1 }));
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
