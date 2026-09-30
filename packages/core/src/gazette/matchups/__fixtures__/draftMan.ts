import type { DraftMan, GoalTime } from "../types";

/** A goal's time in a match kicking off on the gameweek's Saturday unless another kickoff is given. */
export const goalAt = (minute: number, added?: number, kickoff = "2026-09-26T14:00:00Z"): GoalTime => (added === undefined ? { minute, kickoff } : { minute, added, kickoff });

/** A man with a name, a slot and his minutes, his match done unless `left` says otherwise; everything else plain. */
export function draftMan(name: string, slot: string, points: number | null, minutes: number, left = 0, over: Partial<DraftMan> = {}): DraftMan {
  return {
    fantraxId: name, code: 0, clubCode: 0, clubId: 0, name, club: "Club", slot, points, minutes, played: left === 0 ? 1 : 0, left, debut: false,
    projected: null, next: null, started: null, matches: [], fitness: null, goals: 0, assists: 0, cleanSheets: 0, scoredAt: [], concededFirstAt: [], ...over,
  };
}
