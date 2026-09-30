import { describe, expect, it } from "vitest";
import { CUPS, type Cup } from "./declared";
import { cupGroups, cupPlan } from "./plan";

const cup = (id: string): Cup => {
  const found = CUPS.find((declared) => declared.id === id);
  if (!found) throw new Error(`no cup ${id}`);
  return found;
};

const outline = (stages: ReturnType<typeof cupPlan>) => stages.map((stage) => `GW${stage.gameweek} ${stage.name}`);

describe("cupPlan", () => {
  it("lays the Timbeibs Cup out for ten, winners' round first when two share a week", () => {
    expect(outline(cupPlan(cup("timbeibs"), 10))).toEqual([
      "GW10 Round 1",
      "GW11 Round 2",
      "GW12 Losers' round 1",
      "GW13 Round 3",
      "GW13 Losers' round 2",
      "GW14 Losers' round 3",
      "GW15 Winners' final",
      "GW15 Losers' round 4",
      "GW16 Losers' final",
      "GW17 Final",
    ]);
  });

  it("numbers every knockout tie in playing order and names later sides by those numbers", () => {
    const stages = cupPlan(cup("timbeibs"), 10);
    // Craig, 30 Sep: rounds 1 and 2 are drawn at random, so no seed is printed in them.
    expect(stages[0]?.fixtures).toEqual([
      { code: "M1", home: "To be drawn", away: "To be drawn" },
      { code: "M2", home: "To be drawn", away: "To be drawn" },
    ]);
    expect(stages[1]?.fixtures[0]).toEqual({ code: "M3", home: "To be drawn", away: "To be drawn" });
    expect(stages[2]?.fixtures[0]).toEqual({ code: "M7", home: "Loser M1", away: "Loser M6" });
    // Numbered in the order they are played: the winners' final (GW15) is M15, the losers' (GW16) M17.
    expect(stages.at(-1)?.fixtures).toEqual([{ code: "M18", home: "Winner M15", away: "Winner M17" }]);
    expect(stages.flatMap((stage) => stage.fixtures)).toHaveLength(18);
  });

  it("lays the Davy Propper Cup out as five group matchdays, then a knockout to GW30", () => {
    const stages = cupPlan(cup("davy-propper"), 10);
    expect(outline(stages)).toEqual([
      "GW22 Groups · matchday 1",
      "GW23 Groups · matchday 2",
      "GW24 Groups · matchday 3",
      "GW25 Groups · matchday 4",
      "GW26 Groups · matchday 5",
      "GW28 Quarter-finals",
      "GW29 Semi-finals",
      "GW30 Final",
    ]);
    expect(stages[0]?.fixtures).toHaveLength(4);
    expect(stages[0]?.fixtures.every((fixture) => fixture.code === null)).toBe(true);
    expect(stages[5]?.fixtures).toEqual([
      { code: "M1", home: "2nd B", away: "3rd A" },
      { code: "M2", home: "2nd A", away: "3rd B" },
    ]);
    expect(stages[6]?.fixtures).toEqual([
      { code: "M3", home: "1st A", away: "Winner M1" },
      { code: "M4", home: "1st B", away: "Winner M2" },
    ]);
  });

  it("splits an odd league unevenly, the first group taking the spare", () => {
    const groups = cupPlan(cup("davy-propper"), 7).filter((stage) => stage.name.startsWith("Groups"));
    const sides = new Set(groups.flatMap((stage) => stage.fixtures.flatMap((fixture) => [fixture.home, fixture.away])));
    expect([...sides].sort()).toEqual(["A1", "A2", "A3", "A4", "B1", "B2", "B3"]);
  });

  it("has nothing to play for a league of one", () => {
    expect(cupPlan(cup("timbeibs"), 1)).toEqual([]);
  });

  it("puts each stage on its side of the draw, the double final closing the winners' side", () => {
    const sides = (id: string) => cupPlan(cup(id), 10).map((stage) => stage.side);
    expect(sides("timbeibs")).toEqual(["winners", "winners", "losers", "winners", "losers", "losers", "winners", "losers", "losers", "winners"]);
    expect(sides("davy-propper")).toEqual(["groups", "groups", "groups", "groups", "groups", "winners", "winners", "winners"]);
  });
});

describe("cupGroups", () => {
  it("draws slots for a group cup and none for a straight knockout", () => {
    expect(cupGroups(cup("davy-propper"), 10)).toEqual([
      ["A1", "A2", "A3", "A4", "A5"],
      ["B1", "B2", "B3", "B4", "B5"],
    ]);
    expect(cupGroups(cup("timbeibs"), 10)).toEqual([]);
  });
});
