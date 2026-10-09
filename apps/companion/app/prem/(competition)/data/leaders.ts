import { type FigureKind, type FootballPlayer, type SeasonTotals, PLACES, fixed, mean, rounded } from "@epl/core";

// The Data tab's lists: one season figure per man, best first, the top twenty and the top fifty on asking.

export const TOP = 20;
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

/** Where a list's figure comes from: FPL's season counts, our marks, the served league's Fantrax points, or our
 *  DefCon points. */
export type Source = { fpl: (season: SeasonTotals) => number } | "rating" | "points" | "defcon";

/** The desk's rows of lists, each under its own plate. */
export const SECTIONS = [
  { key: "attacking", title: "Attacking" },
  { key: "fantasy", title: "Fantasy" },
  { key: "defending", title: "Defending" },
] as const;

export interface LeaderList {
  key: string;
  /** The bar over the list; Fantrax's figure says whose it is, and ours is cyan. */
  title: string;
  head: string;
  /** What the head means, on hover. */
  explain: string;
  source: Source;
  /** The kind of figure, which sets its places: a list ranks on the figure it prints, so two who read alike share a place. */
  kind: FigureKind;
  section: (typeof SECTIONS)[number]["key"];
}

export const LISTS: readonly LeaderList[] = [
  { key: "goals", title: "Top scorers", head: "G", explain: "Goals", source: { fpl: (s) => s.goals }, kind: "count", section: "attacking" },
  { key: "assists", title: "Assists", head: "A", explain: "Assists", source: { fpl: (s) => s.assists }, kind: "count", section: "attacking" },
  { key: "xg", title: "Expected goals", head: "xG", explain: "FPL's expected goals", source: { fpl: (s) => s.expectedGoals }, kind: "expected", section: "attacking" },
  { key: "xa", title: "Expected assists", head: "xA", explain: "FPL's expected assists", source: { fpl: (s) => s.expectedAssists }, kind: "expected", section: "attacking" },
  { key: "points", title: "Fantrax points", head: "FPts", explain: "Fantasy points, under this league's scoring", source: "points", kind: "count", section: "fantasy" },
  { key: "rating", title: "Match ratings", head: "Rtg", explain: "His average mark", source: "rating", kind: "rating", section: "fantasy" },
  { key: "defcon", title: "DefCon points", head: "DCP", explain: "DefCon points, worked out per match, at his slot or a free agent's best position", source: "defcon", kind: "count", section: "defending" },
  { key: "saves", title: "Saves", head: "Sv", explain: "Saves", source: { fpl: (s) => s.saves }, kind: "count", section: "defending" },
];

/** A figure as its list prints it, the British way: `1,234`, `4.42`, `7.2`. */
export function printed(list: LeaderList, figure: number): string {
  return fixed(figure, list.kind);
}

/** A figure held to the places its list prints, so the ranking agrees with what the reader sees. */
export function asPrinted(list: LeaderList, figure: number): number {
  return rounded(figure, PLACES[list.kind]);
}

/** The figures a list reads besides FPL's, each by FPL code; a man with none is off that list. */
export type Held = Readonly<Record<Exclude<Source, object>, ReadonlyMap<number, number>>>;

/** Each man on the books with a figure for the list, held to the places it prints. */
export function leadersOf(list: LeaderList, players: readonly Pick<FootballPlayer, "code" | "name" | "season">[], held: Held): Leader[] {
  const { source } = list;
  return players.flatMap(({ code, name, season }) => {
    const figure = typeof source === "object" ? source.fpl(season) : held[source].get(code);
    return figure === undefined ? [] : [{ code, name, figure: asPrinted(list, figure) }];
  });
}

/** The list asked for among those offered, or the first: a stale key in a shared link still shows a list. */
export function listFor(key: string | undefined, lists: readonly LeaderList[] = LISTS): LeaderList {
  return lists.find((list) => list.key === key) ?? lists[0];
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
    [...marks].flatMap(([code, held]) => {
      const average = held.length >= floor ? mean(held) : null;
      return average === null ? [] : [[code, average] as const];
    }),
  );
}
