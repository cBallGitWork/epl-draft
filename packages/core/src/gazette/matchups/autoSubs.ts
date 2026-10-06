import type { DraftMan, PositionLimits } from "./types";

// Fantrax's end-of-period auto subs, in advance: a starter with every match done and no minutes gives way to the first
// reserve by bench number who has played or may yet and keeps every position within its limits.

export interface AutoSub {
  out: DraftMan;
  in: DraftMan;
  /** True when the reserve has not played yet: he comes in only if he does. */
  provisional: boolean;
  /** A man ahead of `out`, still to play, whom this reserve replaces instead if he blanks; null when none. */
  ahead: DraftMan | null;
}

/** A man who will finish the period with no minutes: every match done, none of it played. */
export const blank = (man: DraftMan) => man.minutes === 0 && man.left === 0;
/** A man who has played, or still may. */
const available = (man: DraftMan) => man.minutes > 0 || man.left > 0;

function fits(eleven: readonly DraftMan[], out: DraftMan, candidate: DraftMan, limits: PositionLimits): boolean {
  const count = (slot: string) => eleven.filter((m) => m !== out && m.slot === slot).length + (candidate.slot === slot ? 1 : 0);
  const slots = new Set([...eleven.map((m) => m.slot), candidate.slot, ...Object.keys(limits.min), ...Object.keys(limits.max)]);
  return [...slots].every((slot) => count(slot) >= (limits.min[slot] ?? 0) && count(slot) <= (limits.max[slot] ?? Infinity));
}

/** The substitutions Fantrax will make, in the eleven's order, from `bench` as numbered; each reserve comes on once. */
export function autoSubs(eleven: readonly DraftMan[], bench: readonly DraftMan[], limits: PositionLimits): AutoSub[] {
  const lineup = [...eleven];
  const used = new Set<string>();
  const subs: AutoSub[] = [];
  for (const out of eleven.filter(blank)) {
    const candidate = bench.find((b) => !used.has(b.fantraxId) && available(b) && fits(lineup, out, b, limits));
    if (candidate === undefined) continue;
    const ahead = eleven.slice(0, eleven.indexOf(out)).find((m) => m.left > 0 && m.minutes === 0 && fits(lineup, m, candidate, limits)) ?? null;
    used.add(candidate.fantraxId);
    lineup[lineup.indexOf(out)] = candidate;
    subs.push({ out, in: candidate, provisional: candidate.minutes === 0, ahead });
  }
  return subs;
}
