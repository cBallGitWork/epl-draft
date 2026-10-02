import { PROJECTION_PARTS, type ProjectedGameweek, type ProjectedPlayer } from "../football/intel/projections";
import { FPL_ASSIST, FPL_CLEAN_SHEET, FPL_FULL_APPEARANCE, FPL_GOAL, fplConceded } from "../fpl-entry/prices";
import { isFplKeeper } from "../fpl-entry/types";
import {
  ASSIST,
  CLEAN_SHEETS,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_WORK,
  MINUTES,
  firstScored,
  type FantraxCategory,
} from "../league/categoryNames";
import { defConScored } from "../league/defcon";
import { categoryPoints, pointsFor, type LeagueScoring, type ScoringRules } from "../league/scoring";

// The sister model's FPL-point projection repriced at one of our slots: FPL's parts turned back into counts at FPL's
// prices, then priced by the league's rules. Bonus goes; DefCon and a keeper's work come from his own matches in ours.

export const LEAGUE_PROJECTION_PARTS = ["goals", "assists", "cleanSheets", "appearance", "conceded", "defcon", "keeper"] as const;
export type LeagueProjectionPart = (typeof LEAGUE_PROJECTION_PARTS)[number];

export interface LeagueWeek {
  gw: number;
  points: number;
  /** `conceded` is every deduction: goals conceded, cards, own goals and missed penalties. */
  parts: Record<LeagueProjectionPart, number>;
}

/** The league's short codes for what each part is paid under, found by meaning; null or empty where it scores none. */
export interface ProjectionCodes {
  goals: string | null;
  assists: string | null;
  cleanSheets: string | null;
  minutes: string | null;
  conceded: string[];
  defcon: string[];
  keeper: string | null;
}

export function projectionCodes(scoring: LeagueScoring): ProjectionCodes {
  const short = (options: readonly FantraxCategory[]) => firstScored(scoring.categories, options)?.short ?? null;
  const all = (options: readonly FantraxCategory[]) => options.flatMap((option) => short([option]) ?? []);
  return {
    goals: short([GOALS]),
    assists: short(ASSIST),
    cleanSheets: short([CLEAN_SHEETS]),
    minutes: short([MINUTES]),
    conceded: all([GOALS_AGAINST, GOALS_AGAINST_OUTFIELD]),
    defcon: defConScored(scoring.categories).map((category) => category.short),
    keeper: short(KEEPER_WORK),
  };
}

/** What his own matches earn per 90 minutes at a slot in the parts FPL prices differently: DefCon and a keeper's work. */
export interface SlotRates {
  defcon: number;
  keeper: number;
}

/** One gameweek repriced at `slot`, his FPL `line` saying how FPL priced it. `cleanSheet` is his club's chance of one in
 *  a match, for a line FPL pays none and for goals conceded; null leaves both as FPL had them. Null with no reading. */
export function leagueWeek(
  week: ProjectedGameweek,
  line: number,
  slot: string,
  rules: ScoringRules,
  codes: ProjectionCodes,
  rates: SlotRates,
  cleanSheet: number | null,
): LeagueWeek | null {
  if (week.points === null || week.parts === null) return null;
  const fpl = (part: (typeof PROJECTION_PARTS)[number]) => week.parts?.[part] ?? 0;
  const flat = (code: string | null) => (code === null ? 0 : (categoryPoints(rules, code, slot) ?? 0));
  const ninety = (week.minutes ?? 0) / 90;
  const sheets = FPL_CLEAN_SHEET[line]
    ? fpl("cleanSheets") / FPL_CLEAN_SHEET[line]
    : (cleanSheet ?? 0) * (week.start ?? 0) * week.fixtures;
  const negatives = week.points - PROJECTION_PARTS.reduce((sum, part) => sum + fpl(part), 0);
  const ours = (conceded: number) => codes.conceded.reduce((sum, code) => sum + (pointsFor(rules, code, slot, conceded) ?? 0), 0);
  const shift = cleanSheet === null ? 0 : expectedOver(cleanSheet, ours) - expectedOver(cleanSheet, (n) => fplConceded(line, n));
  const parts = {
    goals: FPL_GOAL[line] ? (fpl("goals") / FPL_GOAL[line]) * flat(codes.goals) : 0,
    assists: (fpl("assists") / FPL_ASSIST) * flat(codes.assists),
    cleanSheets: sheets * flat(codes.cleanSheets),
    appearance: codes.minutes === null ? 0 : (fpl("appearance") * (pointsFor(rules, codes.minutes, slot, 90) ?? 0)) / FPL_FULL_APPEARANCE,
    conceded: negatives + shift * ninety,
    defcon: rates.defcon * ninety,
    keeper: rates.keeper * ninety,
  };
  return { gw: week.gw, points: LEAGUE_PROJECTION_PARTS.reduce((sum, part) => sum + parts[part], 0), parts };
}

/** The most goals a match is costed out to; past it the chance is negligible. */
const MOST_CONCEDED = 12;

/** A match's expected price of its goals conceded, Poisson on the clean-sheet chance. */
function expectedOver(cleanSheet: number, price: (conceded: number) => number): number {
  const rate = -Math.log(Math.min(Math.max(cleanSheet, 0.01), 0.99));
  let chance = Math.exp(-rate);
  let sum = 0;
  for (let n = 0; n <= MOST_CONCEDED; n++) {
    sum += chance * price(n);
    chance *= rate / (n + 1);
  }
  return sum;
}

/** Each club's chance of a clean sheet in a match, by gameweek, off its likeliest starting keeper's projection. */
export function clubCleanSheets(
  players: Iterable<ProjectedPlayer>,
  lineOf: (code: number) => number | null,
): Map<string, Map<number, number>> {
  const best = new Map<string, Map<number, { start: number; chance: number }>>();
  for (const player of players) {
    const line = lineOf(player.code);
    if (line === null || !isFplKeeper(line)) continue;
    const club = best.get(player.club) ?? new Map<number, { start: number; chance: number }>();
    best.set(player.club, club);
    for (const week of player.gameweeks) {
      const start = week.start ?? 0;
      const sheets = week.parts?.cleanSheets;
      if (start <= 0 || week.fixtures <= 0 || sheets == null || (club.get(week.gw)?.start ?? 0) >= start) continue;
      club.set(week.gw, { start, chance: Math.min(1, sheets / (FPL_CLEAN_SHEET[line] * start * week.fixtures)) });
    }
  }
  return new Map([...best].map(([club, weeks]) => [club, new Map([...weeks].map(([gw, { chance }]) => [gw, chance]))]));
}

/** One of his matches in our league: its minutes and the league's counts for it. */
export interface LeagueMatch {
  minutes: number;
  counts: Readonly<Record<string, number | null>>;
}

/** Points and minutes, summed. */
export interface Observed {
  points: number;
  minutes: number;
}

/** What some categories paid him at `slot`, each match priced on its own as the league pays; a match short a count is skipped. */
export function observedAt(rules: ScoringRules, codes: readonly string[], slot: string, matches: readonly LeagueMatch[]): Observed {
  let points = 0;
  let minutes = 0;
  for (const match of matches) {
    if (match.minutes <= 0 || codes.some((code) => match.counts[code] == null)) continue;
    points += codes.reduce((sum, code) => sum + (pointsFor(rules, code, slot, match.counts[code] ?? 0) ?? 0), 0);
    minutes += match.minutes;
  }
  return { points, minutes };
}

/** A cohort's points per 90; nought when nobody in it played. */
export function cohortRate(cohort: readonly Observed[]): number {
  const minutes = cohort.reduce((sum, one) => sum + one.minutes, 0);
  return minutes === 0 ? 0 : (90 * cohort.reduce((sum, one) => sum + one.points, 0)) / minutes;
}

/** His points per 90, drawn toward `prior` as if he had also played `weight` minutes at it. */
export function shrunkRate(own: Observed, prior: number, weight: number): number {
  return own.minutes + weight === 0 ? prior : (90 * own.points + prior * weight) / (own.minutes + weight);
}
