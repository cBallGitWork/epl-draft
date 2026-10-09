import type { PlMoment } from "../../../football/premierleague/moments";
import type { PlShot } from "../../../football/premierleague/momentWords";
import type { Club } from "../../../football/types";
import { deskDay, type MatchDesk } from "../desk";
import type { ReportMan, ReportMatchInput, SideFigures } from "../types";

// A made-up Arsenal v Chelsea for one moment at a time: men, moments and figures built by hand.

export const shot = (over: Partial<PlShot> = {}): PlShot => ({ foot: "right foot", from: "from inside the box", to: "low into the corner", supply: null, situation: null, ...over });

const SHOT_KINDS: ReadonlySet<PlMoment["kind"]> = new Set(["goal", "penalty-goal", "saved", "missed", "woodwork"]);

export function moment(minute: string, kind: PlMoment["kind"], men: [number | null, number | null], over: Partial<PlMoment> = {}): PlMoment {
  const at = Number(/^(\d+)/u.exec(minute)?.[1] ?? 0);
  return { id: 0, minute, half: at <= 45 ? 1 : 2, kind, men, shot: SHOT_KINDS.has(kind) ? shot() : null, injury: false, addedMinutes: null, varCall: null, ...over };
}

export const reportMan = (code: number, name: string, side: "home" | "away", over: Partial<ReportMan> = {}): ReportMan => ({
  code, name, side, started: true, onAt: null, offAt: null, injuredOff: false, sentOff: false, line: "M", minutes: 90, saves: 0, expectedGoals: 0, expectedAssists: 0,
  startsBefore: 3, matchesBefore: 4, goalsSeason: null, holder: null, points: null, fitness: null, ...over,
});

export const figures = (over: Partial<SideFigures> = {}): SideFigures => ({
  shots: 10, onTarget: 2, corners: 3, clearChances: 0, clearChancesScored: 0, possession: 50, errorsToGoal: 0, ...over,
});

export const ARSENAL: Club = { id: 1, code: 11, name: "Arsenal", shortName: "ARS" };
export const CHELSEA: Club = { id: 2, code: 22, name: "Chelsea", shortName: "CHE" };

export function matchInput(men: ReportMan[], moments: PlMoment[], score: [number, number], sides: ReportMatchInput["figures"] = null): ReportMatchInput {
  return {
    fixture: { id: 1, code: 9001, gameweek: 7, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-03T14:00:00Z", homeScore: score[0], awayScore: score[1], status: "finished", settled: true, minutes: 90, homeDifficulty: null, awayDifficulty: null },
    home: { code: 11, name: "Arsenal", shorts: [], manager: null },
    away: { code: 22, name: "Chelsea", shorts: [], manager: null },
    halfTime: null, referee: null, moments, men, figures: sides, videoId: null, venue: null, attendance: null, lineups: null, marks: new Map(),
  };
}

export const deskOf = (match: ReportMatchInput): MatchDesk =>
  deskDay({ day: "2026-10-03", gameweek: 7, matches: [match], season: [match.fixture], clubs: [ARSENAL, CHELSEA] })[0];

export const SAKA = reportMan(1, "Bukayo Saka", "home");
export const HAVERTZ = reportMan(2, "Kai Havertz", "home");
export const PALMER = reportMan(3, "Cole Palmer", "away");
export const ENZO = reportMan(4, "Enzo Fernandez", "away");
