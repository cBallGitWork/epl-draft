import { pencil, type Fault } from "../predictions/checks";
import { FINAL_HARD } from "./checks";
import type { SheetsDraft } from "./column";
import type { TieFacts } from "./facts";
import { SHEETS_PENCIL } from "./words";

// The writer's reply read into sections, and the best of two attempts kept section by section.

/** Each side's paragraph by team id; a side the reply left out is absent, and a reply that is not
 *  the shape is empty. */
export function readSheetsDraft(raw: Record<string, unknown>, ties: readonly TieFacts[]): SheetsDraft {
  const rows = Array.isArray(raw.ties) ? raw.ties : [];
  const out = new Map<string, string>();
  for (const tie of ties) {
    const home = tie.home.sheet.teamId;
    const away = tie.away.sheet.teamId;
    const row = rows.find((each: Record<string, unknown> | null) => each?.homeTeamId === home && each?.awayTeamId === away) as Record<string, unknown> | undefined;
    const take = (key: string, value: unknown) => {
      if (typeof value === "string" && value.trim() !== "") out.set(key, corrected(pencil(value.trim())));
    };
    take(home, row?.home);
    take(away, row?.away);
  }
  return out;
}

/** Per section: the first attempt the editor passed clean, else the last with no hard fault (a fact
 *  send-back that survived the rewrite counts as hard), else nothing, and the desk prints its plain
 *  line there instead. */
export function mergeSheets(attempts: readonly { draft: SheetsDraft; faults: readonly Fault[] }[]): SheetsDraft {
  const sections = new Set(attempts.flatMap((attempt) => [...attempt.draft.keys()]));
  const out = new Map<string, string>();
  for (const section of sections) {
    const faultsIn = (attempt: (typeof attempts)[number]) => attempt.faults.filter((fault) => fault.section === section);
    const clean = attempts.find((attempt) => attempt.draft.has(section) && faultsIn(attempt).every((fault) => fault.severity === "warn"));
    const passable = [...attempts].reverse().find((attempt) => attempt.draft.has(section) && faultsIn(attempt).every((fault) => fault.severity !== "hard" && !FINAL_HARD.has(fault.check)));
    const text = (clean ?? passable)?.draft.get(section);
    if (text !== undefined) out.set(section, text);
  }
  return out;
}

/** The house's corrections, made before the editor reads a word. */
function corrected(text: string): string {
  return SHEETS_PENCIL.reduce((out, [wrong, right]) => out.replace(wrong, right), text);
}
