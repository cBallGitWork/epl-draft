import { describe, expect, it } from "vitest";
import { meetingsWon, oldBoys } from "./meetings";

describe("meetingsWon", () => {
  it("is a fact for the side that won every meeting, from two on, and nothing for a mixed record", () => {
    const [dons, notemail] = [{ teamId: "d", name: "Dons" }, { teamId: "n", name: "Notemail" }];
    expect(meetingsWon(dons, notemail, [{ period: 2, for: 31, against: 40 }, { period: 9, for: 30, against: 38 }])).toEqual({ teamId: "n", kind: "meetings-won", text: "Notemail have won both meetings with Dons" });
    expect(meetingsWon(dons, notemail, [2, 5, 9].map((period) => ({ period, for: 40, against: 31 })))?.text).toBe("Dons have won all 3 meetings with Notemail");
    expect(meetingsWon(dons, notemail, [{ period: 2, for: 40, against: 31 }])).toBeNull();
    expect(meetingsWon(dons, notemail, [{ period: 2, for: 40, against: 31 }, { period: 9, for: 30, against: 30 }])).toBeNull();
  });
});

describe("oldBoys", () => {
  it("names a man facing the side that drafted or moved him on, and nobody else", () => {
    const formerly = new Map([["isak", [{ teamId: "x", how: "traded" as const, when: 4 }, { teamId: "n", how: "drafted" as const, when: 2 }]], ["hall", [{ teamId: "x", how: "traded" as const, when: 4 }]]]);
    expect(oldBoys([{ fantraxId: "isak", name: "Isak" }, { fantraxId: "hall", name: "Hall" }], { teamId: "n", name: "Notemail" }, formerly)).toEqual([{ fantraxId: "isak", line: "Isak faced Notemail, who drafted him" }]);
  });
});
