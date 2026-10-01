import { londonWeekday } from "../../time";
import { blank } from "./autoSubs";
import { counted, type SideState } from "./state";
import { byClock } from "./stories";
import type { DraftMan, GoalTime, NextMatch } from "./types";

// Each side as the page sets it out: its returns under its name, as BBC Sport sets a match's scorers (Craig, 30 Sep 2026:
// "goals/assists at the top... and clean sheets too"), and its eleven with each man's points, or his match to come.

export interface StoryDraftReturn {
  name: string;
  count: number;
  /** Each goal's minute in the order scored, "81" or "90+4", when the feed timed every one; otherwise empty. */
  minutes: string[];
}

export interface StoryDraftReturns {
  goals: StoryDraftReturn[];
  assists: StoryDraftReturn[];
  /** A keeper's or a defender's only: a midfielder's clean sheet is a point, not a story. */
  cleanSheets: StoryDraftReturn[];
}

export interface StoryDraftRow {
  name: string;
  slot: string;
  /** His points to the cut-off; null when he has not played. */
  points: number | null;
  /** His club's next match this gameweek; null when he has none left. */
  next: NextMatch | null;
  /** "sub": a reserve coming on for the man above him, if he plays while he has not; "dnp": his matches are done and he
   *  did not play. */
  mark: "sub" | "dnp" | null;
}

/** "Haaland (12', 81')" when every goal is timed, "Isak 2" when not, and "Raya" for one clean sheet. */
export const returnText = (r: StoryDraftReturn) => (r.minutes.length > 0 ? `${r.name} (${r.minutes.map((m) => `${m}'`).join(", ")})` : r.count > 1 ? `${r.name} ${r.count}` : r.name);

/** A row's second line: "did not play", or his match to come, "Sun v Crystal Palace (h)", with "if he plays" for a
 *  reserve waiting on it; null when there is nothing to add to his points. */
export function rowNote(row: StoryDraftRow): string | null {
  if (row.mark === "dnp") return "did not play";
  if (row.next === null) return null;
  const match = `${londonWeekday(row.next.kickoff)} v ${row.next.opponent} (${row.next.home ? "h" : "a"})`;
  return row.mark === "sub" && row.points === null ? `${match}, if he plays` : match;
}

const minuteOf = (t: GoalTime) => (t.added === undefined ? `${t.minute}` : `${t.minute}+${t.added}`);

/** The side's scorers in the order they first scored, those the feed did not time last; its assists and clean sheets in
 *  the eleven's order. Only the men who count: a reserve's returns once he is certain to come on. */
export function draftReturns(s: SideState): StoryDraftReturns {
  const men = counted(s);
  const tally = (count: (m: DraftMan) => number) => men.filter((m) => count(m) > 0).map((m) => ({ name: m.name, count: count(m), minutes: [] }));
  const timed = (m: DraftMan) => (m.scoredAt.length === m.goals ? [...m.scoredAt].sort(byClock) : []);
  const scorers = men.filter((m) => m.goals > 0).map((m) => ({ name: m.name, count: m.goals, times: timed(m) }));
  scorers.sort((a, b) => (a.times.length === 0 || b.times.length === 0 ? Number(a.times.length === 0) - Number(b.times.length === 0) : byClock(a.times[0], b.times[0])));
  return {
    goals: scorers.map(({ name, count, times }) => ({ name, count, minutes: times.map(minuteOf) })),
    assists: tally((m) => m.assists),
    cleanSheets: tally((m) => m.cleanSheets),
  };
}

const row = (m: DraftMan, mark: StoryDraftRow["mark"]): StoryDraftRow => ({ name: m.name, slot: m.slot, points: m.minutes > 0 ? (m.points ?? 0) : null, next: m.next, mark });

/** The eleven in its order, each reserve coming on listed under the man he replaces. */
export function draftRows(s: SideState): StoryDraftRow[] {
  return s.side.eleven.flatMap((m) => {
    const sub = s.subs.find((x) => x.out === m);
    return [row(m, blank(m) ? "dnp" : null), ...(sub === undefined ? [] : [row(sub.in, "sub")])];
  });
}

/** The reserves who stay on the bench, in its order. */
export const draftBench = (s: SideState): StoryDraftRow[] => s.side.bench.filter((m) => !s.subs.some((x) => x.in === m)).map((m) => row(m, null));

/** "Hall 8", "Isak (Bournemouth, Sun)" still to play, "Foden (did not play)". */
function man(r: StoryDraftRow): string {
  if (r.mark === "dnp") return r.name;
  if (r.points === null) return r.next === null ? r.name : `${r.name} (${r.next.opponent}, ${londonWeekday(r.next.kickoff)})`;
  return `${r.name} ${r.points}`;
}

/** A side's line-up as a match report prints one (Craig, 30 Sep 2026: "put the bench under the line up like a real match
 *  report"): the lines of the eleven split by semicolons, a reserve in brackets after the man he replaces. */
export function lineupText(rows: readonly StoryDraftRow[]): string {
  const lines: { slot: string; men: string[] }[] = [];
  rows.forEach((r, i) => {
    if (r.mark === "sub") return;
    const sub = rows[i + 1]?.mark === "sub" ? rows[i + 1] : undefined;
    const bracket = sub !== undefined ? ` (${sub.points === null ? `${sub.name}, if he plays` : `${sub.name} ${sub.points}`})` : r.mark === "dnp" ? " (did not play)" : "";
    const text = `${man(r)}${bracket}`;
    const last = lines.at(-1);
    if (last !== undefined && last.slot === r.slot) last.men.push(text);
    else lines.push({ slot: r.slot, men: [text] });
  });
  return lines.map((l) => l.men.join(", ")).join("; ");
}

/** The bench as a line: every reserve who stayed there, with his points. */
export const benchText = (rows: readonly StoryDraftRow[]) => rows.map(man).join(", ");
