import { keyed, numeric } from "./stats";
import { GOALS_AGAINST, GOALS_AGAINST_OUTFIELD } from "../categoryNames";

// `getStandings` with `view: "SEASON_STATS"` → every team's season totals per category, in one cookieless request.

/** A cell; only the team cell carries `teamId`, so a row is read without trusting column order. */
interface RawStatCell {
  content?: string;
  teamId?: string;
}

interface RawStatTable {
  /** "Clean Sheets On Field". Not unique: the keeper and outfield blocks share captions. */
  caption?: string;
  /** Keys unique within one table: `rank fpts diff1 team pos diff2` for the season, `rank fpts team pos` by date. */
  header?: { cells?: { key?: string }[] };
  rows?: { cells?: RawStatCell[] }[];
}

export interface RawSeasonStats {
  tableList?: RawStatTable[];
  /** Every team's name, keyed by `teamId`, so a board needs no second request. */
  fantasyTeamInfo?: Record<string, { name?: string }>;
}

/** One team's standing in one category. */
export interface CategoryLine {
  teamId: string;
  /** What Fantrax pays for this category. */
  points: number | null;
  /** The underlying figure — minutes, goals, clean sheets. */
  value: number | null;
}

/** Which half of the payload a table came from: Fantrax splits every category by position. */
export type Half = "keeper" | "outfield";

/** The zero-row headings that open each block: the only marker of the keeper/outfield boundary. */
const KEEPER_HEADING = "Standings By Category - Goalkeeper";
const OUTFIELD_HEADING = "Standings By Category - Outfielder";

/** A table's caption, trimmed: the outfield goals-against one ends in a space ("Goals Against Outfielders "). */
function caption(table: RawStatTable): string {
  return (table.caption ?? "").trim();
}

/** Goals against is one category under two names, the keeper's and the outfielders'; combined under the keeper's. */
function normalise(name: string): string {
  return name === GOALS_AGAINST_OUTFIELD.caption ? GOALS_AGAINST.caption : name;
}

/** Every category, both halves summed per team. Captions repeat across blocks, so the block is tracked by its heading;
 *  every figure is keyed `pos`, so it and FPts are read at offsets from the `teamId` cell, per the table's own header. */
export function mapSeasonStats(raw: RawSeasonStats): Map<string, CategoryLine[]> {
  const categories = new Map<string, Map<string, CategoryLine>>();
  let half: Half | null = null;

  for (const table of raw.tableList ?? []) {
    const name = caption(table);

    // The headings carry no rows and are not categories; they are the boundary.
    if (name === KEEPER_HEADING) {
      half = "keeper";
      continue;
    }
    if (name === OUTFIELD_HEADING) {
      half = "outfield";
      continue;
    }
    // Before the first heading come the summary and the roll-ups, a different shape.
    if (half === null) continue;

    const category = normalise(name);
    const lines = categories.get(category) ?? new Map<string, CategoryLine>();
    const offset = offsets(table);

    for (const row of table.rows ?? []) {
      const cells = row.cells ?? [];
      const at = cells.findIndex((cell) => cell.teamId !== undefined);
      if (at === -1) continue;

      const teamId = cells[at]?.teamId;
      if (teamId === undefined) continue;

      const points = numeric(cells[at + offset.points]?.content);
      const value = numeric(cells[at + offset.value]?.content);

      const held = lines.get(teamId);
      lines.set(teamId, {
        teamId,
        points: add(held?.points, points),
        value: add(held?.value, value),
      });
    }

    categories.set(category, lines);
  }

  const out = new Map<string, CategoryLine[]>();
  for (const [category, lines] of categories) out.set(category, [...lines.values()]);
  return out;
}

/** The season's layout, points two before the team and the figure one after; what a headerless table is read by. */
const SEASON_OFFSETS = { points: -2, value: 1 };

/** Where FPts and the figure sit relative to the team cell, by the table's own header. */
function offsets(table: RawStatTable): { points: number; value: number } {
  const header = table.header?.cells ?? [];
  const team = keyed(header, "team");
  const points = keyed(header, "fpts");
  const value = keyed(header, "pos");
  if (team === -1 || points === -1 || value === -1) return SEASON_OFFSETS;
  return { points: points - team, value: value - team };
}

/** Absence plus a number is that number; absence plus absence stays absent, never nought. */
function add(held: number | null | undefined, next: number | null): number | null {
  if (held === undefined || held === null) return next;
  if (next === null) return held;
  return held + next;
}

