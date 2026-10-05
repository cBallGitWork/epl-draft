import { describe, expect, it } from "vitest";
import type { RosterLimits, RosterSlot } from "@epl/core";
import { eligibilityOf, legalMoves } from "@epl/core";
import { freeMoves, withOpenings } from "./openings";

// A 1-3-4-3 under the real league's caps and floors, with an M/F man up front.
const shape: [string, string, string[]][] = [
  ["g", "G", ["G"]],
  ["d1", "D", ["D"]], ["d2", "D", ["D"]], ["d3", "D", ["D"]],
  ["m1", "M", ["M"]], ["m2", "M", ["M"]], ["m3", "M", ["M"]], ["m4", "M", ["M"]],
  ["mf", "F", ["M", "F"]], ["f2", "F", ["F"]], ["f3", "F", ["F"]],
];
const slots: RosterSlot[] = [
  ...shape.map(([fantraxId, position]) => ({ fantraxId, position, status: "ACTIVE" })),
  { fantraxId: "sub", position: "D", status: "RESERVE" },
];
const eligibility = eligibilityOf([
  ...shape.map(([fantraxId, , eligiblePositions]) => ({ fantraxId, eligiblePositions })),
  { fantraxId: "sub", eligiblePositions: ["D"] },
]);
const limits: RosterLimits = {
  maxTotalPlayers: 15,
  maxActivePlayers: 11,
  maxReservePlayers: 4,
  maxActiveByPosition: { G: 1, D: 5, M: 5, F: 3 },
  minActiveByPosition: { G: 1, D: 3, M: 2, F: 1 },
};

describe("freeMoves", () => {
  it("opens midfield to an M/F forward in a 3-4-3, with nobody coming off", () => {
    expect(freeMoves(legalMoves(slots, eligibility, limits, "mf"))).toEqual([{ kind: "shift", fantraxId: "mf", to: "M" }]);
  });

  it("opens nothing to a reserve when the eleven is full, which only a swap answers", () => {
    expect(freeMoves(legalMoves(slots, eligibility, limits, "sub"))).toEqual([]);
  });
});

describe("withOpenings", () => {
  const rows = [
    { label: "G", players: ["g"] },
    { label: "D", players: ["d1", "d2", "d3"] },
    { label: "F", players: ["mf", "f2"] },
  ];

  it("puts the free place at the end of the line it opens in", () => {
    expect(withOpenings(rows, ["D"])[1]).toEqual({ label: "D", players: ["d1", "d2", "d3", "D"] });
  });

  it("draws a line nobody stands in yet at its depth", () => {
    expect(withOpenings(rows, ["M"]).map((row) => row.label)).toEqual(["G", "D", "M", "F"]);
  });

  it("leaves the pitch alone with nobody picked", () => {
    expect(withOpenings(rows, [])).toEqual(rows);
  });
});
