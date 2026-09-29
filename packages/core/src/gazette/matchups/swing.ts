import { DRAFT_DESK } from "../../config";
import type { SideState } from "./state";
import type { DraftMan, SlotWorth, Worth } from "./types";

// What the side behind needs from the men it has left, after the minutes both sides' men will be paid for playing: which
// single return (a goal, an assist, a clean sheet, a defensive bonus or a keeper's saves, at the slot's price) draws or
// wins it, the fewest that would, and when every return they could make falls short (Craig, 29 Sep 2026: "work out how
// many points are needed, or when a lead has got too far").

export interface Return extends Worth {
  man: DraftMan;
}

const pts = (n: number) => `${n} point${n === 1 ? "" : "s"}`;
const ARTICLE: Record<Worth["kind"], string> = { goal: "a goal from", assist: "an assist from", "clean sheet": "a clean sheet for", "defensive bonus": "a defensive bonus for", saves: "saves for" };
const said = (r: Return) => `${ARTICLE[r.kind]} ${r.man.name} (${r.worth})`;
const either = (list: readonly string[]) => (list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} or ${list.at(-1)}`);

/** Every return the men left could make, one of each per match left, richest first. */
export function returnsOf(men: readonly DraftMan[], worth: SlotWorth): Return[] {
  return men
    .flatMap((man) => Array.from({ length: man.left }, () => (worth.returns[man.slot] ?? []).map((w) => ({ ...w, man }))).flat())
    .filter((r) => r.worth > 0)
    .sort((a, b) => b.worth - a.worth);
}

/** Minutes still to be paid for, a full match for each match left. */
const playing = (men: readonly DraftMan[], worth: SlotWorth) => men.reduce((sum, m) => sum + m.left, 0) * worth.appearance;

/** The side behind's sums, as facts. `gap` is how far behind they are, above nought. */
export function chaseLines(chasing: SideState, ahead: SideState, gap: number, worth: SlotWorth): string[] {
  const name = chasing.side.name;
  // Both sides' minutes still to be paid come off the gap first; the brief states only what returns must make up.
  const short = gap - playing(chasing.left, worth) + playing(ahead.left, worth);
  // The sums a reader cannot do at a glance, never the gap restated: which return does it, how many, or none can.
  if (short <= 0) return [`the men ${name} have left need only to play to overtake it`];
  const lines: string[] = [];
  const returns = returnsOf(chasing.left, worth);
  const total = returns.reduce((sum, r) => sum + r.worth, 0);
  if (total < short) return [...lines, `the lead is out of reach: every return the men ${name} have left could make would come to ${pts(total)}, and they need ${pts(short + 1)}`];
  if (total === short) return [...lines, `the most ${name} can do is draw: it would take every return their men left could make`];
  const winners = returns.filter((r) => r.worth > short);
  const levellers = returns.filter((r) => r.worth === short);
  if (winners.length > 0) lines.push(`${either(winners.map(said))} would win it on its own`);
  if (levellers.length > 0) lines.push(`${either(levellers.map(said))} would level it`);
  if (winners.length === 0) {
    // The fewest returns that would win it, taking the richest first.
    let sum = 0;
    const needed = returns.findIndex((r) => (sum += r.worth) > short) + 1;
    lines.push(needed > DRAFT_DESK.reach ? `the lead looks beyond ${name}: they need at least ${needed} returns between them` : `${name} need at least ${needed} returns between them`);
  }
  return lines;
}
