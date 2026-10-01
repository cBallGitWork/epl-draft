import { describe, expect, it } from "vitest";
import type { Assignment, Fixture, ResolvedPlayer, RosteredTeam } from "@epl/core";
import type { MatchupContext } from "@epl/core";
import { faceOf, weight } from "./faces";
import type { DeskFacts } from "./facts";

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

const facts = (over: Partial<DeskFacts> = {}): DeskFacts =>
  ({
    pairings: [],
    scores: new Map(),
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
  }) as unknown as DeskFacts;

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

  it("gives a draft report the cover its cut-off's lead match-up chooses, and none without a job", () => {
    const man = { code: 7, name: "Groß", clubId: 5, slot: "M", points: 11, fantraxId: "g" };
    const side = (points: number, men: unknown[]) => ({ side: { eleven: men, bench: [], total: points }, subs: [], total: points, toPlay: [] });
    const lead = { state: { home: side(38, [man]), away: side(30, []), margin: 8 } } as unknown as MatchupContext;
    const draft: Assignment = { kind: "draft-report", key: "draft-report:gw5:gameweek", slug: "gw5-draft-report", cutoff: "gameweek" };
    const ctx = { facts: facts(), fixtures: NO_FIXTURES, drafts: new Map([["gameweek" as const, { contexts: [lead] }]]) };
    expect(faceOf(draft, ctx)).toEqual({ code: 7, name: "Groß", clubId: 5, position: "M" });
    expect(faceOf({ ...draft, cutoff: "saturday" }, ctx)).toBeNull();
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

describe("weight — the day's story is what CHANGED", () => {
  const man = (fresh: boolean, influence: number) => ({ fresh, player: { season: { influence } } });

  it("puts news above a standing absence, however big the name", () => {
    // Hinshelwood had been out for weeks; his being ruled out again was not
    // news, and he led the column over men whose availability moved that day.
    const standing = man(false, 900);
    const changed = man(true, 10);
    expect(weight(changed)).toBeGreaterThan(weight(standing));
  });

  it("breaks a tie between two changed men on the season", () => {
    expect(weight(man(true, 200))).toBeGreaterThan(weight(man(true, 20)));
  });

  it("does not let a cameo outrank a regular", () => {
    // Hinshelwood's two goals came in a sixty-three-minute season; Dunk played
    // every round. Influence is minutes-weighted, so it reads that correctly.
    expect(weight(man(true, 116.2))).toBeGreaterThan(weight(man(true, 72.8)));
  });

  it("ranks a man nobody can price below everyone", () => {
    expect(weight({})).toBeLessThan(weight(man(false, 0)));
  });
});
