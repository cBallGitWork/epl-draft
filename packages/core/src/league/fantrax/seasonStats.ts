import { numeric } from "./stats";
import { GOALS_AGAINST, GOALS_AGAINST_OUTFIELD } from "../categoryNames";

// `getStandings` with `view: "SEASON_STATS"` — every team's season totals, per
// category, in one anonymous request.
//
// Probed 1 Sep 2026: 29 tables, 52 KB, no cookie. A summary, four per-position
// roll-ups, 22 single-category leaderboards, and two zero-row section headings.
// Craig asked for the CM "Average Rating" board on this data (1 Sep): one
// category at a time, every team ranked, by fantasy points or by the raw figure.
//
// **Two traps live in this payload and both would ship as plausible wrong
// numbers.** They are the whole reason this file is not ten lines.

/** A cell. Only the one naming a team carries `teamId`, which is how a row is
 *  read without trusting the column order — the same tell `results.ts` uses. */
interface RawStatCell {
  content?: string;
  teamId?: string;
}

interface RawStatTable {
  /** "Clean Sheets On Field". **Not unique**: the goalkeeper block and the
   *  outfielder block publish the same caption for the same category, which is
   *  trap 1 below. */
  caption?: string;
  rows?: { cells?: RawStatCell[] }[];
}

export interface RawSeasonStats {
  tableList?: RawStatTable[];
  /** Every team's name and badge, keyed by `teamId`. Carried on this read, so a
   *  board built from it needs no second request to name a row. */
  fantasyTeamInfo?: Record<string, { name?: string; logoUrl512?: string }>;
}

/** One team's standing in one category. */
export interface CategoryLine {
  teamId: string;
  /** What Fantrax pays for this category. */
  points: number | null;
  /** The underlying figure — minutes, goals, clean sheets. */
  value: number | null;
}

/** Which half of the payload a table came from.
 *
 *  Fantrax splits every category by position, and the two blocks are the only
 *  place that split is stated. */
export type Half = "keeper" | "outfield";

/** The section headings that open each block. Zero rows, and their only job is
 *  to say what follows — which makes them load-bearing rather than noise. */
const KEEPER_HEADING = "Standings By Category - Goalkeeper";
const OUTFIELD_HEADING = "Standings By Category - Outfielder";

/** Fantrax's caption for the outfield goals-against table carries a TRAILING
 *  SPACE ("Goals Against Outfielders "). Trimmed on read rather than matched
 *  with the space in a literal, because a space nobody can see is not a thing to
 *  build a comparison on. */
function caption(table: RawStatTable): string {
  return (table.caption ?? "").trim();
}

/** Goals against is one category under two names — `Goals Against` for the
 *  keeper, `Goals Against Outfielders` for everyone in front of him. Craig,
 *  1 Sep: "goals against is a def and keeper stat, so we can combine that." */
function normalise(name: string): string {
  return name === GOALS_AGAINST_OUTFIELD.caption ? GOALS_AGAINST.caption : name;
}

/** Every category in the payload, with both halves read and combined.
 *
 *  **Trap 1 — the caption does not identify the table.** Tables 6-17 are the
 *  goalkeeper's and 19-28 are the outfielder's, and `Clean Sheets On Field`
 *  appears in both with the same caption and different numbers. Matching by
 *  caption alone silently reads whichever came first and throws the other away.
 *  The zero-row section headings are the only marker of the boundary, so the
 *  block is tracked as the list is walked.
 *
 *  **Trap 2 — the columns must be read by POSITION.** The header publishes
 *  `['rank','fpts','diff1','team','pos','diff2']`, and the category's own figure
 *  sits under the generic key `pos`. `mapStandings` ten feet up this folder
 *  reads by key and never by index, precisely so a manager reordering their
 *  table cannot break it — here that rule does the opposite, because eleven
 *  stats share one key (PLATFORM_NOTES records the probe). The team cell is
 *  found by its `teamId` and the two figures are taken relative to it, so a
 *  reordering still cannot put a name where a number belongs.
 *
 *  Combining is a sum, and it is a sum of things Fantrax scored separately for
 *  one squad: `123` had 0 clean sheets in goal and 4 on the field, for 0 and 13
 *  points. Verified against the live payload rather than assumed. */
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
    // Everything before the first heading is the summary and the roll-ups, which
    // are a different shape and a different question.
    if (half === null) continue;

    const category = normalise(name);
    const lines = categories.get(category) ?? new Map<string, CategoryLine>();

    for (const row of table.rows ?? []) {
      const cells = row.cells ?? [];
      const at = cells.findIndex((cell) => cell.teamId !== undefined);
      if (at === -1) continue;

      const teamId = cells[at]?.teamId;
      if (teamId === undefined) continue;

      // Points sit two before the team, the figure one after it. Relative to the
      // team cell rather than at fixed indices, so the row survives a column
      // being added at the front — which is what `rank` and `diff1` already are.
      const points = numeric(cells[at - 2]?.content);
      const value = numeric(cells[at + 1]?.content);

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

/** Absence plus a number is that number; absence plus absence stays absent. A
 *  keeper-only category has no outfield half to add, and reading that as nought
 *  would be indistinguishable from a squad that genuinely recorded none. */
function add(held: number | null | undefined, next: number | null): number | null {
  if (held === undefined || held === null) return next;
  if (next === null) return held;
  return held + next;
}

