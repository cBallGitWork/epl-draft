import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { LEAGUE_COMPETITION, type LeagueTeam } from "@epl/core";
import Season from "./Season";
import type { SeasonRow } from "./teamSeason";

// The app's `@/` alias is Next's, not vitest's: each is the real module by its relative path.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => import("../../components/shell/Link"));
vi.mock("@/app/squad/routes", () => import("../../squad/routes"));
vi.mock("@/app/components/league/TeamName", () => ({ default: () => null }));

/** Every list of siblings in a tree that repeats a key: React drops or doubles one of each pair. */
function repeatedKeys(node: ReactNode): string[] {
  if (Array.isArray(node)) {
    const keys = node.flatMap((child) => (isValidElement(child) && child.key !== null ? [child.key] : []));
    const repeated = keys.filter((key, at) => keys.indexOf(key) !== at);
    return [...repeated, ...node.flatMap(repeatedKeys)];
  }
  if (!isValidElement(node)) return [];
  return repeatedKeys((node.props as { children?: ReactNode }).children);
}

const team = (teamId: string): LeagueTeam => ({ teamId, name: teamId });

/** One of this team's ties in gameweek 34, against `opponent`. */
const tie = (opponent: string): SeasonRow => ({
  round: { gameweek: 34, period: 34, deadline: null, kickoff: null, status: "upcoming", started: false },
  tie: { competition: LEAGUE_COMPETITION, round: null, code: null, home: { team: team("me"), label: "me" }, away: { team: team(opponent), label: opponent } },
  pointsFor: null,
  pointsAgainst: null,
  opponent: { team: team(opponent), label: opponent },
});

describe("a team's season", () => {
  it("keys both ties of a double header apart", () => {
    // The real league's gameweek 34 pairs every team twice (PLATFORM_NOTES, 2 Oct 2026).
    expect(repeatedKeys(Season({ rows: [tie("a"), tie("b")], teamId: "me" }))).toEqual([]);
  });
});
