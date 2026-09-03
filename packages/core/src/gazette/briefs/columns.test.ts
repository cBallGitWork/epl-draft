import { describe, expect, it } from "vitest";
import {
  buildDodgersBrief,
  buildElevenBrief,
  buildPowerBrief,
  buildPredictionsBrief,
  buildWireBrief,
} from "./columns";
import type { Pick, StoryResult } from "../types";

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
  score: 200,
  ...over,
});

const result: StoryResult = {
  winner: { teamId: "t1", name: "test2", points: 45 },
  loser: { teamId: "t2", name: "test3", points: 31.4 },
  margin: 13.6,
};

describe("buildPredictionsBrief", () => {
  const brief = buildPredictionsBrief({
    gameweek: 3,
    ties: [
      { homeTeamId: "a", homeName: "test2", awayTeamId: "b", awayName: "test3", homeProjected: 41.5, awayProjected: null },
    ],
    marked: { right: 5, called: 8 },
    threads: [],
  });

  it("hands over the projections with their ids, and absence as a dash", () => {
    expect(brief).toContain("test2 (id a) v test3 (id b): Fantrax projects 41.5 to —");
  });

  it("insists a projection is not a score, and makes him own last week", () => {
    expect(brief).toContain("a projection is not a score");
    expect(brief).toContain("you called 5 of 8");
  });

  it("says nothing about a record it does not have", () => {
    const first = buildPredictionsBrief({ gameweek: 1, ties: [], marked: null, threads: [] });
    expect(first).not.toContain("YOUR LAST COLUMN");
  });
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

describe("buildDodgersBrief", () => {
  const brief = buildDodgersBrief({ gameweek: 3, benched: [pick()], threads: [] });

  it("names the man and the manager who benched him", () => {
    expect(brief).toContain("Cherki (M), left out by test2: 2G in 81 min");
  });

  it("refuses the invented number a bench column most wants", () => {
    // A benched player is priced nowhere in any payload, so "he'd have got you
    // 11" would be ours rather than Fantrax's.
    expect(brief).toContain("never what he would have scored");
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
    // It asked for "ONE caption per man" until 3 Sep 2026 and Craig cut them:
    // eleven one-sentence verdicts written from a name, a slot and a stat line
    // have nowhere to go but the stat and a flourish.
    expect(brief).not.toContain("caption per man");
    expect(brief).toContain("No man gets his own sentence in turn");
  });
});
