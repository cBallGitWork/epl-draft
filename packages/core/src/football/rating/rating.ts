// Our match rating out of ten for one man in one match: what he did, weighed by whom he did it
// against, and set beside what was expected of him. Pure; the scale lives in `weights.ts`.

import type { OpponentScale, PartName, PerPosition, RatingPosition, RatingWeights } from "./weights";

/** One match, in the stats league's words plus FPL's `xg`/`xa`. An absent stat is one the feed
 *  did not cover: its part is left out, never counted as nought. */
export interface RatedMatch {
  position: RatingPosition;
  minutes: number;
  stats: Readonly<Record<string, number | null | undefined>>;
  /** The opponent's attack and defence as they stood before the match, 1.0 the league average. */
  opponent: { attack: number; defence: number } | null;
  /** What the projection expected of him in this fixture, at the minutes he played. */
  expected?: { goals: number; assists: number; cleanSheet: number } | null;
}

export interface RatedPart {
  name: PartName;
  label: string;
  points: number | null;
}

export interface MatchRating {
  /** Out of ten to one decimal; null for a cameo with nothing in it. */
  rating: number | null;
  raw: number | null;
  parts: RatedPart[];
  /** His returns less the returns expected of him, in rating points. */
  vsExpected: number | null;
  /** The mark with `blend` of `vsExpected` carried into it. */
  blended: number | null;
}

type Stats = RatedMatch["stats"];

/** Stats the scale reads that no feed reports directly. */
function derived(stats: Stats): Stats {
  const { goals, penaltyGoals, xg, penaltyXg } = stats;
  return {
    ...stats,
    openPlayGoals: goals == null ? null : goals - (penaltyGoals ?? 0),
    nonPenaltyXg: xg == null ? null : Math.max(0, xg - (penaltyXg ?? 0)),
  };
}

const weightFor = (weight: PerPosition, position: RatingPosition) =>
  typeof weight === "number" ? weight : (weight[position] ?? 0);

function opponentFactor(scale: OpponentScale | undefined, match: RatedMatch, w: RatingWeights): number {
  if (!scale || !match.opponent) return 1;
  const strength = scale === "defence" ? match.opponent.defence : match.opponent.attack;
  const factor = Math.min(w.opponent.max, Math.max(w.opponent.min, strength ** w.opponent.exponent));
  return scale === "attackInverse" ? 1 / factor : factor;
}

/** The raw mark flattened above the knee and held to 1–10. */
function curved(raw: number, c: RatingWeights["curve"]): number {
  const bent = raw > c.knee ? c.knee + (raw - c.knee) * c.slope : raw;
  return Math.min(10, Math.max(1, bent));
}

const oneDecimal = (n: number) => Math.round(n * 10) / 10;

function termWeight(w: RatingWeights, stat: string, position: RatingPosition): number {
  for (const part of w.parts) {
    const term = part.terms.find((t) => t.stat === stat);
    if (term) return weightFor(term.weight, position);
  }
  return 0;
}

function vsExpected(match: RatedMatch, stats: Stats, w: RatingWeights): number | null {
  const e = match.expected;
  if (!e) return null;
  const miss = (stat: string, expected: number) =>
    ((stats[stat] ?? 0) - expected) * termWeight(w, stat === "goals" ? "openPlayGoals" : stat, match.position);
  const sheet = match.minutes >= w.cleanSheetMinutes ? miss("cleanSheet", e.cleanSheet) : 0;
  return miss("goals", e.goals) + miss("assists", e.assists) + sheet;
}

export function rateMatch(match: RatedMatch, w: RatingWeights): MatchRating {
  const stats = derived(match.stats);
  const played = Math.min(match.minutes, 90) / 90;
  const base = weightFor(w.base.full, match.position) - w.base.cameoDrop * (1 - played);
  const parts: RatedPart[] = [{ name: "minutes", label: "Minutes played", points: base }];
  for (const part of w.parts) {
    let points: number | null = null;
    for (const term of part.terms) {
      const value = stats[term.stat];
      if (value == null) continue;
      points = (points ?? 0) + value * weightFor(term.weight, match.position) * opponentFactor(term.opponent, match, w);
    }
    parts.push({ name: part.name, label: part.label, points });
  }
  const rated = match.minutes >= w.minMinutes || w.ratedAnyway.some((stat) => (stats[stat] ?? 0) > 0);
  const raw = rated ? parts.reduce((sum, p) => sum + (p.points ?? 0), 0) : null;
  const versus = vsExpected(match, stats, w);
  return {
    rating: raw == null ? null : oneDecimal(curved(raw, w.curve)),
    raw,
    parts,
    vsExpected: versus,
    blended: raw == null || versus == null ? null : oneDecimal(curved(raw + w.blend * versus, w.curve)),
  };
}
