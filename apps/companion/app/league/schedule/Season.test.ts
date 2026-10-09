import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { repeatedKeys } from "../../repeatedKeys";
import { LEAGUE_COMPETITION, type LeagueTeam } from "@epl/core";
import Season from "./Season";
import type { SeasonRow } from "./teamSeason";

// The app's `@/` alias is Next's, not vitest's: each is the real module by its relative path, or a stand-in.
vi.mock("@/app/desk", () => import("../../desk"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/squad/routes", () => import("../../squad/routes"));
vi.mock("@/app/components/league/TeamName", () => ({ default: () => null }));

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
