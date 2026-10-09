import { CUPS } from "@epl/core";
import { ANALYSIS, PROJECTIONS, PROJECTIONS_SHOWN } from "../../apps/companion/app/players/routes";

// The routes a smoke walk visits: those that need no id, then each id-scoped family once a read has named an id.

/** Each declared cup but the first, which the bare `/league/cups` draws. */
const CUP_ROUTES = CUPS.slice(1).map((cup) => `/league/cups?cup=${cup.id}`);

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
  ...CUP_ROUTES,
  // A link from before the cups lost their views still answers.
  ...CUP_ROUTES.slice(-1).map((route) => `${route}&view=bracket`),
  "/squad",
  "/players",
  // Compare with nobody chosen; the pair is walked once a read names two held men.
  ANALYSIS,
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
  "/credits",
  // Mail's league-wide ledger; the inbox itself is the reader's own and is not walked.
  "/news/transfers",
] as const;

/** The ids the id-scoped routes need, each null when its read would not name one. */
export interface WalkIds {
  teamId: string | null;
  playerId: string | null;
  /** A second held man, named only beside `playerId`. */
  rivalId: string | null;
  club: number | null;
  match: number | null;
}

/** Routes no walk visits, and why. */
export const NEVER_WALKED: Readonly<Record<string, string>> = {
  "/paper/[slug]": "a slug exists only once a story is filed",
  "/news": "the inbox is the reader's own",
  ...(PROJECTIONS_SHOWN ? {} : { [PROJECTIONS]: "switched off, it is a true 404" }),
};

/** The routes one id opens, and what to say when no read named it. */
interface Family {
  id: keyof WalkIds;
  route: string;
  unnamed: string;
  paths: (id: string, ids: WalkIds) => string[];
}

const FAMILIES: readonly Family[] = [
  {
    // The squad board and its tabs, and the head-to-head.
    id: "teamId",
    route: "/squad/[teamId]",
    unnamed: "the league names no team yet",
    paths: (id) => [`/squad/${id}`, `/squad/${id}/fixtures`, `/squad/${id}/next`, `/squad/${id}/stats`, `/squad/${id}/transfers`, `/league/matchups/${id}`],
  },
  {
    // His page and its tabs; History redirects to Data, which reads his FPL game log as no other route walked here does.
    id: "playerId",
    route: "/players/[fantraxId]",
    unnamed: "nobody holds a player yet",
    paths: (id) => [`/players/${id}`, `/players/${id}/data`, `/players/${id}/history`, `/players/${id}/news`, `/players/${id}/transfer`],
  },
  {
    // Data's Compare: its ids are in the query, so no link off the board reaches it.
    id: "rivalId",
    route: `${ANALYSIS}?a=[fantraxId]&b=[fantraxId]`,
    unnamed: "nobody holds two players yet",
    paths: (rival, { playerId }) => (playerId === null ? [] : [`${ANALYSIS}?a=${playerId}&b=${rival}`]),
  },
  {
    id: "club",
    route: "/prem/club/[code]",
    unnamed: "FPL would not name a club",
    paths: (id) => [`/prem/club/${id}`, `/prem/club/${id}/depth`, `/prem/club/${id}/set-pieces`, `/prem/club/${id}/fixtures`, `/prem/club/${id}/stats`],
  },
  {
    // Line Ups is where an empty sheet lands before kickoff; Stats proves the Premier League's `/stats/match`
    // still answers, and its Fantasy view that our league's read does.
    id: "match",
    route: "/prem/match/[id]",
    unnamed: "FPL would not name a fixture",
    paths: (id) => [
      `/prem/match/${id}`,
      `/prem/match/${id}/players`,
      `/prem/match/${id}/stats`,
      `/prem/match/${id}/stats?view=fantasy`,
      `/prem/match/${id}/zones`,
      `/prem/match/${id}/highlights`,
    ],
  },
];

/** Every route a walk visits with these ids. */
export function walkPaths(ids: WalkIds): string[] {
  return [
    ...ROUTES,
    ...FAMILIES.flatMap((family) => {
      const id = ids[family.id];
      return id === null ? [] : family.paths(String(id), ids);
    }),
  ];
}

/** One line per id-scoped family the walk could not visit: a walk that quietly drops a route still prints a full count. */
export function skipped(ids: WalkIds): string[] {
  return FAMILIES.filter((family) => ids[family.id] === null).map((family) => `${family.route}  ${family.unnamed}, so it was not walked`);
}
