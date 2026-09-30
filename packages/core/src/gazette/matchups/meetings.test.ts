import { describe, expect, it } from "vitest";
import { meetingLines, oldBoys } from "./meetings";

describe("meetingLines", () => {
  it("gives the last meeting alone after one, and a clean sweep or a record after more", () => {
    expect(meetingLines("Dons", "Notemail", [{ period: 2, for: 40, against: 31 }])).toEqual(["the last meeting: Dons won 40-31 in gameweek 2"]);
    expect(meetingLines("Dons", "Notemail", [{ period: 2, for: 40, against: 31 }, { period: 9, for: 38, against: 30 }])).toEqual(["Dons have won all 2 meetings with Notemail", "the last meeting: Dons won 38-30 in gameweek 9"]);
    expect(meetingLines("Dons", "Notemail", [{ period: 2, for: 40, against: 31 }, { period: 9, for: 30, against: 30 }])).toEqual(["Dons' record against Notemail is won 1, drawn 1, lost 0", "the last meeting: they drew 30-30 in gameweek 9"]);
    expect(meetingLines("Dons", "Notemail", [])).toEqual([]);
  });
});

describe("oldBoys", () => {
  it("names a man facing the side that drafted or moved him on, and nobody else", () => {
    const formerly = new Map([["isak", [{ teamId: "x", how: "traded" as const, when: 4 }, { teamId: "n", how: "drafted" as const, when: 2 }]], ["hall", [{ teamId: "x", how: "traded" as const, when: 4 }]]]);
    expect(oldBoys([{ fantraxId: "isak", name: "Isak" }, { fantraxId: "hall", name: "Hall" }], { teamId: "n", name: "Notemail" }, formerly)).toEqual([{ fantraxId: "isak", line: "Isak faced Notemail, who drafted him" }]);
  });
});
