import { DRAFT_DESK } from "../../config";
import { ordinal } from "../../league/ordinal";
import type { AutoSub } from "./autoSubs";
import type { Cutoff } from "./brief";
import type { DraftMan, DraftSide, GoalTime, SlotWorth } from "./types";
import { listed } from "../../format";
import { priceOf } from "./worth";

// Each fact about a draft man in the game's own words, for the threads and the brief: a return is a goal, an assist or a
// clean sheet, a blank is none, a haul is more than one. Pure.

/** "1 point", "6 points". */
export const pts = (n: number) => `${n} point${n === 1 ? "" : "s"}`;
/** His returns: goals, assists and clean sheets. */
export const returnCount = (m: DraftMan) => m.goals + m.assists + m.cleanSheets;
const done = (m: DraftMan) => m.left === 0 && m.minutes > 0;
const late = (t: GoalTime) => t.minute >= DRAFT_DESK.lateGoal;

/** Goals in the order they went in: by their match's kickoff, then the clock. */
export const byClock = (a: GoalTime, b: GoalTime) => a.kickoff.localeCompare(b.kickoff) || a.minute - b.minute || (a.added ?? 0) - (b.added ?? 0);

/** "in added time (90+4)", "in the 88th minute". */
export const whenScored = (t: GoalTime) => (t.added !== undefined ? `in added time (${t.minute}+${t.added})` : `in the ${ordinal(t.minute)} minute`);

/** "a goal in the 89th minute and an assist": a late goal carries its time. A man's gameweek, or one day of it. */
export function returnWords(m: Pick<DraftMan, "goals" | "assists" | "cleanSheets" | "scoredAt">): string {
  const lateGoal = m.goals === 1 ? m.scoredAt.find(late) : undefined;
  const goals = m.goals === 0 ? null : m.goals === 1 ? `a goal${lateGoal === undefined ? "" : ` ${whenScored(lateGoal)}`}` : `${m.goals} goals`;
  const assists = m.assists === 0 ? null : m.assists === 1 ? "an assist" : `${m.assists} assists`;
  return listed([goals, assists, m.cleanSheets > 0 ? "a clean sheet" : null].filter((x): x is string => x !== null), "and");
}

/** "got 6: a clean sheet", "hauled 11: a goal, an assist and a clean sheet"; null for a blank. */
function gotLine(m: DraftMan): string | null {
  const returns = returnCount(m);
  return returns === 0 ? null : `${returns > 1 ? "hauled" : "got"} ${m.points ?? 0}: ${returnWords(m)}`;
}

/** A keeper's big score is a haul whatever it is made of. */
export const keeperHauled = (m: DraftMan, worth: SlotWorth) => worth.keeper !== null && m.slot === worth.keeper && (m.points ?? 0) >= DRAFT_DESK.keeperHaul;

/** What he scored, a keeper's haul told as one; null for a blank. */
export const scoredLine = (m: DraftMan, worth: SlotWorth) => (keeperHauled(m, worth) ? `hauled ${m.points} in goal${m.cleanSheets > 0 ? ", a clean sheet among it" : ""}` : gotLine(m));

/** A clean sheet worth telling, lost to a late goal in a match he had an hour of: a man on for less never had one. */
export function lostCleanLine(m: DraftMan, worth: SlotWorth): string | null {
  const clean = priceOf(worth, m.slot, "clean sheet");
  const lost = m.concededFirstAt[0];
  const told = lost !== undefined && late(lost) && m.cleanSheets === 0 && m.minutes >= DRAFT_DESK.earlyOff && clean >= DRAFT_DESK.cleanSheetStory;
  return told ? `lost a clean sheet worth ${pts(clean)} to a goal ${whenScored(lost)}` : null;
}

/** His minutes when they are the story: off the bench for the lesser appearance point, or off before the hour; null
 *  otherwise. */
export function minutesLine(m: DraftMan): string | null {
  if (m.started === false && m.minutes > 0) return `did not start and played ${m.minutes} minutes off the bench${returnCount(m) === 0 ? `, ${pts(m.points ?? 0)} for the appearance` : ""}`;
  if (m.minutes > 0 && m.minutes < DRAFT_DESK.earlyOff && m.left === 0) return m.started === true ? `went off after ${m.minutes} minutes` : `played ${m.minutes} minutes`;
  return null;
}

/** A man new to the side is in its eleven for the first time too: the signing is the story. */
export function newLine(m: DraftMan, side: DraftSide): string | null {
  if (m.arrived !== null) return m.arrived === "trade" ? `joined ${side.name} in a trade this gameweek` : `was signed by ${side.name} this gameweek`;
  return m.debut ? `was in ${side.name}'s eleven for the first time` : null;
}

/** Fantrax's word after his match. */
export const fitnessLine = (m: DraftMan) => (m.fitness === null ? null : `${m.minutes === 0 ? "did not play; " : ""}since: ${m.fitness}`);

/** The automatic substitution as a league member says it ("Millar did not play, so Meunier will come on"), with what
 *  the man coming on did. */
export function subLine(s: AutoSub, cutoff: Cutoff): string {
  if (s.provisional) return `${s.out.name} did not play, so ${s.in.name} comes on if he plays`;
  // Whom he replaces is not settled until the man ahead has played, so it is never named.
  if (s.ahead !== null) return `${s.in.name} comes on at the end of the gameweek for a man who did not play, and his ${pts(s.in.points ?? 0)} count either way`;
  const got = gotLine(s.in);
  if (cutoff === "gameweek") return `${s.out.name} did not play, so ${s.in.name} came on and ${got ?? `got ${pts(s.in.points ?? 0)}`}`;
  return `${s.out.name} did not play, so ${s.in.name} comes on with ${got === null ? pts(s.in.points ?? 0) : `${pts(s.in.points ?? 0)}: ${returnWords(s.in)}`}`;
}

/** A man in the eleven who did not play and no reserve can replace. */
export const uncoveredLine = (m: DraftMan, side: DraftSide, cutoff: Cutoff) => `${m.name} did not play and ${cutoff === "gameweek" ? "no reserve came on for him" : `${side.name} have no reserve to come on for him`}`;

/** The reserves not coming on who scored benchScore or more, told whatever the margin and more so past the deficit of
 *  the side behind; `margin` is this side's points less the other's. */
export function benchLines(side: DraftSide, subs: readonly AutoSub[], margin: number): { man: DraftMan; line: string; pastMargin: boolean }[] {
  return side.bench
    .filter((x) => !subs.some((s) => s.in === x) && (x.points ?? 0) >= DRAFT_DESK.benchScore)
    .map((m) => {
      const pastMargin = margin < 0 && (m.points ?? 0) > -margin;
      return { man: m, pastMargin, line: `${m.name} got ${pts(m.points ?? 0)} on the bench${pastMargin ? ", more than the margin" : ""}` };
    });
}

/** Men from one club in the eleven, their matches done, who all blanked, all kept clean sheets or all returned. */
export function clubLines(side: DraftSide): { men: DraftMan[]; line: string }[] {
  const byClub = new Map<string, DraftMan[]>();
  for (const m of side.eleven.filter(done)) byClub.set(m.club, [...(byClub.get(m.club) ?? []), m]);
  return [...byClub].flatMap(([club, men]) => {
    if (men.length < 2) return [];
    const every = men.length === 2 ? "both" : "all";
    const who = `${men.length === 2 ? "two" : men.length} ${club} men, ${listed(men.map((m) => m.name), "and")},`;
    if (men.every((m) => returnCount(m) === 0)) return [{ men, line: `${who} ${every} blanked` }];
    if (men.every((m) => m.cleanSheets > 0)) return [{ men, line: `${who} ${every} kept clean sheets` }];
    if (men.every((m) => returnCount(m) > 0)) return [{ men, line: `${who} ${every} returned` }];
    return [];
  });
}
