import { describe, expect, it } from "vitest";
import { buildElevenBrief, buildPowerBrief, buildWireBrief } from "./columns";
import type { Pick } from "../types";

const pick = (over: Partial<Pick> = {}): Pick => ({
  fantraxId: "fx1",
  playerName: "Cherki",
  playerCode: 1,
  clubId: 1,
  position: "M",
  ownerTeamId: "t1",
  ownerName: "test2",
  started: false,
  minutes: 81,
  goals: 2,
  assists: 0,
  cleanSheet: false,
  saves: 0,
  points: null,
  score: 200,
  ...over,
});

describe("buildPowerBrief", () => {
  it("tells the column it is not the table", () => {
    const brief = buildPowerBrief({
      gameweek: 3,
      rows: [{ teamId: "t1", name: "test2", rank: 1, record: "2-0-1", points: 6, scored: 123.5, round: "beat test3 by 13.6" }],
      threads: [],
    });
    expect(brief).toContain("it is not the table");
    expect(brief).toContain("test2 (id t1): table 1, record 2-0-1, 6 points, 123.5 scored, beat test3 by 13.6");
  });
});

describe("buildWireBrief", () => {
  it("frames a quiet week as one rather than inflating it", () => {
    const brief = buildWireBrief({
      gameweek: 3,
      facts: { teams: [], passedAround: [], binned: [], deals: 0 },
      named: (id) => id,
      threads: [],
    });
    expect(brief).toContain("0 deals in the window");
    expect(brief).toContain("say so plainly rather than inflating it");
    expect(brief).toContain("you report, you do not advise");
  });

  it("asks for obituaries only where somebody was actually binned", () => {
    const brief = buildWireBrief({
      gameweek: 3,
      facts: {
        teams: [{ teamId: "t1", claimed: 2, dropped: 1 }],
        passedAround: [{ playerName: "Nketiah", moves: 3, dropped: true }],
        binned: ["Nketiah"],
        deals: 4,
      },
      named: (id) => (id === "t1" ? "test2" : id),
      threads: [],
    });
    expect(brief).toContain("test2: 2 in, 1 out");
    expect(brief).toContain("Nketiah: moved 3 times, and is on the wire now");
    expect(brief).toContain("the obituaries");
  });
});

describe("the column briefs' counts", () => {
  it("says one deal and one save, not one deals and one saves", () => {
    expect(buildWireBrief({ gameweek: 3, facts: { teams: [], passedAround: [], binned: [], deals: 1 }, named: (id) => id, threads: [] })).toContain("1 deal in the window");
    expect(buildElevenBrief({ gameweek: 3, picks: [pick({ position: "G", goals: 0, saves: 1, minutes: 90 })], shape: "1-0-0-0", threads: [] })).toContain("1 save in 90 min");
  });
});

describe("buildElevenBrief", () => {
  it("marks the benched man as the story, and asks for a column rather than a list", () => {
    const brief = buildElevenBrief({
      gameweek: 3,
      picks: [pick(), pick({ playerName: "Haaland", started: true, ownerName: "123" })],
      shape: "1-4-4-2",
      threads: [],
    });
    expect(brief).toContain("BENCHED by his own manager");
    expect(brief).toContain("lining up 1-4-4-2");
    // An argument for the side, never a caption per man.
    expect(brief).not.toContain("caption per man");
    expect(brief).toContain("No man gets his own sentence in turn");
  });
});
