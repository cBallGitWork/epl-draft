import { describe, expect, it } from "vitest";
import { rulesCard, scoredSlots } from "./rulesCard";
import type { LeagueScoring } from "./scoring";

// A cut of the real league's rules as getLeagueInfo sent them on 6 Oct 2026.
const minutes = {
  bands: [
    { from: 1, to: 59, points: 1, every: null },
    { from: 60, to: 90, points: 2, every: null },
  ],
  cumulative: false,
};
const perTwo = { bands: [{ from: 1, to: 99, points: -1, every: 2 }], cumulative: true };
const scoring: LeagueScoring = {
  rules: {
    goaliePosition: "G",
    goalie: { G: { Default: 10 }, AT: { Default: 3 }, Min: { Default: minutes }, GA: { Default: perTwo }, YC: { Default: -1 } },
    outfield: {
      G: { D: 6, F: 4, Default: 0, M: 5 },
      AT: { Default: 3 },
      Min: { Default: minutes },
      GAO: { D: perTwo, Default: 0 },
      YC: { Default: -1 },
      CLRA: { Default: 0 },
      Pen: { D: 0, F: 0, G: 0, Default: 0, M: 0 },
    },
  },
  categories: {
    "5020#1": { code: "G", name: "Goals", longCode: "INDIVIDUAL_GOALS" },
    "5020#2": { code: "AT", name: "Assists (Total)", longCode: "INDIVIDUAL_ASSISTS_TOTAL" },
    "5020#3": { code: "Min", name: "Minutes Played", longCode: "INDIVIDUAL_MINUTES_PLAYED" },
    "5020#4": { code: "GA", name: "Goals Against", longCode: "INDIVIDUAL_GOALS_AGAINST" },
    "5010#5": { code: "GAO", name: "Goals Against Outfielders ", longCode: null },
    "5020#6": { code: "YC", name: "Yellow Cards", longCode: "INDIVIDUAL_YELLOW_CARDS" },
  },
};

describe("rulesCard", () => {
  const slots = ["G", "D", "M", "F"];
  const card = rulesCard(scoring, slots);

  it("names the slots the rules price, the keeper's letter first and never `Default`", () => {
    expect(scoredSlots(scoring.rules).sort()).toEqual(["D", "F", "G", "M"]);
  });

  it("prices a rule that differs by slot once per slot", () => {
    expect(card.find((line) => line.name === "Goals")).toMatchObject({ same: false, prices: [["+10"], ["+6"], ["+5"], ["+4"]] });
  });

  it("prints a rule every slot shares once", () => {
    expect(card.find((line) => line.name === "Assists")).toMatchObject({ same: true, prices: [["+3"], ["+3"], ["+3"], ["+3"]] });
  });

  it("writes bands as ranges, the top one open, and a stacking band per count", () => {
    expect(card.find((line) => line.name === "Minutes")?.prices[0]).toEqual(["1–59: +1", "60+: +2"]);
    expect(card.find((line) => line.name === "Goals conceded")?.prices).toEqual([["-1 per 2"], ["-1 per 2"], ["—"], ["—"]]);
  });

  it("drops a category that pays nobody anything", () => {
    expect(card.map((line) => line.name)).not.toContain("CLRA");
    expect(card.map((line) => line.name)).not.toContain("Pen");
  });

  it("lists what a slot earns before what it costs", () => {
    expect(card.at(-1)?.name).toBe("Yellow cards");
    expect(card.findIndex((line) => line.name === "Goals conceded")).toBeGreaterThan(card.findIndex((line) => line.name === "Minutes"));
  });
});
