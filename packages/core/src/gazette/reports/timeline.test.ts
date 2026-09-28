import { describe, expect, it } from "vitest";
import { codeOf, spursVilla } from "./__fixtures__/spursVilla";
import { played } from "./men";
import { finalScore, isGoal, manCounts, matchEvents } from "./timeline";

const match = spursVilla();
const events = matchEvents(match);
const man = (surname: string) => match.men.find((m) => m.code === codeOf(surname))!;

describe("reportMen on Tottenham 2-3 Aston Villa", () => {
  it("knows who started, who came on and when, and who went off injured", () => {
    expect(man("Porro")).toMatchObject({ side: "home", started: true, offAt: "19", injuredOff: true });
    expect(man("Gray")).toMatchObject({ side: "home", started: false, onAt: "19" });
    expect(man("Kudus")).toMatchObject({ started: false, onAt: "46" });
    expect(man("Manzambi")).toMatchObject({ side: "away", started: true, offAt: "72", injuredOff: false });
  });

  it("counts an unused substitute as not having played", () => {
    const unused = match.men.filter((m) => !played(m));
    expect(unused.length).toBeGreaterThan(0);
    expect(unused.every((m) => !m.started && m.onAt === null)).toBe(true);
  });
});

describe("matchEvents", () => {
  it("adds the goals up to the final score, in order", () => {
    expect(finalScore(events)).toEqual({ home: 2, away: 3 });
    expect(events.filter(isGoal).map((e) => `${e.minute} ${e.score?.home}-${e.score?.away}`)).toEqual([
      "45+4 0-1", "67 0-2", "79 0-3", "86 1-3", "90+8 2-3",
    ]);
  });

  it("gives each goal its side, its scorer and its maker", () => {
    const first = events.find(isGoal)!;
    expect(first).toMatchObject({ side: "away", man: { code: codeOf("Manzambi") }, other: { code: codeOf("Kamara") } });
  });

  it("works out the phrases for a stoppage-time minute", () => {
    expect(events.find(isGoal)?.phrases).toContain("four minutes into first-half added time");
  });

  it("puts gaps between moments on one clock, added time included", () => {
    const [, , , fourth, fifth] = events.filter(isGoal);
    expect(fifth.at - fourth.at).toBe(12);
  });
});

describe("manCounts", () => {
  const counts = manCounts(events, match.men);

  it("counts shots and shots on target from the commentary", () => {
    expect(counts.get(codeOf("Jackson"))).toMatchObject({ shots: 6, onTarget: 2 });
    expect(counts.get(codeOf("Manzambi"))).toMatchObject({ shots: 4 });
  });

  it("counts the chances a man made, and his set-piece deliveries", () => {
    expect(counts.get(codeOf("Robertson"))?.chancesMade).toBe(4);
    expect(counts.get(codeOf("Robertson"))?.deliveries).toBeGreaterThanOrEqual(1);
  });

  it("gives a man who played and did none of it noughts, not nothing", () => {
    expect(counts.get(codeOf("Wan-Bissaka"))).toEqual({ shots: 0, onTarget: 0, chancesMade: 0, woodwork: 0, deliveries: 0 });
  });
});
