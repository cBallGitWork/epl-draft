import { TABLE_RULES } from "./cups/declared";

// The lines across the league table: Fantrax's playoff says how many reach the semis; the rest are the league's own.

interface TableLine {
  /** The place the line is drawn under; it is the cut for what it names. */
  under: number;
  label: string;
}

/** The lines for a table of `teams`, top first. `semis` is Fantrax's playoff count, null when it runs none. */
export function tableLines(semis: number | null, teams: number): TableLine[] {
  if (semis === null) return [];
  const lines = [
    { under: 1, label: TABLE_RULES.top },
    { under: semis - 1, label: "Playoffs" },
    { under: semis - 1 + TABLE_RULES.playIn, label: "Play-in" },
    { under: TABLE_RULES.plateThrough, label: "Plate" },
  ];
  // Each below the one above, and never under the bottom row, which would announce a cut nobody missed.
  return lines.filter(
    (line, at) => line.under < teams && lines.slice(0, at).every((above) => above.under < line.under),
  );
}

/** The lines by the team each is drawn under, rows in the table's order: the last team at or above its cut, so a line
 *  never parts teams level on the table, unless that tie runs to the bottom row (all level before a game is played),
 *  when it falls back to the row in its place rather than vanish (Craig, 9 Oct 2026). */
export function linesAfter(lines: readonly TableLine[], rows: readonly { teamId: string; rank: number }[]): Map<string, TableLine[]> {
  const after = new Map<string, TableLine[]>();
  const bottom = rows[rows.length - 1];
  for (const line of lines) {
    const level = rows.findLast((row) => row.rank <= line.under);
    const holder = level !== undefined && level !== bottom ? level : rows[line.under - 1];
    if (holder === undefined || holder === bottom) continue;
    after.set(holder.teamId, [...(after.get(holder.teamId) ?? []), line]);
  }
  return after;
}
