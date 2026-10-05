import { pencil, type Fault } from "../predictions/checks";
import type { SeasonCalls } from "./calls";
import { SEASON_SECTIONS, lineKey, type SeasonDraft } from "./checks";

// From what the model returned to what the desk files: the draft read on the desk's own keys, two attempts merged
// section by section, and the table put in the desk's order.

/** The model's column keyed on the desk's sides, pencilled; null when it is no column. */
export function readSeasonDraft(raw: unknown, calls: SeasonCalls): SeasonDraft | null {
  const column = raw as Partial<Record<"deck" | (typeof SEASON_SECTIONS)[number], unknown>> & { table?: unknown } | null;
  if (column === null || typeof column !== "object" || !Array.isArray(column.table)) return null;
  const table = new Map<string, string>();
  for (const row of column.table as { teamId?: unknown; line?: unknown }[]) {
    const side = calls.sides.find((each) => each.teamId === row?.teamId);
    if (side !== undefined && !table.has(side.teamId)) table.set(side.teamId, pencil(text(row.line)));
  }
  const [opening, title, playoffs, spoon, bold] = SEASON_SECTIONS.map((section) => pencil(text(column[section])));
  return { deck: text(column.deck), opening, title, playoffs, spoon, bold, table };
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
  const [opening, title, playoffs, spoon, bold] = SEASON_SECTIONS.map((section) => clean(section)?.[section] ?? "");
  return {
    deck: clean("deck")?.deck ?? "",
    opening,
    title,
    playoffs,
    spoon,
    bold,
    table: new Map(calls.sides.map((side) => [side.teamId, clean(lineKey(side.teamId))?.table.get(side.teamId) ?? ""])),
  };
}

/** The column as it files: his words in the desk's order, and the table the desk's. */
export function assembleSeason(draft: SeasonDraft, calls: SeasonCalls, headline: string): Record<string, unknown> {
  return {
    headline,
    deck: draft.deck,
    body: SEASON_SECTIONS.map((section) => draft[section]).filter((paragraph) => paragraph !== "").join("\n\n"),
    ranks: calls.sides.map((side) => ({ teamId: side.teamId, line: draft.table.get(side.teamId) ?? "" })),
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
