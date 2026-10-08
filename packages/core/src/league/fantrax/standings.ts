import type { StandingsRow } from "../types";
import type { RawStandingsPage, RawStandingsTable, RawTableCell } from "./standingsPage";
import { numeric } from "./stats";

// The league table, off the page Fantrax draws for its own site: the only read carrying league points. Pure.
// Points are READ, never computed, as what a win is worth is a commissioner setting.

/** Columns are read by Fantrax's key, never position: a manager can reorder them on their site. */
const RANK = "rank";
const TEAM = "team";

export function mapStandings(raw: RawStandingsPage): StandingsRow[] {
  const table = standingsTable(raw);
  if (table === null) return [];

  const fixed = columns(table.fixedHeader?.cells);
  const scrolling = columns(table.header?.cells);

  const rows: StandingsRow[] = [];
  for (const row of table.rows ?? []) {
    // The team is the pinned columns' only cell with an id; a row naming no team is skipped.
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

/** The table in the league's order: points, then fantasy points for. Teams level on both share a place (1, 1, 3) and
 *  are listed by name, as Fantrax re-deals its own ranks for them on every read. */
export function placeTable(rows: readonly StandingsRow[]): StandingsRow[] {
  const ordered = [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.pointsFor - a.pointsFor ||
      a.teamName.localeCompare(b.teamName, "en") ||
      a.teamId.localeCompare(b.teamId),
  );
  const placed: StandingsRow[] = [];
  ordered.forEach((row, at) => {
    const above = placed[at - 1];
    const level = above !== undefined && above.points === row.points && above.pointsFor === row.pointsFor;
    placed.push({ ...row, rank: level ? above.rank : at + 1 });
  });
  return placed;
}

/** The standings table among the per-round ones: the only one with a pinned TEAM column, never found by caption. */
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

/** Nought for a cell we cannot read; a column Fantrax stops publishing is for `npm run shape-diff` to report. */
function number(content: string | undefined): number {
  return numeric(content) ?? 0;
}
