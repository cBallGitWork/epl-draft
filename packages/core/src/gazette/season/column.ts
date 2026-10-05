import { pencil, type Fault } from "../predictions/checks";
import type { SeasonCalls } from "./calls";
import { lineKey, type SeasonDraft } from "./checks";

// From what the model returned to what the desk files: the draft read on the desk's own keys, two attempts merged
// section by section, and the rankings put in the desk's order.

/** The model's column keyed on the desk's sides, pencilled; null when it is no column. */
export function readSeasonDraft(raw: unknown, calls: SeasonCalls): SeasonDraft | null {
  const column = raw as { deck?: unknown; opening?: unknown; table?: unknown } | null;
  if (column === null || typeof column !== "object" || !Array.isArray(column.table)) return null;
  const table = new Map<string, string>();
  for (const row of column.table as { teamId?: unknown; line?: unknown }[]) {
    const side = calls.sides.find((each) => each.teamId === row?.teamId);
    if (side !== undefined && !table.has(side.teamId)) table.set(side.teamId, pencil(text(row.line)));
  }
  return { deck: text(column.deck), opening: pencil(text(column.opening)), table };
}

/** Each section from the attempt with no hard fault in it and the fewest sent back, the later on a tie; a section
 *  hard in every attempt is left empty. */
export function mergeSeason(attempts: readonly { draft: SeasonDraft; faults: readonly Fault[] }[], calls: SeasonCalls): SeasonDraft {
  const latest = [...attempts].reverse();
  const count = (faults: readonly Fault[], section: string, severity: Fault["severity"]) => faults.filter((fault) => fault.section === section && fault.severity === severity).length;
  const clean = (section: string) =>
    latest
      .filter(({ faults }) => count(faults, section, "hard") === 0)
      .reduce<(typeof latest)[number] | null>((best, each) => (best === null || count(each.faults, section, "send-back") < count(best.faults, section, "send-back") ? each : best), null)?.draft ?? null;
  return {
    deck: clean("deck")?.deck ?? "",
    opening: clean("opening")?.opening ?? "",
    table: new Map(calls.sides.map((side) => [side.teamId, clean(lineKey(side.teamId))?.table.get(side.teamId) ?? ""])),
  };
}

/** The column as it files: his opening, his lines in the printed order under the desk's headline, and the editor's
 *  moves on the record. */
export function assembleSeason(draft: SeasonDraft, calls: SeasonCalls, headline: string): Record<string, unknown> {
  return {
    headline,
    deck: draft.deck,
    body: draft.opening,
    ranks: calls.sides.map((side) => ({ teamId: side.teamId, line: draft.table.get(side.teamId) ?? "" })),
    ...(calls.moved.length === 0 ? {} : { moves: calls.moved }),
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
