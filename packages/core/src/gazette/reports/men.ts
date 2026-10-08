import type { PlMoment } from "../../football/premierleague/moments";
import type { PlSquadMan, PlTeamSheet } from "../../football/premierleague/teamSheet";
import type { ReportMan, Side } from "./types";
import { isDismissal } from "./timeline";

// Every man in the match sheet as the desk reads him: started or came on, when he left and why, and what the script joined.

/** FPL's per-man figures for this match, by code. */
export interface LiveLine {
  minutes: number;
  saves: number;
  expectedGoals: number;
  expectedAssists: number;
}

/** His season before this match (goals including it), by code, as of the match day. */
export interface SeasonLine {
  startsBefore: number;
  matchesBefore: number;
  yellowsBefore: number;
  goalsSeason: number;
}

export interface MenExtras {
  live: ReadonlyMap<number, LiveLine>;
  /** Null when a past gameweek could not be read: no man's season is then told. */
  season: ReadonlyMap<number, SeasonLine> | null;
  holders: ReadonlyMap<number, NonNullable<ReportMan["holder"]>>;
  points: ReadonlyMap<number, number>;
  fitness: ReadonlyMap<number, string>;
}

const NO_SEASON: SeasonLine = { startsBefore: 0, matchesBefore: 0, yellowsBefore: 0, goalsSeason: 0 };
const UNREAD: Pick<ReportMan, keyof SeasonLine> = { startsBefore: null, matchesBefore: 0, yellowsBefore: null, goalsSeason: null };

/** Both sheets, starters then substitutes; a man the bridge could not place has no code and is left out. */
export function reportMen(
  sheets: { home: PlTeamSheet; away: PlTeamSheet },
  moments: readonly PlMoment[],
  extras: MenExtras,
): ReportMan[] {
  const on = new Map<number, string>();
  const off = new Map<number, { at: string; injured: boolean }>();
  for (const moment of moments) {
    const [first, second] = moment.men;
    if (moment.kind === "substitution") {
      if (first !== null) on.set(first, moment.minute);
      if (second !== null) off.set(second, { at: moment.minute, injured: moment.injury });
    }
    if (moment.kind === "injured-off" && first !== null) off.set(first, { at: moment.minute, injured: true });
    if (isDismissal(moment.kind) && first !== null) off.set(first, { at: moment.minute, injured: false });
  }

  const man = (squad: PlSquadMan, side: Side, started: boolean): ReportMan[] => {
    const code = squad.code;
    if (code === null) return [];
    const live = extras.live.get(code);
    const season = extras.season === null ? UNREAD : (extras.season.get(code) ?? NO_SEASON);
    const left = off.get(code);
    return [
      {
        code,
        name: squad.name,
        side,
        started,
        onAt: started ? null : (on.get(code) ?? null),
        offAt: left?.at ?? null,
        injuredOff: left?.injured ?? false,
        line: squad.position,
        minutes: live?.minutes ?? 0,
        saves: live?.saves ?? 0,
        expectedGoals: live?.expectedGoals ?? 0,
        expectedAssists: live?.expectedAssists ?? 0,
        ...season,
        holder: extras.holders.get(code) ?? null,
        points: extras.points.get(code) ?? null,
        fitness: extras.fitness.get(code) ?? null,
      },
    ];
  };
  const sideOf = (sheet: PlTeamSheet, side: Side) => [
    ...sheet.lineup.flatMap((squad) => man(squad, side, true)),
    ...sheet.substitutes.flatMap((squad) => man(squad, side, false)),
  ];
  return [...sideOf(sheets.home, "home"), ...sideOf(sheets.away, "away")];
}

/** Whether he played at all: started, or came on. */
export const played = (man: ReportMan) => man.started || man.onAt !== null;
