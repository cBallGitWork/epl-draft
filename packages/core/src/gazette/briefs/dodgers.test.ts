import { describe, expect, it } from "vitest";
import type { Dodger } from "../dodgers";
import { buildDodgersBrief } from "./dodgers";

const dodger = (over: Partial<Dodger> = {}): Dodger => ({
  playerName: "Haaland", playerCode: 1, clubId: 1, position: "F", ownerTeamId: "t1", ownerName: "test2", minutes: 90,
  goals: 0, assists: 0, cleanSheet: false, misses: [], shots: 0, onTarget: 0, inBox: 0, close: 0, chancesMade: 0, chancesInBox: 0, nearness: 1, ...over,
});

describe("buildDodgersBrief", () => {
  it("tells each near miss with its minutes, then the shots and chances", () => {
    const brief = buildDodgersBrief({
      gameweek: 5,
      dodgers: [dodger({ misses: [{ kind: "woodwork", minute: "34" }, { kind: "woodwork", minute: "77" }, { kind: "ruled-out", minute: "61" }], shots: 6, onTarget: 3, inBox: 4, close: 2, chancesMade: 1, chancesInBox: 1 })],
      threads: [],
    });
    expect(brief).toContain("- Haaland (F), owned by test2: a goal ruled out (61 min); hit the woodwork (34 min, 77 min); 6 shots, 4 from inside the box, 2 of them from close range, 3 on target, no goal; set up 1 shot for others, 1 from inside the box, no assist; 90 min played");
  });

  it("says nothing of the box when no shot came from inside it", () => {
    const brief = buildDodgersBrief({ gameweek: 5, dodgers: [dodger({ shots: 3, onTarget: 1 })], threads: [] });
    expect(brief).toContain("owned by test2: 3 shots, 1 on target, no goal; 90 min played");
  });

  it("tells a clean sheet lost late by its minute, with no shots to count", () => {
    const brief = buildDodgersBrief({ gameweek: 5, dodgers: [dodger({ position: "D", misses: [{ kind: "clean-sheet-lost", minute: "88" }] })], threads: [] });
    expect(brief).toContain("(D), owned by test2: his side's only goal against, the one that cost him a clean sheet (88 min); 90 min played");
  });

  it("tells an assist dodged beside the goal he did score, and never his shots", () => {
    const brief = buildDodgersBrief({ gameweek: 5, dodgers: [dodger({ goals: 1, shots: 4, chancesMade: 5, chancesInBox: 3 })], threads: [] });
    expect(brief).toContain("owned by test2: set up 5 shots for others, 3 from inside the box, no assist; he did get 1 goal; 90 min played");
  });

  it("never asks for the points a miss would have been worth", () => {
    expect(buildDodgersBrief({ gameweek: 5, dodgers: [dodger()], threads: [] })).toContain("Never say what any of them would have scored");
  });
});
