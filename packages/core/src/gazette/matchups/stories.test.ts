import { describe, expect, it } from "vitest";
import { draftMan, goalAt } from "./__fixtures__/draftMan";
import { draftSide } from "./__fixtures__/draftSide";
import { worthOf } from "./__fixtures__/worth";
import { benchLines, clubLines, fitnessLine, lostCleanLine, minutesLine, newLine, scoredLine, subLine, uncoveredLine } from "./stories";
import type { DraftMan } from "./types";

const worth = worthOf();
const side = (men: DraftMan[], bench: DraftMan[] = []) => draftSide("Dons", 40, men, bench);

describe("a draft man's facts, each in its own line", () => {
  it("says what a man who returned scored, a late goal with its time, and nothing for a blank", () => {
    expect(scoredLine(draftMan("Isak", "F", 11, 90, 0, { goals: 1, assists: 1, scoredAt: [goalAt(90, 4)] }), worth)).toBe("hauled 11: a goal in added time (90+4) and an assist");
    expect(scoredLine(draftMan("Hall", "D", 8, 90, 0, { goals: 1, scoredAt: [goalAt(30)] }), worth)).toBe("got 8: a goal");
    expect(scoredLine(draftMan("Giles", "D", 1, 90), worth)).toBeNull();
  });

  it("calls a keeper's 8 or more a haul, and knows a keeper by the league's goalie slot, not a missing goal price", () => {
    expect(scoredLine(draftMan("Pickford", "G", 9, 90, 0, { cleanSheets: 1 }), worth)).toBe("hauled 9 in goal, a clean sheet among it");
    expect(scoredLine(draftMan("Hall", "D", 9, 90, 0, { goals: 1 }), { ...worth, returns: {}, keeper: "G" })).toBe("got 9: a goal");
  });

  it("tells a clean sheet lost late only where it was worth four and he had an hour", () => {
    expect(lostCleanLine(draftMan("Tarkowski", "D", 2, 90, 0, { concededFirstAt: [goalAt(88)] }), worth)).toBe("lost a clean sheet worth 4 points to a goal in the 88th minute");
    expect(lostCleanLine(draftMan("Gray", "M", 2, 90, 0, { concededFirstAt: [goalAt(88)] }), worth)).toBeNull();
    expect(lostCleanLine(draftMan("Tarkowski", "D", 1, 45, 0, { concededFirstAt: [goalAt(88)] }), worth)).toBeNull();
  });

  it("tells a man off the bench by his appearance point, and a starter off early by his minutes", () => {
    expect(minutesLine(draftMan("Hemmings", "M", 1, 18, 0, { started: false }))).toBe("did not start and played 18 minutes off the bench, 1 point for the appearance");
    expect(minutesLine(draftMan("Isidor", "F", 1, 22, 0, { started: true }))).toBe("went off after 22 minutes");
    expect(minutesLine(draftMan("Hume", "D", 1, 11))).toBe("played 11 minutes");
    expect(minutesLine(draftMan("Saka", "M", 2, 90, 0, { started: true }))).toBeNull();
  });

  it("tells a signing in place of his first time in the eleven, and Fantrax's word after his match", () => {
    expect(newLine(draftMan("Wissa", "F", 2, 90, 0, { arrived: "claim", debut: true }), side([]))).toBe("was signed by Dons this gameweek");
    expect(newLine(draftMan("Cunha", "F", 2, 90, 0, { arrived: "trade" }), side([]))).toBe("joined Dons in a trade this gameweek");
    expect(newLine(draftMan("Dorgu", "D", 2, 90, 0, { debut: true }), side([]))).toBe("was in Dons's eleven for the first time");
    expect(fitnessLine(draftMan("Millar", "M", null, 0, 0, { fitness: "knee" }))).toBe("did not play; since: knee");
    expect(fitnessLine(draftMan("Isak", "F", 1, 34, 0, { fitness: "groin" }))).toBe("since: groin");
  });

  it("puts what a substitute did in the line that brings him on", () => {
    const sub = { out: draftMan("Dunk", "D", null, 0, 0, { club: "Brighton" }), in: draftMan("Vuskovic", "D", 6, 90, 0, { club: "Brighton", cleanSheets: 1 }), provisional: false, ahead: null };
    expect(subLine(sub, "gameweek")).toBe("Vuskovic of Brighton replaced Dunk of Brighton, who did not play, and got 6: a clean sheet");
    expect(subLine(sub, "saturday")).toBe("Vuskovic of Brighton replaces Dunk of Brighton, who did not play, with 6: a clean sheet");
    expect(subLine({ ...sub, provisional: true }, "saturday")).toBe("Vuskovic of Brighton replaces Dunk of Brighton, who did not play, if he plays");
    expect(subLine({ ...sub, ahead: draftMan("Maguire", "D", null, 0, 1) }, "saturday")).toBe("Vuskovic of Brighton comes into the eleven at the end of the gameweek for a man who did not play; his points count whichever it is");
  });

  it("names a bench score of six or more whatever the margin, more so past the deficit, and a blank no reserve covered", () => {
    const bench = [draftMan("Star", "F", 9, 90, 0, { club: "Fulham" }), draftMan("Also", "F", 3, 90)];
    expect(benchLines(side([], bench), [], 5).map((b) => b.line)).toEqual(["Star of Fulham got 9 points on the bench"]);
    expect(benchLines(side([], bench), [], -5).map((b) => b.line)).toEqual(["Star of Fulham got 9 points on the bench, more than the margin"]);
    expect(uncoveredLine(draftMan("Foden", "M", null, 0, 0, { club: "Man City" }), side([]), "saturday")).toBe("Foden of Man City did not play and Dons have no reserve to replace him");
  });

  it("says one club's men all blanked or all kept clean sheets, and keeps no split line", () => {
    expect(clubLines(side([draftMan("Saliba", "D", 2, 90, 0, { club: "Arsenal" }), draftMan("Calafiori", "D", 1, 90, 0, { club: "Arsenal" })])).map((c) => c.line)).toEqual(["two Arsenal men, Saliba and Calafiori, both blanked"]);
    expect(clubLines(side([draftMan("Pickford", "G", 6, 90, 0, { club: "Everton", cleanSheets: 1 }), draftMan("Keane", "D", 1, 90, 0, { club: "Everton" })]))).toEqual([]);
  });
});
