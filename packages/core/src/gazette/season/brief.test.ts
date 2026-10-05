import { describe, expect, it } from "vitest";
import { buildSeasonBrief } from "./brief";
import { seasonCalls, type SeasonCalls } from "./calls";
import { PLAYED, SQUADS } from "./__fixtures__/season";

const calls = seasonCalls(PLAYED, SQUADS, 2) as SeasonCalls;
const schedule = { from: 6, to: 34, empty: [21], doubles: [34], places: 2 };
const slotName = (slot: string) => ({ G: "the goalkeeper", D: "the defenders", M: "the midfielders", F: "the forwards" })[slot] ?? slot;
const brief = buildSeasonBrief({ calls, schedule, locksAt: "2026-10-10T11:15:00.000Z", slotName });

describe("buildSeasonBrief", () => {
  it("gives every call already made, the title, the playoff places, the spoon and the bold call", () => {
    expect(brief).toContain("THE TITLE: Albion, top. Their strength: the defenders, the best in the league. The nearest to them: United, second, and it is not close.");
    expect(brief).toContain("THE PLAYOFF 2, top to bottom: Albion, United. 3rd and missing out: City, and not by a little.");
    expect(brief).toContain("THE WOODEN SPOON: Rovers, 4th.");
    expect(brief).toContain("THE BOLD CALL: Bukayo Saka (Arsenal), taken by Albion as the 7th man of the draft, will outscore 4 of the first 4 men taken.");
  });

  it("states the season off the schedule, in gameweeks, and the first lock in London", () => {
    expect(brief).toContain("Head to head from gameweek 6 to gameweek 34, none in gameweek 21, two each in gameweek 34, then the top 2 go into the playoffs.");
    expect(brief).toContain("12:15 on Saturday 10 October");
    expect(brief).not.toMatch(/\b(?:this|the|a|first|second|third|late|early) round\b|\brounds\b/iu);
  });

  it("lists the table in the desk's order, two facts a side and what to open on", () => {
    const table = brief.slice(brief.indexOf("YOUR TABLE"));
    expect(table.indexOf("1. Albion [a]")).toBeLessThan(table.indexOf("2. United [u]"));
    expect(table).toContain("- Built round: Erling Haaland (Manchester City), the first man they took, 2nd in the whole draft.");
    expect(table).toContain("- Weak spot: the goalkeeper, the weakest in the league.");
    expect(table).toContain("- Weak spot: Bruno Fernandes is injured.");
    expect(table).toContain("- Open the line on the weak spot.");
  });

  it("prints no figure of ours: no man's points and no count of playings", () => {
    for (const figure of ["200", "210", "70", "98", "1.4"]) expect(brief).not.toContain(figure);
  });
});
