import { describe, expect, it } from "vitest";
import { spursVilla } from "./__fixtures__/spursVilla";
import { derivedFacts } from "./derived";
import { minutePhrases } from "./minutes";
import { isGoal, matchEvents } from "./timeline";

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
