import { describe, expect, it } from "vitest";
import { strike, survivors } from "./headline";

const names = ["Aston Villa", "Villa", "Tottenham Hotspur", "Spurs", "Emiliano Buendía", "Manzambi"];

describe("strike", () => {
  it("strikes the forms the sports desk rejected on the first filed days", () => {
    expect(strike("Villa Leave It Late, Spurs Leave It Too", names)).toBe("two clauses");
    expect(strike("Palace hold firm as review does the trick", names)).toBe("an 'as' clause");
    expect(strike("Late double sinks Chelsea in west London", ["Chelsea"])).toBe("a tabloid verb");
    expect(strike("Villa end the wait at the Lane", names)).toBe("a banned phrase");
    expect(strike("A very long headline that simply runs on past eight words", names)).toBe("over eight words");
  });

  it("strikes a name the facts do not carry, and lets a clean one through", () => {
    expect(strike("Villa hold on for Emery", names)).toMatch(/a name the facts do not carry/);
    expect(strike("Villa undone by Šeško", names)).toBe("a name the facts do not carry: Šeško");
    expect(strike("Spurs stopped by Ødegaard", names)).toBe("a name the facts do not carry: Ødegaard");
    expect(strike("Manzambi marks the day for Villa", names)).toBeNull();
    expect(survivors(["Villa hold on, just", "Manzambi makes it Villa's day"], names)).toEqual(["Manzambi makes it Villa's day"]);
  });
});

describe("punBrief", () => {
  it("hands the pun writer the lead match's story, names and goals, and nothing that names a source", async () => {
    const { punBrief } = await import("./headline");
    const { deskDay } = await import("./desk");
    const { SPURS, VILLA, fixture, spursVilla } = await import("./__fixtures__/spursVilla");
    const [desk] = deskDay({ day: "2026-09-19", gameweek: 5, matches: [spursVilla()], season: [fixture], clubs: [SPURS, VILLA] });
    const brief = punBrief(desk, "Villa survive a late Spurs fightback");
    expect(brief).toContain("THE STORY: Villa survive a late Spurs fightback.");
    expect(brief).toContain("Emiliano Buendía (Aston Villa)");
    expect(brief).not.toMatch(/xG|FPL|Fantrax|%/u);
  });
});
