import { NEWS_GAPS, banned, recordOrEmpty, unbackedFit } from "@epl/core";
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

/** What the Team Sheet printed about absent managers or absent news, and the FIT men whose note is a bare complaint. */
export function presserFaults(column: Record<string, unknown>): { phrases: string[]; fit: string[] } {
  return { phrases: banned(written(column), NEWS_GAPS), fit: unbackedFit(column.teamNews) };
}

/** The Team Sheet's send-back in the writer's terms, or "" when there is nothing to send back. */
export function sendBackPresser(faults: { phrases: string[]; fit: string[] }): string {
  const gaps = faults.phrases.length === 0 ? null : `YOUR LAST ATTEMPT WROTE ABOUT WHO DID NOT SPEAK OR WHAT WAS NOT SAID: ${faults.phrases.map((phrase) => `"${phrase}"`).join(", ")}. A reader wants who is out and who is back. Say that plainly, and never forecast who starts.`;
  const fit = faults.fit.length === 0 ? null : `THESE FIT MEN CARRY A BARE COMPLAINT AS THEIR NOTE, which reads as if they still have it: ${faults.fit.join(", ")}. Write "back from a muscle injury", or leave the note empty.`;
  return [gaps, fit].filter((part) => part !== null).join("\n\n");
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
  const faults = kind === "presser" ? presserFaults(column) : { phrases: [], fit: [] };
  if (offended.length === 0 && faults.phrases.length === 0 && faults.fit.length === 0) return column;

  say(`  ↩ ${kind} printed ${[...offended, ...faults.phrases, ...faults.fit.map((name) => `${name} FIT with a complaint`)].join(", ")} — sending it back once.`);
  const notes = [offended.length === 0 ? "" : sendBack(offended), sendBackPresser(faults)].filter((part) => part !== "");
  return writeColumn(system, `${brief}\n\n${notes.join("\n\n")}`);
}
