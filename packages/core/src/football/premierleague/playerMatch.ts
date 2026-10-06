import type { RawPlFixture } from "./raw";
import type { RawPlPlayerStats } from "./rawStats";

// One man's match in the Opta counts FPL's live feed does not split, which are the counts Fantrax scores.

/** What his DefCon, his keeping and his extra assists are made of, in one match or added over a gameweek. */
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
  };
}

/** His parts in one match; null when he was not on the pitch in it. Opta omits a nought, so an absent metric is 0. */
export function plMatchParts(raw: RawPlPlayerStats): MatchParts | null {
  const byName = new Map((raw.stats ?? []).map((metric) => [metric.name, metric.value]));
  if ((byName.get("mins_played") ?? 0) <= 0) return null;
  return partsOf((part) => byName.get(METRIC[part]) ?? 0);
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
