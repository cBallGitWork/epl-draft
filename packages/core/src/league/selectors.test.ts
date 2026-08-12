import { describe, expect, it } from "vitest";
import { leaguePool } from "./selectors";
import type { LeaguePlayer, LeaguePlayerState, PeriodRosters } from "./types";

// Small hand-built inputs rather than a trimmed capture: every case below is a
// disagreement BETWEEN the three payloads, and a fixture that happens to be
// consistent cannot express one.

const player = (fantraxId: string, displayName: string): LeaguePlayer => ({
  fantraxId,
  rawName: displayName,
  displayName,
  clubCode: "ARS",
  position: "M",
  rotowireId: null,
});

const pool = [player("c", "Cole"), player("a", "Adams"), player("b", "Bell")];

const states: LeaguePlayerState[] = [
  { fantraxId: "a", eligiblePositions: ["F", "M"], status: "T" },
  { fantraxId: "b", eligiblePositions: ["D"], status: "FA" },
];

const rosters: PeriodRosters = {
  period: 1,
  teams: [{ teamId: "t1", teamName: "test3", slots: [{ fantraxId: "a", position: "M", status: "ACTIVE" }] }],
};

describe("leaguePool", () => {
  it("reads eligibility and status from the league, and ownership from the rosters", () => {
    const [adams] = leaguePool(pool, states, rosters);
    expect(adams).toEqual({
      player: pool[1],
      eligiblePositions: ["F", "M"],
      status: "T",
      ownerTeamId: "t1",
    });
  });

  it("says nobody owns a player no roster holds, whatever his status", () => {
    // "WW" is a transaction rule, not an owner. An undrafted league marks all 697
    // waiver-wire and none of them belong to anyone, and reading the letter as
    // ownership would give every team in that league a full squad.
    const undrafted = leaguePool(
      pool,
      pool.map((p) => ({ fantraxId: p.fantraxId, eligiblePositions: ["M"], status: "WW" })),
      { period: null, teams: [] },
    );
    expect(undrafted.every((entry) => entry.ownerTeamId === null)).toBe(true);
    expect(undrafted.every((entry) => entry.status === "WW")).toBe(true);
  });

  it("keeps a player the league has said nothing about, claiming nothing about him", () => {
    const cole = leaguePool(pool, states, rosters).find((e) => e.player.fantraxId === "c");
    expect(cole).toMatchObject({ eligiblePositions: [], status: "" });
  });

  it("orders by the name a person would look for", () => {
    expect(leaguePool(pool, states, rosters).map((e) => e.player.displayName)).toEqual([
      "Adams",
      "Bell",
      "Cole",
    ]);
  });
});
