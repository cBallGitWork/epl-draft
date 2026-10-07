// The Premier League's `/stats/*` endpoints, mirrored as they answer.

import type { RawPlFixture, RawPlTeam } from "./raw";

/** One Opta metric from `/stats/match`, `/stats/team` or `/stats/player`; `description` is a "Todo" placeholder, never printed.
 *  A metric worth nought is OMITTED, so a reader defaults a missing one to 0: here absence is not `—`. */
export interface RawPlMetric {
  name: string;
  value: number;
  description?: string;
}

/** `/stats/match/{id}`: every Opta metric for both sides, `data` keyed by team id as a string, each side's under `M`. */
export interface RawPlMatchStats {
  entity?: RawPlFixture;
  data: Record<string, { M: RawPlMetric[] }>;
}

/** `/stats/team/{id}` — one club's season, every Opta metric summed; `entity.altIds` only with `altIds=true`. */
export interface RawPlTeamStats {
  entity?: RawPlTeam;
  stats: RawPlMetric[];
}

/** `/stats/player/{id}?fixtures={matchId}`: one man's metrics in one match; `stats` is empty for a match he did not
 *  play in. His profile rides along as `entity`, unread. */
export interface RawPlPlayerStats {
  stats?: RawPlMetric[];
}

/** `/teams?comps=&compSeasons=` — the season's twenty clubs. */
export interface RawPlTeamPage {
  content: RawPlTeam[];
}
