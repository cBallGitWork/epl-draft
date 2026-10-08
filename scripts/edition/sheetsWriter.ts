import { assembleSheets, checkSheets, mergeSheets, readSheetsDraft, type Fault, type SheetsDraft } from "@epl/core";
import type { Say } from "./newsroom";
import { sendBackOnce } from "./sendBack";
import type { SheetsDesk } from "./sheets";
import { SHEETS_VOICE, sheetsSendBack } from "./voice/sheets";

// The newsroom behind team news: the desk writes, the editor reads every paragraph against the
// facts, it goes back once if it has to, and a paragraph that fails twice prints the desk's plain line.

/** The column ready to file. Throws only when the first call cannot be made at all, which leaves
 *  the key unspent for the next firing. */
export async function writeSheets(desk: SheetsDesk, brief: string, say: Say): Promise<Record<string, unknown>> {
  const check = { ties: desk.ties, facts: brief, clubs: desk.clubs };
  const attempt = (raw: Record<string, unknown>): { draft: SheetsDraft; faults: Fault[] } => {
    const draft = readSheetsDraft(raw, desk.ties);
    return { draft, faults: checkSheets(draft, check) };
  };
  const names = new Map(desk.ties.flatMap((tie) => [tie.home.sheet, tie.away.sheet]).map((sheet) => [sheet.teamId, sheet.teamName]));
  const label = (section: string) => names.get(section) ?? `the meeting line ${section}`;

  const attempts = await sendBackOnce({ desk: "sheets", voice: SHEETS_VOICE, brief, read: attempt, sendBack: (faults) => sheetsSendBack(faults, label) }, say);

  const draft = mergeSheets(attempts);
  const plain = desk.ties.flatMap((tie) => [tie.home.sheet, tie.away.sheet]).filter((sheet) => !draft.has(sheet.teamId));
  if (plain.length > 0) say(`  ⚠ sheets: ${plain.length} sides print the desk's plain line; their paragraphs failed twice.`);
  return assembleSheets({ gameweek: desk.gameweek, ties: desk.ties, draft, against: desk.against });
}
