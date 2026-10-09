import { optaMetrics } from "./map";
import type { RawPlFixture } from "./raw";
import type { RawPlPlayerStats } from "./rawStats";

// One man's match in Opta's counts: those FPL's live feed does not split, which Fantrax scores, and his attacking.

/** What his DefCon, his keeping, his extra assists and his attacking are made of, in one match or over a gameweek. */
export interface MatchParts {
  tacklesWon: number;
  interceptions: number;
  blocks: number;
  clearances: number;
  recoveries: number;
  penaltiesWon: number;
  smothers: number;
  punches: number;
  highClaims: number;
  shots: number;
  shotsOnTarget: number;
  chancesCreated: number;
  bigChancesCreated: number;
  bigChancesMissed: number;
  crosses: number;
  accurateCrosses: number;
  touchesInBox: number;
  /** Take-ons tried; `contestsWon` the ones he beat his man in. */
  contests: number;
  contestsWon: number;
}

type Part = keyof MatchParts;

/** Opta's name for each part. */
const METRIC: Record<Part, string> = {
  tacklesWon: "won_tackle",
  interceptions: "interception",
  blocks: "outfielder_block",
  clearances: "effective_clearance",
  recoveries: "ball_recovery",
  penaltiesWon: "penalty_won",
  smothers: "gk_smother",
  punches: "punches",
  highClaims: "good_high_claim",
  shots: "total_scoring_att",
  shotsOnTarget: "ontarget_scoring_att",
  chancesCreated: "total_att_assist",
  bigChancesCreated: "big_chance_created",
  bigChancesMissed: "big_chance_missed",
  crosses: "total_cross",
  accurateCrosses: "accurate_cross",
  touchesInBox: "touches_in_opp_box",
  contests: "total_contest",
  contestsWon: "won_contest",
};

function partsOf(read: (part: Part) => number): MatchParts {
  return {
    tacklesWon: read("tacklesWon"),
    interceptions: read("interceptions"),
    blocks: read("blocks"),
    clearances: read("clearances"),
    recoveries: read("recoveries"),
    penaltiesWon: read("penaltiesWon"),
    smothers: read("smothers"),
    punches: read("punches"),
    highClaims: read("highClaims"),
    shots: read("shots"),
    shotsOnTarget: read("shotsOnTarget"),
    chancesCreated: read("chancesCreated"),
    bigChancesCreated: read("bigChancesCreated"),
    bigChancesMissed: read("bigChancesMissed"),
    crosses: read("crosses"),
    accurateCrosses: read("accurateCrosses"),
    touchesInBox: read("touchesInBox"),
    contests: read("contests"),
    contestsWon: read("contestsWon"),
  };
}

/** His parts in one match; null when he was not on the pitch in it. Opta omits a nought, so an absent metric is 0. */
export function plMatchParts(raw: RawPlPlayerStats): MatchParts | null {
  const metric = optaMetrics(raw.stats ?? []);
  if (metric("mins_played") <= 0) return null;
  return partsOf((part) => metric(METRIC[part]));
}

/** His matches added up; null when there are none. */
export function sumParts(matches: readonly MatchParts[]): MatchParts | null {
  if (matches.length === 0) return null;
  return partsOf((part) => matches.reduce((sum, match) => sum + match[part], 0));
}

/** The Premier League's id for a man either side named, found by his Opta code; null when neither did. */
export function plPlayerId(fixture: RawPlFixture, opta: string): number | null {
  for (const list of fixture.teamLists ?? []) {
    const man = list === null ? undefined : [...list.lineup, ...list.substitutes].find((p) => p.altIds?.opta === opta);
    if (man !== undefined) return man.id;
  }
  return null;
}
