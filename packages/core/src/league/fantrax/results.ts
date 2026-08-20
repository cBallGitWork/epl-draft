// `getStandings` with `view: "SCHEDULE"` — the whole season's results, in one
// anonymous request.
//
// Probed 20 Aug 2026: it answers 38 tables, one per period, each captioned by
// Fantrax's own hand as "Gameweek N" and carrying one row per pairing with both
// teams and both totals. No cookie. That is the difference between a season view
// costing one request and costing thirty-eight of `getLiveScoringStats`.
//
// It does NOT replace the live read. This is their results table; the live one
// carries a total that moves during a match and a count of who is still to play.
// Different questions, and the screens that ask them are different screens.

/** A cell. Only the ones naming a team carry a `teamId`, which is what lets the
 *  row be read without knowing the column order. */
interface RawScheduleCell {
  content?: string;
  teamId?: string;
}

interface RawScheduleTable {
  /** "Gameweek 4". Fantrax's word for the period, and the only place the table
   *  says which period it is. */
  caption?: string;
  subCaption?: string;
  rows?: { cells?: RawScheduleCell[] }[];
}

export interface RawSchedulePage {
  tableList?: RawScheduleTable[];
}

/** What one team scored in one period, as Fantrax's own results table has it. */
export interface PeriodResult {
  /** Fantrax's period. Their caption says "Gameweek" and means this — the two
   *  are one-to-one all season but they are not the same claim, and the mapping
   *  belongs to `periodGameweeks`, not to a caption. */
  period: number;
  teamId: string;
  /** Null when the cell held nothing we can read as a number. Absence is not
   *  nought: a fixture Fantrax has not scored has not been drawn 0-0. */
  points: number | null;
}

export function mapSeasonResults(raw: RawSchedulePage): PeriodResult[] {
  const results: PeriodResult[] = [];

  for (const table of raw.tableList ?? []) {
    const period = periodOf(table.caption);
    // A table we cannot number is a table we cannot file. Dropping it loses one
    // gameweek; guessing at its number would put a result under the wrong week.
    if (period === null) continue;

    for (const row of table.rows ?? []) {
      const cells = row.cells ?? [];
      for (let at = 0; at < cells.length; at++) {
        const teamId = cells[at]?.teamId;
        if (teamId === undefined) continue;

        // A team's total is the cell after it — but only if that cell is a total
        // and not the next team. Which column comes first is theirs to change,
        // and the two score columns share the key `fpts`, so the header cannot
        // tell them apart either; what a score cell CAN be recognised by is
        // naming no team. Without the check, a reordering to Away/Home/Pts/Pts
        // reads the second team's NAME as the first team's score — and a team
        // called "123", which this league has, parses as a hundred and
        // twenty-three rather than failing loudly.
        const next = cells[at + 1];
        if (next?.teamId !== undefined) continue;

        results.push({ period, teamId, points: number(next?.content) });
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

function number(content: string | undefined): number | null {
  if (content === undefined || content.trim() === "") return null;
  const value = Number(content);
  return Number.isFinite(value) ? value : null;
}
