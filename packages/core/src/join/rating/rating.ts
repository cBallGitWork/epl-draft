// Our match rating out of ten: his league points, weighed by whom he earned them against and by
// what the league does not score, then read off one table. Pure; the scale lives in `weights.ts`.

import type { PartName, RatingWeights } from "./weights";

/** One man's match. League figures arrive as plain numbers so neither layer is imported here. */
export interface RatedMatch {
  minutes: number;
  /** His league points, and how many came from goals and assists and from a clean sheet. */
  points: { total: number; attacking: number; cleanSheet: number } | null;
  /** Football counts; an absent stat is one the feed did not cover. */
  stats: Readonly<Record<string, number | null | undefined>>;
  /** The opponent's attack and defence before the match, 1.0 the league average. */
  opponent: { attack: number; defence: number } | null;
  /** The goal-and-assist and clean-sheet points expected of him in this fixture. */
  expected?: { attacking: number; cleanSheet: number } | null;
}

export interface RatedPart {
  name: PartName;
  label: string;
  points: number | null;
}

export interface MatchRating {
  /** Out of ten to one decimal; null for a cameo with nothing in it or a man the league did not score. */
  rating: number | null;
  /** His points after the opponent and the parts, which the mark is read from. */
  adjusted: number | null;
  parts: RatedPart[];
  /** Goal, assist and clean-sheet points he got less those expected of him. */
  vsExpected: number | null;
}

const oneDecimal = (n: number) => Math.round(n * 10) / 10;

/** Straight lines between the table's points; flat beyond either end. */
export function markFor(points: number, marks: RatingWeights["marks"]): number {
  const [first, last] = [marks[0], marks[marks.length - 1]];
  if (points <= first[0]) return first[1];
  if (points >= last[0]) return last[1];
  const i = marks.findIndex(([p]) => p >= points);
  const [[p0, m0], [p1, m1]] = [marks[i - 1], marks[i]];
  return m0 + ((points - p0) / (p1 - p0)) * (m1 - m0);
}

function opponentFactor(strength: number | undefined, w: RatingWeights): number {
  if (strength == null) return 1;
  return Math.min(w.opponent.max, Math.max(w.opponent.min, strength ** w.opponent.exponent));
}

export function rateMatch(match: RatedMatch, w: RatingWeights): MatchRating {
  const { points, stats } = match;
  const opponent = points
    ? points.attacking * (opponentFactor(match.opponent?.defence, w) - 1) +
      points.cleanSheet * (opponentFactor(match.opponent?.attack, w) - 1)
    : null;
  const parts: RatedPart[] = [
    { name: "points", label: "League points", points: points?.total ?? null },
    { name: "opponent", label: "Weighed by the opponent", points: opponent },
  ];
  for (const part of w.parts) {
    let sum: number | null = null;
    for (const term of part.terms) {
      const value = stats[term.stat];
      if (value != null) sum = (sum ?? 0) + value * term.points;
    }
    parts.push({ name: part.name, label: part.label, points: sum });
  }
  const happened = w.ratedAnyway.some((stat) => (stats[stat] ?? 0) > 0);
  const rated = points != null && (match.minutes >= w.minMinutes || happened);
  const adjusted = rated ? parts.reduce((sum, p) => sum + (p.points ?? 0), 0) : null;
  const e = match.expected;
  return {
    rating: adjusted == null ? null : oneDecimal(markFor(adjusted, w.marks)),
    adjusted,
    parts,
    vsExpected: points && e ? points.attacking + points.cleanSheet - e.attacking - e.cleanSheet : null,
  };
}
