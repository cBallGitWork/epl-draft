import type { SideState } from "./state";
import type { DraftMan, SlotWorth, Worth } from "./types";

// What the side behind needs from the men it has left, once both sides' minutes are paid: the man whose goal, assist or
// clean sheet would level or win it, how many returns it takes when no one does, and when they cannot catch up (Craig,
// 29 Sep 2026: "work out how many points are needed, or when a lead has got too far").

export interface Return extends Worth {
  man: DraftMan;
}

const either = (list: readonly string[]) => (list.length <= 1 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} or ${list.at(-1)}`);
const ARTICLE: Record<Worth["kind"], string> = { goal: "a goal", assist: "an assist", "clean sheet": "a clean sheet" };

/** "a goal or an assist from Haaland, or a clean sheet from Pickford": each man once, no figures. */
function said(returns: readonly Return[]): string {
  const men = [...new Set(returns.map((r) => r.man))];
  return either(men.map((man) => `${either([...new Set(returns.filter((r) => r.man === man).map((r) => ARTICLE[r.kind]))])} from ${man.name}`));
}

/** Every return the men left could make, one of each per match left, richest first. */
export function returnsOf(men: readonly DraftMan[], worth: SlotWorth): Return[] {
  return men
    .flatMap((man) => Array.from({ length: man.left }, () => (worth.returns[man.slot] ?? []).map((w) => ({ ...w, man }))).flat())
    .filter((r) => r.worth > 0)
    .sort((a, b) => b.worth - a.worth);
}

/** Points a side's men left will be paid whatever they do, a full match each. */
const playing = (men: readonly DraftMan[], worth: SlotWorth) => men.reduce((sum, m) => sum + m.left * worth.appearance, 0);

/** The side behind's sums, as facts; `gap` is how far behind they are, above nought. Nothing when minutes alone close it. */
export function chaseLines(chasing: SideState, ahead: SideState, gap: number, worth: SlotWorth): string[] {
  const name = chasing.side.name;
  const short = gap - playing(chasing.left, worth) + playing(ahead.left, worth);
  if (short <= 0) return [];
  const returns = returnsOf(chasing.left, worth);
  const most = returns.reduce((sum, r) => sum + r.worth, 0) + chasing.left.reduce((sum, m) => sum + m.left * (worth.extra[m.slot] ?? 0), 0);
  if (most < short) return [`${name} cannot catch ${ahead.side.name}`];
  if (most === short) return [`${name} can draw at best`];
  const winners = returns.filter((r) => r.worth > short);
  const levellers = returns.filter((r) => r.worth === short);
  const lines: string[] = [];
  if (winners.length > 0) lines.push(`${said(winners)} would win it`);
  if (levellers.length > 0) lines.push(`${said(levellers)} would level it`);
  if (winners.length === 0) {
    // The fewest returns that would win it, the richest first.
    let sum = 0;
    const needed = returns.findIndex((r) => (sum += r.worth) > short) + 1;
    lines.push(needed > 0 ? `${name} need ${needed} returns to win it` : `${name} need every return their men left could make`);
  }
  return lines;
}
