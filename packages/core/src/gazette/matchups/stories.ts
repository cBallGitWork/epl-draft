import { DRAFT_DESK } from "../../config";
import { ordinal } from "../../league/ordinal";
import { blank, type AutoSub } from "./autoSubs";
import type { Cutoff } from "./brief";
import type { DraftMan, DraftSide, GoalTime, SlotWorth } from "./types";
import { listed } from "../../format";
import { priceOf } from "./worth";

// One side's stories in the game's own words (Craig, 29 Sep 2026): a return is a goal, an assist or a clean sheet, a
// blank is none, a haul is more than one. One line a man, every fact about him in it; then the substitutions, a bench
// score of six or more, men from one club who shared a fate, and a club's men with two matches.

const pts = (n: number) => `${n} point${n === 1 ? "" : "s"}`;
/** His returns: goals, assists and clean sheets. */
export const returnCount = (m: DraftMan) => m.goals + m.assists + m.cleanSheets;
const done = (m: DraftMan) => m.left === 0 && m.minutes > 0;
const late = (t: GoalTime) => t.minute >= DRAFT_DESK.lateGoal;
const named = (m: DraftMan) => `${m.name} (${m.club})`;

/** Goals in the order they went in: by their match's kickoff, then the clock. */
export const byClock = (a: GoalTime, b: GoalTime) => a.kickoff.localeCompare(b.kickoff) || a.minute - b.minute || (a.added ?? 0) - (b.added ?? 0);

/** "in added time (90+4)", "in the 88th minute". */
export const whenScored = (t: GoalTime) => (t.added !== undefined ? `in added time (${t.minute}+${t.added})` : `in the ${ordinal(t.minute)} minute`);

/** "a goal in the 89th minute and an assist": a late goal carries its time. */
function what(m: DraftMan): string {
  const lateGoal = m.goals === 1 ? m.scoredAt.find(late) : undefined;
  const goals = m.goals === 0 ? null : m.goals === 1 ? `a goal${lateGoal === undefined ? "" : ` ${whenScored(lateGoal)}`}` : `${m.goals} goals`;
  const assists = m.assists === 0 ? null : m.assists === 1 ? "an assist" : `${m.assists} assists`;
  return listed([goals, assists, m.cleanSheets > 0 ? "a clean sheet" : null].filter((x): x is string => x !== null), "and");
}

/** "got 6: a clean sheet", "hauled 11: a goal, an assist and a clean sheet"; null for a blank. */
function gotLine(m: DraftMan): string | null {
  const returns = returnCount(m);
  return returns === 0 ? null : `${returns > 1 ? "hauled" : "got"} ${m.points ?? 0}: ${what(m)}`;
}

/** One man's line, or null when there is nothing to say about him. */
function manLine(m: DraftMan, side: DraftSide, worth: SlotWorth): string | null {
  const parts: string[] = [];
  // A keeper's big score is a haul whatever it is made of.
  const keeper = worth.keeper !== null && m.slot === worth.keeper;
  const got = keeper && (m.points ?? 0) >= DRAFT_DESK.keeperHaul ? `hauled ${m.points} in goal${m.cleanSheets > 0 ? ", a clean sheet among it" : ""}` : gotLine(m);
  const returns = returnCount(m);
  if (got !== null) parts.push(got);
  const clean = priceOf(worth, m.slot, "clean sheet");
  const lost = m.concededFirstAt[0];
  // A clean sheet is a full hour's; a man on for less never had one to lose.
  if (lost !== undefined && late(lost) && m.cleanSheets === 0 && m.minutes >= DRAFT_DESK.earlyOff && clean >= DRAFT_DESK.cleanSheetStory) parts.push(`lost a clean sheet worth ${pts(clean)} to a goal ${whenScored(lost)}`);
  // A man off the bench got the lesser appearance point: that is the story, not the minutes (Craig, 30 Sep 2026).
  if (m.started === false && m.minutes > 0) parts.push(`did not start and played ${m.minutes} minutes off the bench${returns === 0 ? `, ${pts(m.points ?? 0)} for the appearance` : ""}`);
  else if (m.minutes > 0 && m.minutes < DRAFT_DESK.earlyOff && m.left === 0) parts.push(m.started === true ? `went off after ${m.minutes} minutes` : `played ${m.minutes} minutes`);
  if (m.debut) parts.push(`was in ${side.name}'s eleven for the first time`);
  if (m.fitness !== null) parts.push(m.fitness);
  return parts.length === 0 ? null : `${named(m)} ${parts.join("; ")}`;
}

/** The substitution and what the man coming on did, in one line. */
function subLine(s: AutoSub, cutoff: Cutoff): string {
  // "Replaced", not "came on": the paper's banned list keeps "came on" for the Premier League's own substitutions.
  const on = `${named(s.in)} ${cutoff === "gameweek" ? "replaced" : "replaces"} ${named(s.out)}, who did not play`;
  if (s.provisional) return `${on}, if he plays`;
  const got = gotLine(s.in);
  if (cutoff === "gameweek") return `${on}, and ${got ?? `brought ${pts(s.in.points ?? 0)}`}`;
  return `${on}, with ${got === null ? pts(s.in.points ?? 0) : `${s.in.points ?? 0}: ${what(s.in)}`}`;
}

/** `margin` is this side's points less the other's: a bench score of benchScore or more is news, and more so when it is
 *  bigger than the deficit of the side behind. */
export function sideStories(side: DraftSide, subs: readonly AutoSub[], worth: SlotWorth, cutoff: Cutoff, margin: number): string[] {
  const lines = side.eleven.flatMap((m) => manLine(m, side, worth) ?? []);
  lines.push(...subs.map((s) => subLine(s, cutoff)));
  for (const m of side.eleven.filter((x) => blank(x) && !subs.some((s) => s.out === x))) {
    lines.push(`${named(m)} did not play and ${cutoff === "gameweek" ? "no reserve replaced him" : `${side.name} have no reserve to replace him`}`);
  }
  for (const m of side.bench.filter((x) => !subs.some((s) => s.in === x) && (x.points ?? 0) >= DRAFT_DESK.benchScore)) {
    lines.push(`${named(m)} got ${pts(m.points ?? 0)} on the bench${margin < 0 && (m.points ?? 0) > -margin ? ", more than the margin" : ""}`);
  }
  const byClub = new Map<string, DraftMan[]>();
  for (const m of side.eleven.filter(done)) byClub.set(m.club, [...(byClub.get(m.club) ?? []), m]);
  for (const [club, men] of byClub) {
    if (men.length < 2) continue;
    const every = men.length === 2 ? "both" : "all";
    const who = `${men.length === 2 ? "two" : men.length} ${club} men, ${listed(men.map((m) => m.name), "and")},`;
    if (men.every((m) => returnCount(m) === 0)) lines.push(`${who} ${every} blanked`);
    else if (men.every((m) => m.cleanSheets > 0)) lines.push(`${who} ${every} kept clean sheets`);
    else if (men.every((m) => returnCount(m) > 0)) lines.push(`${who} ${every} returned`);
  }
  if (cutoff === "saturday") {
    const doubles = new Map<string, DraftMan[]>();
    for (const m of side.eleven.filter((x) => x.played + x.left > 1)) doubles.set(m.club, [...(doubles.get(m.club) ?? []), m]);
    for (const men of doubles.values()) lines.push(`${side.name} have ${listed(men.map((m) => m.name), "and")} with two matches this gameweek`);
  }
  return lines.map((line) => `${side.name}: ${line}`);
}
