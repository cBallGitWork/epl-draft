import type { SeasonTotals } from "@epl/core";

// The Data tab's lists: one season figure per man, best first, the top ten and the top fifty on asking.

export const TOP = 10;
export const MOST = 50;

/** One man's claim to a place on a list. */
export interface Leader {
  code: number;
  name: string;
  figure: number;
}

export interface Ranked extends Leader {
  rank: number;
}

/** Where a list's figure comes from: FPL's season counts, our marks, or the served league's Fantrax points. */
export type Source = { fpl: (season: SeasonTotals) => number } | "rating" | "points";

export interface LeaderList {
  key: string;
  /** The bar over the list; a figure that is not FPL's says whose it is. */
  title: string;
  head: string;
  /** What the head means, on hover. */
  explain: string;
  source: Source;
  /** Decimal places: a list ranks on the figure it prints, so two men who read alike share a place. */
  digits: number;
}

export const LISTS: readonly LeaderList[] = [
  { key: "goals", title: "Top scorers", head: "G", explain: "Goals", source: { fpl: (s) => s.goals }, digits: 0 },
  { key: "xg", title: "Expected goals", head: "xG", explain: "FPL's expected goals", source: { fpl: (s) => s.expectedGoals }, digits: 2 },
  { key: "rating", title: "Our match ratings", head: "Rtg", explain: "His average mark", source: "rating", digits: 1 },
  { key: "points", title: "Fantrax points", head: "FPts", explain: "Fantasy points, under this league's scoring", source: "points", digits: 0 },
  { key: "assists", title: "Assists", head: "A", explain: "Assists", source: { fpl: (s) => s.assists }, digits: 0 },
  { key: "xa", title: "Expected assists", head: "xA", explain: "FPL's expected assists", source: { fpl: (s) => s.expectedAssists }, digits: 2 },
  { key: "cleanSheets", title: "Clean sheets", head: "CS", explain: "Clean sheets, as FPL counts them", source: { fpl: (s) => s.cleanSheets }, digits: 0 },
  { key: "saves", title: "Saves", head: "Sv", explain: "Saves", source: { fpl: (s) => s.saves }, digits: 0 },
];

/** A figure as its list prints it, the British way: `1,234`, `4.42`, `7.2`. */
export function printed(list: LeaderList, figure: number): string {
  return figure.toLocaleString("en-GB", { minimumFractionDigits: list.digits, maximumFractionDigits: list.digits });
}

/** A figure held to the places its list prints, so the ranking agrees with what the reader sees. */
export function asPrinted(list: LeaderList, figure: number): number {
  const scale = 10 ** list.digits;
  return Math.round(figure * scale) / scale;
}

/** The list asked for, or the first: a stale key in a shared link still shows a list. */
export function listFor(key: string | undefined): LeaderList {
  return LISTS.find((list) => list.key === key) ?? LISTS[0];
}

/** The best `n`, biggest first and then by name; a nought earns no place, and level figures share one. */
export function ranked(leaders: readonly Leader[], n: number): Ranked[] {
  const sorted = leaders
    .filter((leader) => leader.figure > 0)
    .sort((a, b) => b.figure - a.figure || a.name.localeCompare(b.name));
  let rank = 0;
  let previous: number | null = null;
  return sorted.slice(0, n).map((leader, at) => {
    if (leader.figure !== previous) rank = at + 1;
    previous = leader.figure;
    return { ...leader, rank };
  });
}

/** Each man's average mark, once he is rated in at least half as many matches as the most-rated man. */
export function seasonRatings(marks: ReadonlyMap<number, readonly number[]>): Map<number, number> {
  const most = Math.max(0, ...[...marks.values()].map((held) => held.length));
  const floor = Math.max(1, Math.ceil(most / 2));
  return new Map(
    [...marks]
      .filter(([, held]) => held.length >= floor)
      .map(([code, held]) => [code, held.reduce((sum, mark) => sum + mark, 0) / held.length]),
  );
}
