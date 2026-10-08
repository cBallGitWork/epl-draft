import { numeric } from "./stats";

// `getStandings` with `view: "SCHEDULE"` → the whole season's results in one cookieless request, a table per period.
// Not a substitute for live scoring, which carries a moving total and who is still to play.

/** A cell; only team cells carry a `teamId`, so a row is read without knowing column order. */
interface RawScheduleCell {
  content?: string;
  teamId?: string;
}

interface RawScheduleTable {
  /** "Gameweek 4": Fantrax's word for the period, and the only place the table says which. */
  caption?: string;
  subCaption?: string;
  rows?: { cells?: RawScheduleCell[] }[];
}

export interface RawSchedulePage {
  tableList?: RawScheduleTable[];
}

/** What one team scored in one period, as Fantrax's own results table has it. */
export interface PeriodResult {
  /** Fantrax's period, whatever the caption says; mapping it to a gameweek is `periodGameweeks`' job. */
  period: number;
  teamId: string;
  /** Null for a cell that is not a number: an unscored fixture is not a 0-0. */
  points: number | null;
}

export function mapSeasonResults(raw: RawSchedulePage): PeriodResult[] {
  const results: PeriodResult[] = [];

  for (const table of raw.tableList ?? []) {
    const period = periodOf(table.caption);
    // A table we cannot number is dropped, never filed under a guessed week.
    if (period === null) continue;

    for (const row of table.rows ?? []) {
      const cells = row.cells ?? [];
      for (let at = 0; at < cells.length; at++) {
        const teamId = cells[at]?.teamId;
        if (teamId === undefined) continue;

        // A total is the next cell unless it names a team: a reordering must not read team "123" as a score.
        const next = cells[at + 1];
        if (next?.teamId !== undefined) continue;

        results.push({ period, teamId, points: numeric(next?.content) });
      }
    }
  }

  return results;
}

const CAPTION = /(\d+)\s*$/;

function periodOf(caption: string | undefined): number | null {
  const found = caption?.match(CAPTION);
  return found ? Number(found[1]) : null;
}
