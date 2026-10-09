import { describe, expect, it } from "vitest";
import { NEWS_GAPS, teamSheetGaps, unbackedFit } from "./teamSheetChecks";
import { banned } from "./banned";

// The Team Sheet of 9 Oct 2026, verbatim: clubs written up as who did not speak and what was not said.

describe("NEWS_GAPS", () => {
  it("catches every line that went to print about an absent manager or absent news", () => {
    const printed = [
      "William Saliba and Christos Tzolis stay sidelined, with no manager attached to the update.",
      "Nicolò Savona remains out, and no manager put his name to the news.",
      "Pedro Porro and the rest of the sidelined five gain no fresh word before the deadline.",
      "Jack Butland heads six men still unavailable, with no manager named on the returns.",
      "Abdul Fatawu is still the lone absentee, with nothing added.",
      "Unai Emery had one return to report and no change on the absentees.",
      "Nobel Mendy is back in contention for Hull City, and that is all that was said about him.",
      "No complaint was named and no manager was attached to the update, so whether he starts is left open.",
    ];
    for (const line of printed) expect(banned(line, NEWS_GAPS), line).not.toEqual([]);
  });

  it("lets a plain football fact through", () => {
    const plain = [
      "William Saliba and Christos Tzolis are out.",
      "Leon Goretzka is back from a knee injury.",
      "Pierre Sage welcomed three back, with Chadi Riad and Axel Disasi still missing.",
      "No injury concerns.",
    ];
    for (const line of plain) expect(banned(line, NEWS_GAPS), line).toEqual([]);
  });
});

describe("unbackedFit", () => {
  it("names a FIT man whose note is a bare complaint, which reads as if he still has it", () => {
    const rows = [{ club: "Arsenal", men: [
      { name: "Cristhian Mosquera", status: "FIT", note: "muscle" },
      { name: "Benjamin White", status: "FIT", note: "back from a groin injury" },
      { name: "Kenny Tete", status: "FIT", note: "" },
      { name: "Igor Jesus", status: "OUT", note: "calf" },
    ] }];
    expect(unbackedFit(rows)).toEqual(["Cristhian Mosquera"]);
  });

  it("lets a FIT man's note say what has changed without a complaint", () => {
    const rows = [{ men: [{ name: "Jeremy Jacquet", status: "FIT", note: "trained this week; rested by his country" }, { name: "Erling Haaland", status: "FIT", note: "ready after a few days off" }] }];
    expect(unbackedFit(rows)).toEqual([]);
  });

  it("reads nothing into a row that is not one", () => {
    expect(unbackedFit(undefined)).toEqual([]);
    expect(unbackedFit([null, { men: "x" }, { men: [null, { status: "FIT" }] }])).toEqual([]);
  });
});

// The Team Sheet of 9 Oct 2026: 13 of 14 clubs with no line, 3 quotes of the 18 offered, men with no note.
describe("teamSheetGaps", () => {
  const expected = {
    reported: [{ code: 3, club: "Arsenal" }, { code: 17, club: "Nottingham Forest" }],
    quoted: [{ code: 3, club: "Arsenal" }, { code: 17, club: "Nottingham Forest" }],
    noted: ["Christos Tzolis", "Igor Jesus", "Nikola Milenković"],
  };
  const filed = [
    { club: "Arsenal", code: 3, men: [{ name: "Christos Tzolis", status: "OUT", note: "hamstring" }] },
    { club: "Nottingham Forest", code: 17, line: "", men: [{ name: "Igor Jesus", status: "OUT", note: "calf" }, { name: "Nikola Milenković", status: "OUT", note: "" }] },
  ];

  it("names the clubs with news but no line, the clubs offered a quote that printed none, and the men with no note", () => {
    expect(teamSheetGaps(filed, expected)).toEqual({
      lines: ["Arsenal", "Nottingham Forest"],
      quotes: ["Arsenal", "Nottingham Forest"],
      notes: ["Nikola Milenković"],
    });
  });

  it("counts a club the column left out as a gap, and finds a row by its name when the code is lost", () => {
    const gaps = teamSheetGaps([{ club: "Arsenal", line: "Tzolis is out for a few weeks.", quote: { text: "He’s not available.", said: "Mikel Arteta" } }], expected);
    expect(gaps.lines).toEqual(["Nottingham Forest"]);
    expect(gaps.quotes).toEqual(["Nottingham Forest"]);
  });

  it("never asks a note of a suspended man or one the brief gave nothing", () => {
    const rows = [{ code: 40, men: [{ name: "Abdul Fatawu", status: "Suspended", note: "" }, { name: "Kenny Tete", status: "FIT", note: "" }] }];
    expect(teamSheetGaps(rows, { reported: [], quoted: [], noted: ["Abdul Fatawu"] }).notes).toEqual([]);
  });

  it("passes a column that reports, quotes and notes", () => {
    const clean = [
      { code: 3, line: "Tzolis is out for a few weeks with a muscle injury.", quote: { text: "He’s not available.", said: "Mikel Arteta" }, men: [{ name: "Christos Tzolis", status: "OUT", note: "hamstring; a few weeks" }] },
      { code: 17, line: "Milenković has a bone bruise.", quote: { text: "He will miss the game.", said: "Oliver Glasner" }, men: [{ name: "Igor Jesus", status: "OUT", note: "calf; a few weeks" }, { name: "Nikola Milenković", status: "OUT", note: "bone bruise; cannot train" }] },
    ];
    expect(teamSheetGaps(clean, expected)).toEqual({ lines: [], quotes: [], notes: [] });
  });

  it("reads nothing into a row that is not one", () => {
    expect(teamSheetGaps(undefined, { reported: [], quoted: [], noted: [] })).toEqual({ lines: [], quotes: [], notes: [] });
  });
});
