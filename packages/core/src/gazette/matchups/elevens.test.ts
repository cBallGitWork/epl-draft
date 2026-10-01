import { describe, expect, it } from "vitest";
import { draftMan, goalAt } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { LIMITS } from "./__fixtures__/limits";
import { benchText, draftBench, draftReturns, draftRows, lineupText, returnText, rowNote } from "./elevens";
import { matchupState } from "./state";
import type { DraftMan } from "./types";

const SUNDAY = "2026-09-27T15:30:00Z";
const everton = { opponent: "Everton", home: true, kickoff: "2026-09-28T19:00:00Z" };
const men = eleven("h", {
  0: draftMan("Raya", "G", 6, 90, 0, { cleanSheets: 1 }),
  1: draftMan("Dunk", "D", null, 0),
  5: draftMan("Saka", "M", 8, 90, 0, { goals: 1, assists: 1, scoredAt: [goalAt(90, 4)] }),
  6: draftMan("Rice", "M", null, 0, 1, { next: everton }),
  7: draftMan("Odegaard", "M", 0, 90),
  9: draftMan("Haaland", "F", 13, 90, 0, { goals: 2, scoredAt: [goalAt(81, undefined, SUNDAY), goalAt(12, undefined, SUNDAY)] }),
  10: draftMan("Isak", "F", 4, 90, 0, { goals: 1 }),
});
const side = (bench: DraftMan[]) => matchupState({ home: draftSide("123", 40, men, bench), away: draftSide("test2", 30, eleven("a")) }, LIMITS, "gameweek").home;
const vuskovic = draftMan("Vuskovic", "D", 6, 90, 0, { cleanSheets: 1 });
const scorer = draftMan("Wissa", "F", 5, 90, 0, { goals: 1, scoredAt: [goalAt(30)] });

describe("draftReturns", () => {
  it("sets the scorers out in the order they scored, with their minutes, and one the feed did not time last", () => {
    expect(draftReturns(side([vuskovic])).goals).toEqual([
      { name: "Saka", count: 1, minutes: ["90+4"] },
      { name: "Haaland", count: 2, minutes: ["12", "81"] },
      { name: "Isak", count: 1, minutes: [] },
    ]);
  });

  it("counts a reserve's returns once he is certain to come on, in his man's place, and never a reserve left on the bench", () => {
    const got = draftReturns(side([vuskovic, scorer]));
    expect(got.cleanSheets.map((r) => r.name)).toEqual(["Raya", "Vuskovic"]);
    expect(got.assists).toEqual([{ name: "Saka", count: 1, minutes: [] }]);
    expect(got.goals.map((r) => r.name)).not.toContain("Wissa");
  });
});

describe("draftRows", () => {
  it("lists the eleven with a reserve under the man he replaces, a nought for a man who played and none for one who has not", () => {
    const rows = draftRows(side([vuskovic]));
    expect(rows.slice(0, 3)).toEqual([
      { name: "Raya", slot: "G", points: 6, next: null, mark: null },
      { name: "Dunk", slot: "D", points: null, next: null, mark: "dnp" },
      { name: "Vuskovic", slot: "D", points: 6, next: null, mark: "sub" },
    ]);
    expect(rows.find((r) => r.name === "Rice")).toEqual({ name: "Rice", slot: "M", points: null, next: everton, mark: null });
    expect(rows.find((r) => r.name === "Odegaard")?.points).toBe(0);
  });

  it("lists a reserve still to play under his man, with his match", () => {
    const rows = draftRows(side([draftMan("Munoz", "D", null, 0, 1, { next: everton })]));
    expect(rows[2]).toEqual({ name: "Munoz", slot: "D", points: null, next: everton, mark: "sub" });
  });
});

describe("the line-up as a match report prints it", () => {
  it("sets the eleven out line by line, a reserve in brackets after his man, a man to come with his match", () => {
    expect(lineupText(draftRows(side([vuskovic])))).toBe("Raya 6; Dunk (Vuskovic 6), hD2 2, hD3 2, hD4 2; Saka 8, Rice (Everton, Mon), Odegaard 0, hM8 2; Haaland 13, Isak 4");
    expect(lineupText(draftRows(side([draftMan("Munoz", "D", null, 0, 1, { next: everton })])))).toContain("Dunk (Munoz, if he plays)");
  });

  it("puts the reserves who stayed on the bench underneath, with their points", () => {
    expect(benchText(draftBench(side([vuskovic, scorer])))).toBe("Wissa 5");
  });
});

describe("the page's words for a return and a row", () => {
  it("prints a scorer with his minutes, or his count when the feed did not time them", () => {
    expect([{ name: "Haaland", count: 2, minutes: ["12", "90+4"] }, { name: "Isak", count: 2, minutes: [] }, { name: "Raya", count: 1, minutes: [] }].map(returnText)).toEqual(["Haaland (12', 90+4')", "Isak 2", "Raya"]);
  });

  it("says a man did not play, or names his match to come, and a waiting reserve's only if he plays", () => {
    const row = { name: "Rice", slot: "M", points: null, next: everton, mark: null };
    expect(rowNote(row)).toBe("Mon v Everton (h)");
    expect(rowNote({ ...row, mark: "sub" })).toBe("Mon v Everton (h), if he plays");
    expect(rowNote({ ...row, next: null, mark: "dnp" })).toBe("did not play");
    expect(rowNote({ ...row, points: 6, next: null })).toBeNull();
  });
});
