import type { MatchParts } from "../football/premierleague/playerMatch";
import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  DEFCON,
  DEFENSIVE_POINTS,
  DEFENSIVE_POINTS_3,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_POINTS,
  KEEPER_WORK,
  MINUTES,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  YELLOW_CARDS,
  meaningOf,
  type FantraxCategory,
} from "../league/categoryNames";
import { wordsFor } from "../league/categoryWords";
import { priceOf, type LeagueScoring } from "../league/scoring";
import type { Contribution } from "./contribution";
import { isGoalkeeper } from "./lineup";

// A player card's "Full match stats": what he did where this league scores it, by category, then his attacking.

/** One figure on the card: null where nobody measured it. */
interface StatRow {
  key: string;
  label: string;
  value: number | null;
}

interface Stat {
  key: string;
  label: string;
  /** The categories it counts toward; the league must price one of them at his position for it to show. */
  feeds: readonly FantraxCategory[];
  /** FPL's count where FPL's agrees with Fantrax's; Opta's for what FPL does not split. */
  of: (done: Contribution, parts: MatchParts | null) => number | null;
}

const ASSISTS = [ASSISTS_TOTAL, ASSISTS_OFFICIAL, ASSISTS_FANTASY];
const part = (pick: (parts: MatchParts) => number) => (_: Contribution, parts: MatchParts | null) =>
  parts === null ? null : pick(parts);
const own = (category: FantraxCategory, of: (done: Contribution) => number, feeds = [category]): Stat => ({
  key: category.short,
  label: wordsFor(category).name,
  feeds,
  of,
});

const STATS: readonly Stat[] = [
  own(MINUTES, (done) => done.minutes),
  own(GOALS, (done) => done.goals),
  // FPL's assists are Fantrax's total, official and extra: 282 of 282 outfielders in GW5.
  own(ASSISTS_TOTAL, (done) => done.assists, ASSISTS),
  { key: "penaltiesWon", label: "Penalties won", feeds: [ASSISTS_TOTAL, ASSISTS_FANTASY], of: part((p) => p.penaltiesWon) },
  own(CLEAN_SHEETS, (done) => done.cleanSheets),
  own(GOALS_AGAINST_OUTFIELD, (done) => done.goalsConceded, [GOALS_AGAINST, GOALS_AGAINST_OUTFIELD]),
  {
    key: DEFENSIVE_POINTS.short,
    label: wordsFor(DEFENSIVE_POINTS).name,
    feeds: [DEFENSIVE_POINTS],
    of: part((p) => p.tacklesWon + p.interceptions + p.blocks),
  },
  {
    key: DEFENSIVE_POINTS_3.short,
    label: wordsFor(DEFENSIVE_POINTS_3).name,
    feeds: [DEFENSIVE_POINTS_3],
    of: part((p) => p.tacklesWon + p.interceptions + p.blocks + p.clearances + p.recoveries),
  },
  { key: "tacklesWon", label: "Tackles won", feeds: DEFCON, of: part((p) => p.tacklesWon) },
  { key: "interceptions", label: "Interceptions", feeds: DEFCON, of: part((p) => p.interceptions) },
  { key: "blocks", label: "Blocks", feeds: DEFCON, of: part((p) => p.blocks) },
  { key: "clearances", label: "Clearances", feeds: [DEFENSIVE_POINTS_3], of: part((p) => p.clearances) },
  { key: "recoveries", label: "Recoveries", feeds: [DEFENSIVE_POINTS_3], of: part((p) => p.recoveries) },
  { key: "saves", label: "Saves", feeds: KEEPER_WORK, of: (done) => done.saves },
  { key: "smothers", label: "Smothers", feeds: [KEEPER_POINTS], of: part((p) => p.smothers) },
  { key: "punches", label: "Punches", feeds: [KEEPER_POINTS], of: part((p) => p.punches) },
  { key: "highClaims", label: "High claims", feeds: [KEEPER_POINTS], of: part((p) => p.highClaims) },
  own(PENALTY_SAVES, (done) => done.penaltiesSaved),
  own(PENALTIES_MISSED, (done) => done.penaltiesMissed),
  own(OWN_GOALS, (done) => done.ownGoals),
  own(YELLOW_CARDS, (done) => done.yellowCards),
  own(RED_CARDS, (done) => done.redCards),
];

/** The rows the league prices at any of his positions ("M/F" is two), by key; null with no scoring or no position. */
export function scoredStats(scoring: LeagueScoring | null, position: string | null): string[] | null {
  const positions = position?.split(/[^A-Z]+/).filter(Boolean) ?? [];
  if (scoring === null || positions.length === 0) return null;
  const pays = (category: FantraxCategory) =>
    Object.values(scoring.categories).some(
      (scored) =>
        meaningOf(scored, [category]) !== null &&
        positions.some((letter) => {
          const price = priceOf(scoring.rules, scored.code, letter);
          return typeof price === "number" ? price !== 0 : (price?.bands.some((band) => band.points !== 0) ?? false);
        }),
    );
  return STATS.filter((stat) => stat.feeds.some(pays)).map((stat) => stat.key);
}

/** His rows: minutes alone until he has played, then every row the league scores; every row when `scored` is null. */
export function fullMatchStats(
  done: Contribution,
  parts: MatchParts | null,
  scored: readonly string[] | null,
): StatRow[] {
  const shown = STATS.filter((stat) => scored === null || scored.includes(stat.key));
  const played = done.minutes > 0 ? shown : shown.filter((stat) => stat.key === MINUTES.short);
  return played.map((stat) => ({ key: stat.key, label: stat.label, value: stat.of(done, parts) }));
}

/** One attacking figure; `of` is what he tried where the figure is what came off, "2/3". */
interface AttackingRow {
  key: keyof MatchParts;
  label: string;
  value: number;
  of: number | null;
}

/** Read down the left column, his shooting, then the right, his making. */
const ATTACKING: readonly { key: keyof MatchParts; label: string; made?: keyof MatchParts }[] = [
  { key: "shots", label: "Shots" },
  { key: "shotsOnTarget", label: "Shots on target" },
  { key: "bigChancesMissed", label: "Big chances missed" },
  { key: "touchesInBox", label: "Touches in the box" },
  { key: "chancesCreated", label: "Chances created" },
  { key: "bigChancesCreated", label: "Big chances created" },
  { key: "crosses", label: "Accurate crosses", made: "accurateCrosses" },
  { key: "contests", label: "Dribbles won", made: "contestsWon" },
];

/** His attacking off Opta's line, priced or not; none for a keeper or a man Opta has no line for. */
export function attackingStats(parts: MatchParts | null, position: string | null): AttackingRow[] {
  if (parts === null || isGoalkeeper(position)) return [];
  return ATTACKING.map(({ key, label, made }) =>
    made === undefined ? { key, label, value: parts[key], of: null } : { key, label, value: parts[made], of: parts[key] },
  );
}
