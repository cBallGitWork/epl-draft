import type { DraftMan, GoalTime } from "../types";

/** A goal's time in a match kicking off on the gameweek's Saturday unless another kickoff is given. */
export const goalAt = (minute: number, added?: number, kickoff = "2026-09-26T14:00:00Z"): GoalTime => (added === undefined ? { minute, kickoff } : { minute, added, kickoff });

/** A code of his own for every test man, as FPL gives every player one. */
const codeOf = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 1_000_000, 7);

/** The gameweek's Saturday, the day a test man plays unless his `byDay` says otherwise. */
export const SATURDAY = "2026-09-26";

/** A man with a name, a slot and his minutes, his match done on Saturday unless `left` says otherwise; everything else
 *  plain. */
export function draftMan(name: string, slot: string, points: number | null, minutes: number, left = 0, over: Partial<DraftMan> = {}): DraftMan {
  const man: DraftMan = {
    fantraxId: name, code: codeOf(name), clubCode: 0, clubId: 0, name, fullName: name, club: "Club", slot, points, minutes, played: left === 0 ? 1 : 0, left, debut: false, arrived: null,
    projected: null, next: null, started: null, matches: [], fitness: null, goals: 0, assists: 0, cleanSheets: 0, scoredAt: [], concededFirstAt: [], byDay: [], ...over,
  };
  const { goals, assists, cleanSheets } = man;
  return over.byDay !== undefined || minutes === 0 ? man : { ...man, byDay: [{ day: SATURDAY, points: points ?? 0, minutes, goals, assists, cleanSheets }] };
}
