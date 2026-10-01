import type { ScoringCategory } from "./scoring";

// Fantrax's scoring categories by meaning, under each name its reads give them.
// Which ones a league scores is data: the real league moved from A, AF and Sv to AT and GKP on 1 Oct 2026.

/** One Fantrax category: settings' long code, getPlayerStats' column, and SEASON_STATS' caption. */
export interface FantraxCategory {
  code: string;
  short: string;
  caption: string;
}

export const ASSISTS_TOTAL: FantraxCategory = { code: "INDIVIDUAL_ASSISTS_TOTAL", short: "AT", caption: "Assists (Total)" };
export const ASSISTS_OFFICIAL: FantraxCategory = { code: "INDIVIDUAL_ASSISTS", short: "A", caption: "Assists (Official)" };
export const ASSISTS_FANTASY: FantraxCategory = { code: "INDIVIDUAL_ASSISTS_FANTASY", short: "AF", caption: "Assists (Fantasy)" };
export const SAVES: FantraxCategory = { code: "INDIVIDUAL_SAVES", short: "Sv", caption: "Saves" };
export const KEEPER_POINTS: FantraxCategory = { code: "INDIVIDUAL_KEEPER_POINTS", short: "GKP", caption: "Keeper Points" };
export const GOALS: FantraxCategory = { code: "INDIVIDUAL_GOALS", short: "G", caption: "Goals" };
export const OWN_GOALS: FantraxCategory = { code: "INDIVIDUAL_GOALS_ON_OWN_NET", short: "OG", caption: "Own Goals" };
export const PENALTY_SAVES: FantraxCategory = { code: "INDIVIDUAL_PENALTY_KICK_SAVES", short: "PKS", caption: "Penalty Kick Saves" };
export const PENALTIES_MISSED: FantraxCategory = { code: "INDIVIDUAL_PENALTY_KICKS_MISSED", short: "PKM", caption: "Penalty Kicks Missed" };
export const YELLOW_CARDS: FantraxCategory = { code: "INDIVIDUAL_YELLOW_CARDS", short: "YC", caption: "Yellow Cards" };
export const RED_CARDS: FantraxCategory = { code: "INDIVIDUAL_RED_CARDS", short: "RC", caption: "Red Cards" };
const DEFENSIVE_POINTS: FantraxCategory = { code: "INDIVIDUAL_DEFENSIVE_POINTS", short: "DFP", caption: "Defensive Points" };
const DEFENSIVE_POINTS_3: FantraxCategory = { code: "INDIVIDUAL_DEFENSIVE_POINTS_3", short: "DFP3", caption: "Defensive Points 3" };

/** Where a league pays an assist, best first. AT is A plus AF (455 of 455 outfielders, 1 Oct 2026), so it is never added to them. */
export const ASSIST = [ASSISTS_TOTAL, ASSISTS_OFFICIAL] as const;

/** What pays a keeper for his work. GKP counts saves, smothers, punches and high claims won, so it is not Sv and both are kept. */
export const KEEPER_WORK = [KEEPER_POINTS, SAVES] as const;

/** Our DefCon: tackles won, interceptions and blocks (DFP), or those plus clearances and recoveries (DFP3). A league prices one per slot. */
export const DEFCON = [DEFENSIVE_POINTS, DEFENSIVE_POINTS_3] as const;

/** Whether a league's category is this one: by long code where the league carried it, else by short code. */
function is(scoring: ScoringCategory, category: FantraxCategory): boolean {
  return scoring.longCode ? scoring.longCode === category.code : scoring.code === category.short;
}

/** The first of some categories the league scores; null when it scores none of them. */
export function firstScored(categories: Record<string, ScoringCategory>, options: readonly FantraxCategory[]): FantraxCategory | null {
  return options.find((option) => Object.values(categories).some((scoring) => is(scoring, option))) ?? null;
}

/** The league's ids, `group#category`, for any of some categories. */
export function idsOf(categories: Record<string, ScoringCategory>, wanted: readonly FantraxCategory[]): Set<string> {
  return new Set(Object.entries(categories).filter(([, scoring]) => wanted.some((category) => is(scoring, category))).map(([id]) => id));
}

/** Whether a reading carries a category under any of its names; true when it carried nothing, so an unread league keeps its columns. */
export function carries(carried: ReadonlySet<string>, ...names: (string | undefined)[]): boolean {
  return carried.size === 0 || names.some((name) => name !== undefined && carried.has(name));
}
