import { describe, expect, it } from "vitest";
import { firstKickoff } from "./dispatch";

describe("when the elevens expire", () => {
  // The cargo is in home-club order, not kickoff order: GW6 printed Arsenal first and Coventry, Monday night, fourth.
  it("is the round's earliest kickoff, wherever its tie sits in the cargo", () => {
    const lineups = [
      { home: { club: "Arsenal" }, kickoff: "2026-10-10T14:00:00Z" },
      { home: { club: "Brentford" }, kickoff: "2026-10-10T11:30:00Z" },
      { home: { club: "Coventry City" }, kickoff: "2026-10-12T19:00:00Z" },
    ];
    expect(firstKickoff(lineups)).toBe("2026-10-10T11:30:00Z");
  });

  it("is none without a readable kickoff", () => {
    expect(firstKickoff(null)).toBeNull();
    expect(firstKickoff([{ kickoff: "" }, { kickoff: 4 }])).toBeNull();
  });
});
