import { describe, expect, it } from "vitest";
import type { FormGame, FormResult } from "../../league/form";
import { gameweekForm, type SideResult } from "./form";

const games = (results: string, pointsFor = 30): FormGame[] =>
  results.split("").map((r, i) => ({ period: i + 1, result: r as FormResult, pointsFor, pointsAgainst: r === "W" ? pointsFor - 5 : r === "L" ? pointsFor + 5 : pointsFor }));
const side = (teamId: string, forPts: number, against: number): SideResult => ({ teamId, name: teamId, opponent: "Rivals", for: forPts, against });
const kinds = (facts: ReturnType<typeof gameweekForm>) => facts.map((f) => `${f.kind}: ${f.text}`);
/** Only the streak and form facts, where a case is not about records. */
const runs = (facts: ReturnType<typeof gameweekForm>) => kinds(facts.filter((f) => !["record", "season-high", "season-low"].includes(f.kind)));

describe("gameweekForm", () => {
  it("names a streak of three and a run of four unbeaten with a draw in it", () => {
    expect(runs(gameweekForm([side("Dons", 40, 30)], new Map([["Dons", games("LWW", 60)]])))).toEqual(["streak: Dons have won 3 in a row"]);
    expect(runs(gameweekForm([side("Dons", 40, 30)], new Map([["Dons", games("WDW", 60)]])))).toEqual(["streak: Dons are 4 without defeat"]);
  });

  it("says when a run ends, and when a win ends three rounds without one", () => {
    expect(runs(gameweekForm([side("Dons", 30, 40)], new Map([["Dons", games("WWW", 60)]])))).toEqual(["streak-ended: Dons' run of 3 wins ended against Rivals"]);
    expect(runs(gameweekForm([side("Dons", 40, 30)], new Map([["Dons", games("LLD", 60)]])))).toEqual(["return-to-form: Dons won for the first time in 4 gameweeks"]);
  });

  it("claims a season record only from the fourth round, and a side's own high after three of its own", () => {
    const season = new Map([["Dons", games("WLW", 30)], ["Other", games("LWL", 35)]]);
    expect(kinds(gameweekForm([side("Dons", 50, 20)], season))).toEqual([
      "record: 50 is the season's highest score",
      "record: Dons' 30-point win is the season's biggest",
      "season-high: 50 is Dons' highest score this season",
    ]);
    expect(kinds(gameweekForm([side("Dons", 50, 20)], new Map([["Dons", games("WL", 30)]])))).toEqual([]);
  });

  it("gives the season's highest score and biggest win to one side only, when two in one gameweek pass the old best", () => {
    const season = new Map([["Dons", games("WLW", 30)], ["Reds", games("LWL", 30)]]);
    const records = gameweekForm([side("Dons", 50, 20), side("Reds", 60, 25)], season).filter((f) => f.kind === "record");
    expect(records.map((f) => `${f.teamId}: ${f.text}`)).toEqual(["Reds: 60 is the season's highest score", "Reds: Reds' 35-point win is the season's biggest"]);
  });
});
