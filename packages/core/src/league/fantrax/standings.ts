import type { StandingsRow } from "../types";
import type { RawStandings } from "./raw";
import type { RawStandingsPage, RawStandingsTable, RawTableCell } from "./standingsPage";

// The league table, out of the two shapes Fantrax answers `getStandings` in.
// Pure.
//
// **The page leads, and that is the whole point of this file.** The fxea array
// carries a rank, a total and a record squashed into one string; the page
// carries the columns Fantrax's own table is drawn from — `win`, `draw`, `loss`,
// `points` and `winpc`. Points is the number a league table is read for, three
// for a win in this league, and it exists on no other read.
//
// **The array is here for exactly one column.** `gamesBack` is on it and on
// nothing else — checked against both surfaces on 29 Aug 2026, when it read
// 0-0-1-1 across the four rehearsal teams and was live rather than the row of
// noughts that once made it not worth reading. Half a game per win is a
// convention and not a fact, so it is read rather than worked out here. Its
// absence is modelled instead of defaulted: a second read is a second thing that
// can fail, and every other column on the table survives that failure.
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
/** Their key for the win fraction. Named `winpc` and rendered ".000"/"1.000",
 *  which is a proportion set baseball-style and not a percentage — the value for
 *  a side that has won every game is one. */
const WIN_PC = "winpc";

export function mapStandings(raw: RawStandingsPage, records: RawStandings): StandingsRow[] {
  const table = standingsTable(raw);
  if (table === null) return [];

  const fixed = columns(table.fixedHeader?.cells);
  const scrolling = columns(table.header?.cells);
  const behind = gamesBackByTeam(records);

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
      gamesBack: behind.get(team.teamId) ?? null,
      winPercentage: fraction(at(row.cells, scrolling.get(WIN_PC))?.content),
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

/** The same read, but absent rather than nought when there is nothing there.
 *
 *  A separate function from `number` above and not a flag on it, because the two
 *  answer different questions. Nought is a real record and a real points total;
 *  it is also a real win fraction, which is why a missing column has to be
 *  something else entirely. A team that has won nothing reads `.000`, and a
 *  table with no such column reads a dash. */
function fraction(content: string | undefined): number | null {
  if (content === undefined || content.trim() === "") return null;
  const value = Number(content);
  return Number.isFinite(value) ? value : null;
}

/** Games back, by team id, off the fxea array.
 *
 *  Empty for a league that has not started — the real league answers `[]` here
 *  every day until 10 Oct — and empty when the read failed, which the caller
 *  says by passing nothing. Both leave every row on a dash, which is the honest
 *  answer to "how far back" when nobody has played. */
function gamesBackByTeam(records: RawStandings): Map<string, number> {
  return new Map(
    records.flatMap((row) =>
      typeof row.teamId === "string" && typeof row.gamesBack === "number"
        ? ([[row.teamId, row.gamesBack]] as [string, number][])
        : [],
    ),
  );
}
