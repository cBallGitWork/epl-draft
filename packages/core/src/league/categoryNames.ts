import type { ScoringCategory } from "./scoring";

// The scoring categories a commissioner can swap one for another, under each name Fantrax's reads give them.
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

/** Where a league pays an assist, best first. AT is A plus AF (455 of 455 outfielders, 1 Oct 2026), so it is never added to them. */
export const ASSIST = [ASSISTS_TOTAL, ASSISTS_OFFICIAL] as const;

/** What pays a keeper for his work. GKP counts saves, smothers, punches and high claims won, so it is not Sv and both are kept. */
export const KEEPER_WORK = [KEEPER_POINTS, SAVES] as const;

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

/** Minutes played: a count every league scores, and one a board may leave out. */
export const MINUTES: FantraxCategory = { code: "INDIVIDUAL_MINUTES_PLAYED", short: "Min", caption: "Minutes Played" };
