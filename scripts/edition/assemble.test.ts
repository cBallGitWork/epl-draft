import { describe, expect, it } from "vitest";
import type { Assignment, Fixture, ResolvedPlayer, RosteredTeam } from "@epl/core";
import { faceOf } from "./faces";
import type { RoundFacts } from "./facts";

// **The picture is the desk's choice and not the writer's.** These assert who
// gets photographed, which is a selection rule with a wrong answer: a face that
// disagrees with the prose reads as an error nobody can see is one, and a face
// picked by naming a man is a model choosing the photograph — the one thing
// `gazette/strangers.ts` exists to catch it doing.

const man = (
  fantraxId: string,
  name: string,
  over: { position?: string; status?: string; clubId?: number; code?: number } = {},
): ResolvedPlayer =>
  ({
    slot: {
      fantraxId,
      position: over.position ?? "M",
      status: over.status ?? "ACTIVE",
    },
    player: {
      id: 1,
      code: over.code ?? 100,
      name,
      clubId: over.clubId ?? 1,
    },
    stats: [],
  }) as unknown as ResolvedPlayer;

const team = (teamId: string, players: ResolvedPlayer[]): RosteredTeam =>
  ({ teamId, teamName: teamId, players }) as unknown as RosteredTeam;

const facts = (over: Partial<RoundFacts> = {}): RoundFacts =>
  ({
    pairings: [],
    scores: new Map(),
    projected: new Map(),
    teams: [],
    playerPoints: new Map(),
    eleven: null,
    fielded: true,
    business: [],
    doubts: [],
    pedigree: new Map(),
    table: [],
    news: [],
    ...over,
  }) as unknown as RoundFacts;

const tieReport = (home: string, away: string): Assignment => ({
  kind: "tie-report",
  key: `tie-report:p1:${home}v${away}`,
  slug: `p1-report-${home}v${away}`,
  tie: { homeTeamId: home, awayTeamId: away },
});

const NO_FIXTURES: readonly Fixture[] = [];

describe("faceOf", () => {
  it("photographs the highest scorer across BOTH sides of a tie, not the winner's", () => {
    // The man of the tie can be on the losing side, and usually the story is
    // that he was: a haul that still lost is the piece worth reading.
    const ctx = {
      facts: facts({
        teams: [team("a", [man("1", "Winner")]), team("b", [man("2", "Loser")])],
        playerPoints: new Map([
          ["1", 8],
          ["2", 14],
        ]),
      }),
      fixtures: NO_FIXTURES,
    };
    expect(faceOf(tieReport("a", "b"), ctx)?.name).toBe("Loser");
  });

  it("carries the roster SLOT he was filed in, never a position off the player", () => {
    const ctx = {
      facts: facts({
        teams: [team("a", [man("1", "Saka", { position: "M" })])],
        playerPoints: new Map([["1", 8]]),
      }),
      fixtures: NO_FIXTURES,
    };
    // Saka is F,M in the pool. What the picture is told is the slot his manager
    // filed him at, which is also what Fantrax paid him at.
    expect(faceOf(tieReport("a", "b"), ctx)?.position).toBe("M");
  });

  it("never photographs a reserve", () => {
    // A bench cannot score, so he cannot be the man of anything — and a reserve
    // Fantrax still priced would otherwise outrank a starter who blanked.
    const ctx = {
      facts: facts({
        teams: [
          team("a", [
            man("1", "Bench", { status: "RESERVE" }),
            man("2", "Starter", { status: "ACTIVE" }),
          ]),
        ],
        playerPoints: new Map([
          ["1", 20],
          ["2", 3],
        ]),
      }),
      fixtures: NO_FIXTURES,
    };
    expect(faceOf(tieReport("a", "b"), ctx)?.name).toBe("Starter");
  });

  it("withholds a man Fantrax has not priced rather than reading him as nought", () => {
    const ctx = {
      facts: facts({
        teams: [team("a", [man("1", "Unpriced"), man("2", "Priced")])],
        playerPoints: new Map([["2", 1]]),
      }),
      fixtures: NO_FIXTURES,
    };
    expect(faceOf(tieReport("a", "b"), ctx)?.name).toBe("Priced");
  });

  it("prints no picture when nobody in the tie was priced", () => {
    const ctx = {
      facts: facts({ teams: [team("a", [man("1", "Nobody")])] }),
      fixtures: NO_FIXTURES,
    };
    expect(faceOf(tieReport("a", "b"), ctx)).toBeNull();
  });

  it("breaks a tie on points by name, so the same round picks the same man twice", () => {
    const ctx = {
      facts: facts({
        teams: [team("a", [man("1", "Zidane"), man("2", "Ardiles")])],
        playerPoints: new Map([
          ["1", 9],
          ["2", 9],
        ]),
      }),
      fixtures: NO_FIXTURES,
    };
    expect(faceOf(tieReport("a", "b"), ctx)?.name).toBe("Ardiles");
  });

  it("gives no face to a kind with no man in it", () => {
    // A power ranking is about ten managers and a wire column about a market.
    // Null is the honest answer, and the page prints no picture rather than a
    // borrowed one.
    const ctx = { facts: facts(), fixtures: NO_FIXTURES };
    const ranking: Assignment = {
      kind: "power-ranking",
      key: "power-ranking:gw1",
      slug: "gw1-power-ranking",
    };
    expect(faceOf(ranking, ctx)).toBeNull();
  });
});
