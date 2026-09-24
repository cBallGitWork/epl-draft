import { matchupHref } from "../../routes";

/** The head-to-head's plates, in the order the strip draws them; the first is where it opens. */
export const MATCHUP_VIEWS = ["lineups", "stats", "players", "table", "scores"] as const;

export type MatchupView = (typeof MATCHUP_VIEWS)[number];

const LABEL: Record<MatchupView, string> = {
  lineups: "Lineups",
  stats: "Stats",
  players: "Players",
  table: "Table",
  scores: "Scores",
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
