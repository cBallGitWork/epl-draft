import type { HeadToHead } from "@epl/core";
import { MATCHUPS, matchupHref } from "../../routes";

/** The head-to-head's plates, in the order the strip draws them; the first is where it opens. */
const MATCHUP_VIEWS = ["lineups", "stats", "fixtures", "table"] as const;

export type MatchupView = (typeof MATCHUP_VIEWS)[number];

const LABEL: Record<MatchupView, string> = {
  lineups: "Lineups",
  stats: "Stats",
  fixtures: "Fixtures",
  table: "Table",
};

/** The view a URL asks for, or the first for anything it does not name. */
export function matchupView(asked: string | undefined): MatchupView {
  return MATCHUP_VIEWS.find((view) => view === asked) ?? MATCHUP_VIEWS[0];
}

/** One linked plate per view, each keeping the round and the tie on screen; the opening view needs no query. */
export function matchupTabs(teamId: string, gameweek: number | undefined, vs?: string) {
  return MATCHUP_VIEWS.map((key) => ({
    key,
    label: LABEL[key],
    href: matchupHref(teamId, gameweek, key === MATCHUP_VIEWS[0] ? undefined : key, vs),
  }));
}

/** The tie a URL's `vs` names, else the schedule's first; undefined for a bye. */
export function pickTie<T extends Pick<HeadToHead, "opponent">>(ties: readonly T[], vs: string | undefined): T | undefined {
  return ties.find((tie) => tie.opponent.teamId === vs) ?? ties[0];
}

/** A double header's plate per tie, on the same round and view; the first needs no `vs`. None for a single tie. */
export function tieTabs(teamId: string, gameweek: number | undefined, view: MatchupView, ties: readonly Pick<HeadToHead, "opponent">[]) {
  if (ties.length < 2) return [];
  return ties.map((tie, at) => ({
    key: tie.opponent.teamId,
    label: `v ${tie.opponent.name}`,
    href: matchupHref(teamId, gameweek, view === MATCHUP_VIEWS[0] ? undefined : view, at === 0 ? undefined : tie.opponent.teamId),
  }));
}

/** Stats' foot: the URL's side, the other side, then the fantasy report it opens on. */
export const STATS_OF = ["team", "opponent", "fantasy"] as const;

export type StatsOf = (typeof STATS_OF)[number];

export function statsOf(asked: string | undefined): StatsOf {
  return STATS_OF.find((of) => of === asked) ?? "fantasy";
}

/** A side board opens ranked by Fantrax's points, most first. */
export const DEFAULT_SIDE_SORT = "Pts";

/** Stats on one sub-view, and a side board on one column; defaults stay out of the query. */
export function statsHref(
  teamId: string,
  gameweek: number | undefined,
  of: StatsOf,
  sort: { head: string; descending: boolean } = { head: DEFAULT_SIDE_SORT, descending: true },
  vs?: string,
): string {
  const query = new URLSearchParams();
  if (gameweek !== undefined) query.set("gw", String(gameweek));
  query.set("view", "stats");
  if (of !== "fantasy") query.set("of", of);
  if (sort.head !== DEFAULT_SIDE_SORT) query.set("sort", sort.head);
  if (!sort.descending) query.set("dir", "asc");
  if (vs !== undefined) query.set("vs", vs);
  return `${MATCHUPS}/${teamId}?${query.toString()}`;
}
