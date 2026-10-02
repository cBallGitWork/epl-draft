import { describe, expect, it } from "vitest";
import type { PeriodPairing } from "../league/selectors";
import type { LiveTeamScore } from "../league/points";
import { decided, stories } from "./stories";
import type { Deal, Pick, TeamOfTheWeek } from "./types";

// The numbers are period 1 of the rehearsal league, probed live on 28 Aug 2026:
// test2 41 test4 19, and test3 45 against 123's 31. One of them is a rout under
// the threshold below and the other is an ordinary win, which is the pair worth
// testing against — invented data would have made both the same kind of thing.

const pairing = (home: string, away: string): PeriodPairing => ({
  home: { teamId: home, name: home },
  away: { teamId: away, name: away },
});

const P1: PeriodPairing[] = [pairing("test2", "test4"), pairing("test3", "123")];

const board = (
  totals: Record<string, [number | null, number | null]>,
): Map<string, LiveTeamScore> =>
  new Map(
    Object.entries(totals).map(([teamId, [points, toPlay]]) => [
      teamId,
      { teamId, points, toPlay },
    ]),
  );

const SETTLED = board({
  test2: [41, 0],
  test4: [19, 0],
  test3: [45, 0],
  "123": [31, 0],
});

const pick = (over: Partial<Pick> = {}): Pick => ({
  fantraxId: "p1",
  playerName: "Pickford",
  playerCode: 98745,
  clubId: 11,
  position: "G",
  ownerTeamId: "123",
  ownerName: "123",
  started: true,
  minutes: 90,
  goals: 0,
  assists: 0,
  cleanSheet: true,
  saves: 4,
  points: null,
  score: 50,
  ...over,
});

/** The strongest story, which is what the front page leads on. Most of these
 *  cases are about the running order, so they read it off the top. */
const top = (...args: Parameters<typeof stories>) => stories(...args)[0] ?? null;

const eleven = (...picks: Pick[]): TeamOfTheWeek => ({
  picks,
  lines: [{ position: "G", picks }],
  shape: "1-4-4-2",
});

const trade = (over: Partial<Deal> = {}): Deal => ({
  setId: "s1",
  kind: "trade",
  inbound: [
    { playerName: "Saka", teamId: "test2" },
    { playerName: "Palmer", teamId: "test3" },
  ],
  outbound: [],
  processedAt: "Wed Aug 26, 2026, 9:14AM",
  period: 1,
  ...over,
});

describe("stories", () => {
  it("leads on the hammering when nothing was close and nobody was left out", () => {
    const story = top(P1, SETTLED, null, [], 1);
    expect(story).toEqual({
      kind: "rout",
      result: {
        winner: { teamId: "test2", name: "test2", points: 41 },
        loser: { teamId: "test4", name: "test4", points: 19 },
        margin: 22,
      },
    });
  });

  it("does not call an ordinary win a story", () => {
    // 45–31 is a comfortable win and no more. On its own it leads on nothing.
    expect(top([pairing("test3", "123")], SETTLED, null, [], 1)).toBeNull();
  });

  it("puts a match decided by nothing above every other story", () => {
    const scores = board({ test2: [41, 0], test4: [40, 0], test3: [45, 0], "123": [31, 0] });
    const story = top(P1, scores, eleven(pick({ started: false })), [trade()], 1);
    expect(story?.kind).toBe("squeaker");
    expect(story).toMatchObject({ result: { winner: { name: "test2" }, margin: 1 } });
  });

  it("takes the narrowest squeaker and the widest rout when there are two", () => {
    const narrow = board({ test2: [41, 0], test4: [40, 0], test3: [45, 0], "123": [44.5, 0] });
    expect(top(P1, narrow, null, [], 1)).toMatchObject({
      kind: "squeaker",
      result: { winner: { name: "test3" }, margin: 0.5 },
    });

    const wide = board({ test2: [41, 0], test4: [19, 0], test3: [45, 0], "123": [4, 0] });
    expect(top(P1, wide, null, [], 1)).toMatchObject({
      kind: "rout",
      result: { winner: { name: "test3" }, margin: 41 },
    });
  });

  it("leads on the man his own manager left out, above a hammering", () => {
    const story = top(P1, SETTLED, eleven(pick({ started: false })), [], 1);
    expect(story?.kind).toBe("bench");
  });

  it("names the defeat the benched man sat out, and nothing when there was none", () => {
    // 123 lost 31–45, so the story has both halves.
    const lost = top(P1, SETTLED, eleven(pick({ started: false })), [], 1);
    expect(lost).toMatchObject({ lost: { winner: { name: "test3" }, loser: { name: "123" } } });

    // test2 won its match. He was still left out; there is simply no defeat.
    const won = top(
      P1,
      SETTLED,
      eleven(pick({ started: false, ownerTeamId: "test2", ownerName: "test2" })),
      [],
      1,
    );
    expect(won).toMatchObject({ kind: "bench", lost: null });
  });

  it("takes the best of the men left out, not the first in the payload", () => {
    const story = top(
      P1,
      SETTLED,
      eleven(
        pick({ playerName: "Started", started: true }),
        pick({ playerName: "Best benched", started: false }),
        pick({ playerName: "Lesser benched", started: false }),
      ),
      [],
      1,
    );
    expect(story).toMatchObject({ kind: "bench", pick: { playerName: "Best benched" } });
  });

  it("leads on a trade when there is no football to lead on", () => {
    // An international break: no pairings, no eleven, and two managers did
    // business anyway.
    expect(top([], new Map(), null, [trade()], 1)).toMatchObject({
      kind: "trade",
      // Both managers, named here rather than worked out again by whatever
      // prints the headline.
      sides: ["test2", "test3"],
    });
  });

  // A trade is news for one week. `readDeals` asks Fantrax for a hundred rows of
  // season history and hands the lot over, so without this an August trade is
  // still a story in April — and becomes the LEAD in the first week with no
  // squeaker, no bench and no rout, which is the international-break case this
  // file names as the one a trade is here to cover.
  it("does not tell a trade from a period the paper is not about", () => {
    expect(top([], new Map(), null, [trade({ period: 3 })], 4)).toBeNull();
    expect(top([], new Map(), null, [trade({ period: 4 })], 4)).toMatchObject({ kind: "trade" });
  });

  // A deal Fantrax did not date cannot be shown to be this week's, and a lead is
  // the last place to guess.
  it("does not tell an undated trade", () => {
    expect(top([], new Map(), null, [trade({ period: null })], 4)).toBeNull();
  });

  it("will not lead on a trade that does not say who got whom", () => {
    const nameless = trade({ inbound: [{ playerName: "Saka", teamId: null }] });
    expect(top([], new Map(), null, [nameless], 1)).toBeNull();
  });

  it("ignores a claim off the wire, which is not a trade", () => {
    expect(top([], new Map(), null, [trade({ kind: "claim" })], 1)).toBeNull();
  });

  it("reports no result while anybody still has football to come", () => {
    const midweek = board({ test2: [41, 0], test4: [19, 2], test3: [45, 0], "123": [31, 0] });
    expect(top([pairing("test2", "test4")], midweek, null, [], 1)).toBeNull();
  });

  it("treats an unstated toPlay as unknown rather than as nobody left", () => {
    const silent = board({ test2: [41, null], test4: [19, null] });
    expect(top([pairing("test2", "test4")], silent, null, [], 1)).toBeNull();
  });

  it("does not read a missing total as a nought", () => {
    // A dash beaten by 41 has beaten nothing, and calling it a rout would be the
    // most confident wrong statement on the page.
    const dashed = board({ test2: [41, 0], test4: [null, 0] });
    expect(top([pairing("test2", "test4")], dashed, null, [], 1)).toBeNull();
  });

  it("names no winner in a dead heat", () => {
    const drawn = board({ test2: [41, 0], test4: [41, 0] });
    expect(top([pairing("test2", "test4")], drawn, null, [], 1)).toBeNull();
  });

  it("finds no story in a week nobody scored in", () => {
    const nothing = board({ test2: [0, 0], test4: [0, 0] });
    expect(top([pairing("test2", "test4")], nothing, null, [], 1)).toBeNull();
  });

  it("scales its thresholds to the league's own scoring rather than to a number of points", () => {
    // The same match ten times over. A margin of 22 is a hammering at this
    // league's scale and an ordinary afternoon at ten times it — which is the
    // whole reason the thresholds are shares. A commissioner who pays for every
    // touch must not get a paper that calls every week a thriller.
    const tenfold = board({ test2: [410, 0], test4: [388, 0] });
    expect(top([pairing("test2", "test4")], tenfold, null, [], 1)).toBeNull();
  });

  it("keeps the margin the number a person would write down", () => {
    const fractional = board({ test2: [41.3, 0], test4: [19.1, 0] });
    expect(top([pairing("test2", "test4")], fractional, null, [], 1)).toMatchObject({
      result: { margin: 22.2 },
    });
  });

  it("runs every story it can tell, strongest first", () => {
    // A week with all four in it: test3 edged 123 by a point, test4 was taken
    // apart, somebody's best man sat out, and two managers did business. A page,
    // not a sentence.
    const scores = board({ test2: [41, 0], test4: [19, 0], test3: [45, 0], "123": [44.5, 0] });
    const told = stories(
      P1,
      scores,
      eleven(pick({ started: false, ownerTeamId: "test4", ownerName: "test4" })),
      [trade()],
      1,
    );
    expect(told.map((story) => story.kind)).toEqual(["squeaker", "bench", "rout", "trade"]);
  });

  it("is empty rather than padded when the week produced nothing", () => {
    // Not a lead nobody can stand behind, and not a deadline dressed as news.
    expect(stories(P1, new Map(), null, [], 1)).toEqual([]);
  });

  it("reports every decided tie, not just the ones the running order picked", () => {
    // Marking a pundit reads this: he is marked on all his calls, and reading
    // only the thriller and the thrashing would mark him on the two ties he was
    // least likely to have got wrong.
    expect(decided(P1, SETTLED).map((result) => result.winner.name)).toEqual(["test2", "test3"]);
  });

  it("has nothing to lead on before anybody has played", () => {
    expect(top(P1, new Map(), null, [], 1)).toBeNull();
  });
});
