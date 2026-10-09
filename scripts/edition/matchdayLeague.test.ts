import { describe, expect, it } from "vitest";
import type { PlayerStory } from "@epl/core";
import type { DeskFacts } from "./facts";
import { firstStoryAfter, leagueJoin } from "./matchdayLeague";

const story = (headline: string, at: string): PlayerStory => ({ id: headline, headline, content: "", analysis: null, at: Date.parse(at) });
const KICKOFF = "2026-09-26T14:00:00Z";
const stories = [story("before", "2026-09-26T09:00:00Z"), story("late", "2026-09-28T09:00:00Z"), story("first", "2026-09-26T18:00:00Z"), story("stale", "2026-10-05T09:00:00Z")];

describe("firstStoryAfter", () => {
  it("is the first story after the kickoff, within a few days of it", () => {
    expect(firstStoryAfter(stories, KICKOFF)).toBe("first");
    expect(firstStoryAfter([stories[0], stories[3]], KICKOFF)).toBeNull();
  });

  it("stops at a cut-off, so a report never reads what was published after it", () => {
    expect(firstStoryAfter(stories, KICKOFF, Date.parse("2026-09-26T17:00:00Z"))).toBeNull();
  });
});

describe("leagueJoin's stake", () => {
  const team = (teamId: string) => ({ teamId, name: teamId });
  const man = { slot: { fantraxId: "f1", status: "ACTIVE" }, player: { code: 101 } };
  const facts = {
    pairings: [
      { home: team("A"), away: team("B") },
      { home: team("C"), away: team("A") },
    ],
    scores: new Map([["A", { points: 40 }], ["B", { points: 30 }], ["C", { points: 50 }]]),
    teams: [{ teamId: "A", teamName: "A", players: [man] }],
    playerPoints: new Map(),
    pedigree: new Map(),
  } as unknown as DeskFacts;

  it("keeps both ties of a double header", () => {
    const { holders } = leagueJoin(facts, [], new Map());
    expect(holders.get(101)?.h2h).toEqual([
      { opponent: "B", us: 40, them: 30, over: false },
      { opponent: "C", us: 40, them: 50, over: false },
    ]);
  });
});
