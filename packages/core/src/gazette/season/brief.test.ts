import { describe, expect, it } from "vitest";
import { buildSeasonBrief } from "./brief";
import { seasonCalls, type SeasonCalls } from "./calls";
import { PLAYED, SQUADS } from "./__fixtures__/season";

const calls = seasonCalls(PLAYED, SQUADS, []) as SeasonCalls;
const slotName = (slot: string) => ({ G: "the goalkeeper", D: "the defenders", M: "the midfielders", F: "the forwards" })[slot] ?? slot;
const brief = buildSeasonBrief({ calls, locksAt: "2026-10-10T11:15:00.000Z", slotName });

describe("buildSeasonBrief", () => {
  it("frames the column as a ranking of squads as drafted, with the first lock in London", () => {
    expect(brief).toContain("LAWRO'S POWER RANKINGS.");
    expect(brief).toContain("12:15 on Saturday 10 October");
    expect(brief).toContain("You rank the 4 squads as drafted, strongest first, as they stand today.");
  });

  it("gives the opening the strongest squad, the weakest and whether anybody is clear", () => {
    expect(brief).toContain(
      "THE SQUADS AS DRAFTED, for your opening: One squad is clear of the rest. The strongest squad: Albion. Its strength: the defenders, the best in the league. The weakest: Rovers. Its weak spot: the forwards, the weakest in the league.",
    );
  });

  it("lists the rankings in the desk's order, two facts a side and what to open on", () => {
    const table = brief.slice(brief.indexOf("YOUR RANKINGS"));
    expect(table.indexOf("1. Albion [a]")).toBeLessThan(table.indexOf("2. United [u]"));
    expect(table).toContain("- Built round: Erling Haaland (Manchester City), the first man they took, 2nd in the whole draft.");
    expect(table).toContain("- Weak spot: the goalkeeper, the weakest in the league.");
    expect(table).toContain("- Weak spot: Bruno Fernandes is injured.");
    expect(table).toContain("- Open the line on the weak spot.");
  });

  it("says nothing of how a season ends, prints no figure of ours and no draft round", () => {
    for (const word of ["playoff", "title", "finish", "spoon", "prize", "£", "predict", "season"]) expect(brief.toLowerCase()).not.toContain(word);
    for (const figure of ["200", "210", "70", "1.4"]) expect(brief).not.toContain(figure);
    expect(brief).not.toMatch(/\b(?:this|the|a|first|second|third|late|early) round\b|\brounds\b/iu);
  });
});
