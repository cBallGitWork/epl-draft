import { describe, expect, it } from "vitest";
import { spursVilla } from "./__fixtures__/spursVilla";
import { derivedFacts } from "./derived";
import { minutePhrases } from "./minutes";
import { isGoal, matchEvents } from "./timeline";
import { ENZO, HAVERTZ, PALMER, SAKA, figures, matchInput, moment } from "./__fixtures__/built";
import type { PlMoment } from "../../football/premierleague/moments";
import type { ReportMatchInput } from "./types";

describe("derivedFacts on Tottenham 2-3 Aston Villa", () => {
  const match = spursVilla();
  const facts = derivedFacts(match, matchEvents(match));

  it("says Villa were three up with 11 minutes left, higher score first", () => {
    expect(facts).toContain("Aston Villa were 3-0 up with 11 minutes left");
  });

  it("finds Tottenham's two late goals and when the clean sheet went", () => {
    expect(facts).toContain("Tottenham Hotspur scored twice in 12 minutes");
    expect(facts).toContain("Aston Villa's clean sheet went four minutes from time");
  });

  it("never calls 3-2 from 3-0 a comeback, and finds no late winner", () => {
    expect(facts.some((f) => f.includes("came from behind"))).toBe(false);
    expect(facts.some((f) => f.includes("winner"))).toBe(false);
  });

  it("puts the ball in words and the chances in counts", () => {
    expect(facts).toContain("Tottenham Hotspur had most of the ball");
    expect(facts).toContain("Tottenham Hotspur made four clear chances and took two");
    expect(facts.join(" ")).not.toMatch(/%|\b64\b/);
  });

  it("never calls two goals either side of half-time a burst", () => {
    // 45+3 and 50 are two minutes apart on the clock and twenty in the match.
    const events = matchEvents(match);
    const [first, second] = events.filter((event) => isGoal(event) && event.side === "home");
    const moved = events.map((event) =>
      event === first ? { ...event, minute: "45+3", at: 48, half: 1 as const } : event === second ? { ...event, minute: "50", at: 50, half: 2 as const } : event);
    expect(derivedFacts(match, moved).filter((fact) => fact.startsWith("Tottenham Hotspur scored twice"))).toEqual([]);
  });

  it("tells a clean sheet as lost late from the minute a goal is late, never earlier", () => {
    const events = matchEvents(match);
    const first = events.find((event) => isGoal(event) && event.side === "home");
    const at = (minute: number) => derivedFacts(match, events.map((event) => (event === first ? { ...event, minute: String(minute), at: minute, phrases: minutePhrases(String(minute)) } : event)));
    expect(at(77).filter((fact) => fact.includes("clean sheet"))).toEqual([]);
    expect(at(80)).toContain("Aston Villa's clean sheet went 10 minutes from time");
  });
});

describe("derivedFacts on a made-up match", () => {
  const facts = (moments: PlMoment[], score: [number, number], sides: ReportMatchInput["figures"] = null) => {
    const match = matchInput([SAKA, HAVERTZ, PALMER, ENZO], moments, score, sides);
    return derivedFacts(match, matchEvents(match));
  };

  it("tells a winner in the 90th minute by its minute, never as nought minutes left", () => {
    const told = facts([moment("90", "goal", [1, null])], [1, 0]);
    expect(told).toContain("the winner came in the 90th minute");
    expect(told.join(" ")).not.toContain("nought");
  });

  it("says one minute, not one minutes, and tells three quick goals as one burst", () => {
    expect(facts([moment("20", "goal", [1, null]), moment("21", "goal", [2, null])], [2, 0])).toContain("Arsenal scored twice in one minute");
    const three = facts([moment("20", "goal", [1, null]), moment("21", "goal", [2, null]), moment("23", "goal", [1, null])], [3, 0]);
    expect(three.filter((fact) => fact.startsWith("Arsenal scored"))).toEqual(["Arsenal scored three times in three minutes"]);
  });

  it("never counts an own goal towards a side's conversion of its shots on target", () => {
    const told = facts([moment("10", "own-goal", [4, null]), moment("20", "goal", [1, null])], [2, 0], { home: figures({ onTarget: 2 }), away: figures() });
    expect(told).toContain("Arsenal scored one from two on target");
  });
});
