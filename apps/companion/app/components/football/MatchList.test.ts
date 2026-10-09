import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FixtureStatus, FootballSnapshot } from "@epl/core";
import MatchList from "./MatchList";

vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/desk", () => ({ ROW_NAME: "" }));

/** One match and nobody in it yet, as the gameweek list draws it. */
function list(status: FixtureStatus, now: boolean): string {
  const fixture = {
    id: 1, code: 1, gameweek: 7, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-10T14:00:00Z",
    homeScore: status === "upcoming" ? null : 0, awayScore: status === "upcoming" ? null : 0,
    status, settled: false, minutes: 12, homeDifficulty: null, awayDifficulty: null,
  };
  const snapshot = { clubs: [], players: [], fixtures: [fixture], stats: [] } as unknown as FootballSnapshot;
  return renderToStaticMarkup(createElement(MatchList, { snapshot, now }));
}

describe("a match with nothing to report", () => {
  it("never says a match our copy has in play is still to kick off, however old the copy", () => {
    expect(list("live", false)).not.toContain("Kicks off");
  });

  it("says nothing yet while a fresh copy has it in play", () => {
    expect(list("live", true)).toContain("Nothing to report yet.");
  });

  it("says when a match to come kicks off", () => {
    expect(list("upcoming", true)).toContain("Kicks off Sat 15:00");
  });
});
