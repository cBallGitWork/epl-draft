import { sitsFor, startsFor, type Sheet, type SheetMan } from "./sheet";

// What moved between a side's last sheet and this one, and who starts for it for the first time.
// `history` is the side's earlier fielded sheets, oldest first; empty means this is its first.

export interface SheetChanges {
  count: number;
  in: { man: SheetMan; from: "bench" | "signed" }[];
  out: { man: SheetMan; to: "bench" | "gone" }[];
  /** How many rounds running the same eleven has now started, counting this one; 1 is a change. */
  unchangedFor: number;
}

/** Null on a side's first sheet: there is nothing to have changed from. */
export function changesBetween(now: Sheet, history: readonly Sheet[]): SheetChanges | null {
  const before = history.at(-1);
  if (before === undefined) return null;
  const came = now.starters.filter((man) => !startsFor(before, man.fantraxId));
  const went = before.starters.filter((man) => !startsFor(now, man.fantraxId));
  return {
    count: Math.max(came.length, went.length),
    in: came.map((man) => ({ man, from: sitsFor(before, man.fantraxId) ? "bench" : "signed" })),
    out: went.map((man) => ({ man, to: sitsFor(now, man.fantraxId) ? "bench" : "gone" })),
    unchangedFor: unchangedRun(now, history),
  };
}

/** Starters who never started for this side before; null on its first sheet, when all of them are. */
export function debuts(now: Sheet, history: readonly Sheet[]): SheetMan[] | null {
  if (history.length === 0) return null;
  return now.starters.filter((man) => !history.some((sheet) => startsFor(sheet, man.fantraxId)));
}

function unchangedRun(now: Sheet, history: readonly Sheet[]): number {
  let run = 1;
  for (let at = history.length - 1; at >= 0 && sameEleven(now, history[at]); at -= 1) run += 1;
  return run;
}

function sameEleven(a: Sheet, b: Sheet): boolean {
  return a.starters.length === b.starters.length && a.starters.every((man) => startsFor(b, man.fantraxId));
}
