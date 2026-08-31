import { describe, expect, it } from "vitest";
import { buildFixturePreviewBrief } from "./fixturePreview";
import { buildTieCallBrief } from "./tieCall";

describe("buildTieCallBrief", () => {
  it("frames both tiers as a call the paper is making, never a result", () => {
    const settled = buildTieCallBrief({
      gameweek: 3, homeName: "test2", awayName: "test3",
      homePoints: 50, awayPoints: 30, homeToPlay: 2, awayToPlay: 0,
      state: "settled", threads: [],
    });
    expect(settled).toContain("nobody left");
    expect(settled).toContain("never as a final result");

    const probable = buildTieCallBrief({
      gameweek: 3, homeName: "test2", awayName: "test3",
      homePoints: 50, awayPoints: 30, homeToPlay: 2, awayToPlay: 1,
      state: "probable", threads: [],
    });
    expect(probable).toContain("calling it");
    expect(probable).toContain("Never write it as a result");
  });

  it("says when the men left are unknown rather than counting a nought", () => {
    const brief = buildTieCallBrief({
      gameweek: 3, homeName: "a", awayName: "b",
      homePoints: 50, awayPoints: 30, homeToPlay: null, awayToPlay: 0,
      state: "settled", threads: [],
    });
    expect(brief).toContain("a: men still to play unknown");
  });
});

describe("buildFixturePreviewBrief", () => {
  const brief = buildFixturePreviewBrief({
    gameweek: 3,
    home: "Arsenal",
    away: "Aston Villa",
    kickoff: "Mon 20:00",
    duels: [
      {
        homeName: "test2", awayName: "test3", homePoints: 41, awayPoints: 39,
        homeMen: ["Saka"], awayMen: ["Watkins", "Martínez"],
      },
    ],
    watching: [{ owner: "test4", men: ["Gabriel"] }],
    threads: [],
  });

  it("hands the writer the duel, both rosters' men, and the rooting interests", () => {
    expect(brief).toContain("Arsenal v Aston Villa, kick-off Mon 20:00");
    expect(brief).toContain("test2 41 v 39 test3, still open");
    expect(brief).toContain("test2 has in this match: Saka");
    expect(brief).toContain("test3 has in this match: Watkins, Martínez");
    expect(brief).toContain("test4: Gabriel");
  });

  it("forbids the one thing a preview will try: a result", () => {
    expect(brief).toContain("must not predict a result");
  });
});
