import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, Fixture } from "@epl/core";
import { Match } from "./Rows";

vi.mock("@/app/desk", () => import("../../desk"));

const clubs = new Map<number, Club>([
  [1, { id: 1, code: 3, name: "Arsenal", shortName: "ARS" }],
  [2, { id: 2, code: 7, name: "Aston Villa", shortName: "AVL" }],
]);

const live: Fixture = {
  id: 9, code: 9, gameweek: 7, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-10T14:00:00Z",
  homeScore: 1, awayScore: 0, status: "live", settled: false, minutes: 34, homeDifficulty: null, awayDifficulty: null,
};

const row = (now: boolean) => renderToStaticMarkup(createElement(Match, { fixture: live, clubs, now }));

describe("the desk's football row", () => {
  it("runs a live clock while the snapshot is fresh", () => {
    expect(row(true)).toContain("34′");
  });

  it("never prints a live minute off a stale snapshot, which may be of a match long over", () => {
    expect(row(false)).not.toContain("34′");
    expect(row(false)).not.toContain("text-live");
  });
});
