import { weekdayLongOfDay } from "../../time";
import { SIDES, otherSide, type Side } from "../side";
import type { MatchupState, SideState } from "./state";
import type { DraftMan } from "./types";

// A match-up's gameweek as it happened, the spine of its story: a beat for each London day either side scored on, then
// the substitutions when they changed the score, each with its points, the running score at its end and the men who
// returned in it. Pure.

interface BeatReturn {
  side: Side;
  man: DraftMan;
  points: number;
  goals: number;
  assists: number;
  cleanSheets: number;
}

export interface Beat {
  /** The London day; null for the substitutions. */
  day: string | null;
  points: Record<Side, number>;
  /** The running score at the beat's end. */
  score: Record<Side, number>;
  returns: BeatReturn[];
}

const dayPoints = (s: SideState, day: string) => s.side.byDay.filter((d) => d.day === day).reduce((sum, d) => sum + d.points, 0);

/** The men who returned on a day, from the eleven as picked: a reserve's points count only once he comes on. */
function dayReturns(state: MatchupState, day: string): BeatReturn[] {
  return SIDES.flatMap((side) =>
    state[side].side.eleven.flatMap((man) => {
      const d = man.byDay.find((x) => x.day === day);
      return d === undefined || d.goals + d.assists + d.cleanSheets === 0 ? [] : [{ side, man, points: d.points, goals: d.goals, assists: d.assists, cleanSheets: d.cleanSheets }];
    }),
  );
}

export function timeline(state: MatchupState): Beat[] {
  const days = [...new Set(SIDES.flatMap((w) => state[w].side.byDay.map((d) => d.day)))].sort();
  const score = { home: 0, away: 0 };
  const beats: Beat[] = [];
  for (const day of days) {
    const points = { home: dayPoints(state.home, day), away: dayPoints(state.away, day) };
    score.home += points.home;
    score.away += points.away;
    const returns = dayReturns(state, day);
    if (points.home !== 0 || points.away !== 0 || returns.length > 0) beats.push({ day, points, score: { ...score }, returns });
  }
  const subs = { home: state.home.total - (state.home.side.total ?? 0), away: state.away.total - (state.away.side.total ?? 0) };
  if (subs.home === 0 && subs.away === 0) return beats;
  const on = SIDES.flatMap((side) =>
    state[side].subs
      .filter((s) => !s.provisional && s.in.goals + s.in.assists + s.in.cleanSheets > 0)
      .map((s) => ({ side, man: s.in, points: s.in.points ?? 0, goals: s.in.goals, assists: s.in.assists, cleanSheets: s.in.cleanSheets })),
  );
  return [...beats, { day: null, points: subs, score: { home: state.home.total, away: state.away.total }, returns: on }];
}

/** The index of the first beat of `side`'s last unbroken lead; the beats' length when it did not finish ahead. */
export function ledForGood(beats: readonly Beat[], side: Side): number {
  const them = otherSide(side);
  let from = beats.length;
  while (from > 0 && beats[from - 1].score[side] > beats[from - 1].score[them]) from--;
  return from;
}

/** "Saturday", or "the automatic substitutions": the league's, never a Premier League substitute. */
export const beatLabel = (day: string | null) => (day === null ? "the automatic substitutions" : weekdayLongOfDay(day));

/** The beat a man belongs in: the substitutions for a reserve certain to come on, otherwise his best day by points;
 *  undefined when he has none, a man who did not play. */
export function beatOf(state: MatchupState, man: DraftMan): string | null | undefined {
  if (SIDES.some((w) => state[w].subs.some((s) => s.in === man && !s.provisional))) return null;
  return [...man.byDay].sort((a, b) => b.points - a.points)[0]?.day;
}
