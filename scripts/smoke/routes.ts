import { PROJECTIONS, PROJECTIONS_SHOWN } from "../../apps/companion/app/players/routes";

// The routes a smoke walk visits: those that need no id, then each id-scoped family once a read has named an id.

/** Every route that needs no id. `/paper/[slug]` is left out because a slug exists only once a story is filed. */
export const ROUTES = [
  "/",
  "/league",
  "/league/schedule",
  "/league/matchups",
  "/league/results",
  "/league/team-stats",
  "/league/cups",
  "/league/scoring",
  "/league/cups?cup=davy-propper",
  // A link from before the cups lost their views still answers.
  "/league/cups?cup=davy-propper&view=bracket",
  "/squad",
  "/players",
  // Data's Compare: its ids are in the query, so no link off the board reaches it.
  "/players/analysis?a=05gcr&b=03ksl",
  "/players/teams",
  "/players/planner",
  "/players/planner?view=defence",
  // Walked only while shown: switched off, it is a true 404.
  ...(PROJECTIONS_SHOWN ? [PROJECTIONS] : []),
  "/matchday",
  "/matchday/desk",
  "/prem",
  "/prem/results",
  "/prem/fixtures",
  "/prem/team-stats",
  "/prem/data",
  "/gw/1",
  "/fpl",
  "/more",
  // Mail's league-wide ledger; the inbox itself is the reader's own and is not walked.
  "/news/transfers",
] as const;

/** The ids the id-scoped routes need, each null when its read would not name one. */
export interface WalkIds {
  teamId: string | null;
  playerId: string | null;
  club: number | null;
  match: number | null;
}

/** Every route a walk visits with these ids. */
export function walkPaths({ teamId, playerId, club, match }: WalkIds): string[] {
  const paths: string[] = [...ROUTES];
  // The id-scoped screens: the squad board and its tabs, and the head-to-head.
  if (teamId !== null) {
    paths.push(
      `/squad/${teamId}`,
      `/squad/${teamId}/fixtures`,
      `/squad/${teamId}/next`,
      `/squad/${teamId}/stats`,
      `/squad/${teamId}/transfers`,
      `/league/matchups/${teamId}`,
    );
  }
  // His page and his Data tab: each reads his FPL game log, which no other route walked here does.
  if (playerId !== null) paths.push(`/players/${playerId}`, `/players/${playerId}/data`);
  if (club !== null) {
    paths.push(
      `/prem/club/${club}`,
      `/prem/club/${club}/depth`,
      `/prem/club/${club}/set-pieces`,
      `/prem/club/${club}/fixtures`,
      `/prem/club/${club}/stats`,
    );
  }
  // Line Ups is where an empty sheet lands before kickoff; Stats proves the Premier League's `/stats/match`
  // still answers, and its Fantasy view that our league's read does.
  if (match !== null) {
    paths.push(
      `/prem/match/${match}`,
      `/prem/match/${match}/players`,
      `/prem/match/${match}/stats`,
      `/prem/match/${match}/stats?view=fantasy`,
    );
  }
  return paths;
}
