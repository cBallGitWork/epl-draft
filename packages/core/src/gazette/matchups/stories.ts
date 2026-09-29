import { DRAFT_DESK } from "../../config";
import type { DraftMan, DraftSide, GoalTime } from "./types";

// The stories in one side's eleven, in the game's own words (Craig, 29 Sep 2026): a return is a goal, an assist or a
// clean sheet; a blank is none; a haul is more than one. Late goals and a clean sheet lost late are the timing stories;
// men from one club who shared a fate are the other.

const returnsOf = (m: DraftMan) => m.goals + m.assists + m.cleanSheets;
const done = (m: DraftMan) => m.left === 0 && m.minutes > 0;
/** Late in the match: first-half added time is not. */
const late = (t: GoalTime) => t.minute >= DRAFT_DESK.lateGoal;
/** "in added time (90+4)", "in the 88th minute". */
export const whenScored = (t: GoalTime) => (t.added !== undefined ? `in added time (${t.minute}+${t.added})` : `in the ${ordinal(t.minute)} minute`);

function ordinal(n: number): string {
  const tens = n % 100;
  return `${n}${tens >= 11 && tens <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
}

function haul(m: DraftMan): string {
  const parts = [[m.goals, "goal"], [m.assists, "assist"], [m.cleanSheets, "clean sheet"]].filter(([n]) => (n as number) > 0).map(([n, what]) => `${n === 1 ? (what === "assist" ? "an" : "a") : n} ${what}${n === 1 ? "" : "s"}`);
  return `${parts.slice(0, -1).join(", ")}${parts.length > 1 ? " and " : ""}${parts.at(-1)}`;
}

export function sideStories(side: DraftSide): string[] {
  const lines: string[] = [];
  for (const m of side.eleven) {
    if (returnsOf(m) > 1) lines.push(`${m.name} (${m.club}) hauled: ${haul(m)}, ${m.points ?? 0} points`);
    for (const t of m.scoredAt.filter(late)) lines.push(`${m.name} (${m.club}) scored ${whenScored(t)}`);
    // A clean sheet is a full hour's; a man on for less never had one to lose.
    const lost = m.concededFirstAt[0];
    if (lost !== undefined && late(lost) && m.cleanSheets === 0 && m.minutes >= DRAFT_DESK.earlyOff) lines.push(`${m.name} (${m.club}, ${m.slot}) lost his clean sheet to a goal ${whenScored(lost)}`);
  }
  // Two or more of the eleven from one club, their matches done: the same fate, or a split.
  const byClub = new Map<string, DraftMan[]>();
  for (const m of side.eleven.filter(done)) byClub.set(m.club, [...(byClub.get(m.club) ?? []), m]);
  for (const [club, men] of byClub) {
    if (men.length < 2) continue;
    const names = men.map((m) => m.name).join(" and ");
    const every = men.length === 2 ? "both" : "all";
    const kept = men.filter((m) => m.cleanSheets > 0).length;
    const returned = men.filter((m) => returnsOf(m) > 0);
    if (returned.length === 0) lines.push(`${men.length} ${club} men, ${names}, ${every} blanked`);
    else if (kept === men.length) lines.push(`${men.length} ${club} men, ${names}, ${every} kept clean sheets`);
    else if (returned.length === men.length) lines.push(`${men.length} ${club} men, ${names}, ${every} returned`);
    else lines.push(`of the ${club} men, ${returned.map((m) => m.name).join(" and ")} returned and ${men.filter((m) => !returned.includes(m)).map((m) => m.name).join(" and ")} blanked`);
  }
  return lines;
}
