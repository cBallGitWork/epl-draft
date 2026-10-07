import type { SideState } from "./state";
import type { DraftMan, SlotWorth, Worth } from "./types";
import { listed } from "../../format";

// What the side behind needs from the men it has left, once both sides' minutes are paid: the man whose goal, assist or
// clean sheet would level or win it, how many returns it takes when no one does, and when they cannot catch up.

export interface Return extends Worth {
  man: DraftMan;
}

const ARTICLE: Record<Worth["kind"], string> = { goal: "a goal", assist: "an assist", "clean sheet": "a clean sheet" };

/** "a goal or an assist from Haaland, or a clean sheet from Pickford": each man once, no figures. */
function said(returns: readonly Return[]): string {
  const men = [...new Set(returns.map((r) => r.man))];
  return listed(men.map((man) => `${listed([...new Set(returns.filter((r) => r.man === man).map((r) => ARTICLE[r.kind]))], "or")} from ${man.name}`), "or");
}

/** Every return the men left could make, one of each per match left, richest first. */
export function possibleReturns(men: readonly DraftMan[], worth: SlotWorth): Return[] {
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
  const short = gap - playing(chasing.toPlay, worth) + playing(ahead.toPlay, worth);
  if (short <= 0) return [];
  const returns = possibleReturns(chasing.toPlay, worth);
  const most = returns.reduce((sum, r) => sum + r.worth, 0) + chasing.toPlay.reduce((sum, m) => sum + m.left * (worth.bonus[m.slot] ?? 0), 0);
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
