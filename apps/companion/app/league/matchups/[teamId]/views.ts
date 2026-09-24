import { MATCHUPS, matchupHref } from "../../routes";

/** The head-to-head's plates, in the order the strip draws them; the first is where it opens. */
export const MATCHUP_VIEWS = ["lineups", "stats", "fixtures", "table"] as const;

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

/** One linked plate per view, each keeping the round on screen; the opening view needs no query. */
export function matchupTabs(teamId: string, gameweek: number | undefined) {
  return MATCHUP_VIEWS.map((key) => ({
    key,
    label: LABEL[key],
    href: matchupHref(teamId, gameweek, key === MATCHUP_VIEWS[0] ? undefined : key),
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
): string {
  const query = new URLSearchParams();
  if (gameweek !== undefined) query.set("gw", String(gameweek));
  query.set("view", "stats");
  if (of !== "fantasy") query.set("of", of);
  if (sort.head !== DEFAULT_SIDE_SORT) query.set("sort", sort.head);
  if (!sort.descending) query.set("dir", "asc");
  return `${MATCHUPS}/${teamId}?${query.toString()}`;
}
