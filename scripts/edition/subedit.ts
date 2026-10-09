import { banned, recordOrEmpty } from "@epl/core";
import { writeColumn, type Say } from "./newsroom";
import { sendBack } from "./voice/house";

// The sub-editor's pass: the column read back against the register and sent back ONCE if it reached for a banned
// phrase; a second offence files anyway, and says so. It reads the raw column, before `file()`, so checking never
// stamps two `filedAt` instants on one story.

/** The written surfaces of a column as one string, the headline IN it (unlike `checks.prose()`): it is where a
 *  banned word did its damage, five times on one front page. A team-news row's line and notes are the Team Sheet. */
export function written(column: Record<string, unknown>): string {
  return [...["headline", "deck", "body"].map((key) => column[key]), ...rowWords(column.teamNews)]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
}

/** Each team-news row's own words, its line and each man's note; never the quote, which is a manager's and is carried. */
function rowWords(rows: unknown): unknown[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    const { line, men } = recordOrEmpty(row);
    return [line, ...(Array.isArray(men) ? men.map((man) => recordOrEmpty(man).note) : [])];
  });
}

export async function writeSubedited(
  system: string,
  brief: string,
  /** How the desk reports sending one back. Injected so this file does no I/O
   *  of its own and the orchestrator keeps one voice for its log. */
  say: Say,
  kind: string,
): Promise<Record<string, unknown>> {
  const column = await writeColumn(system, brief);
  const offended = banned(written(column));
  if (offended.length === 0) return column;

  say(`  ↩ ${kind} printed ${offended.join(", ")} — sending it back once.`);
  return writeColumn(system, `${brief}\n\n${sendBack(offended)}`);
}
