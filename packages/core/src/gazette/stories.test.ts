import { describe, expect, it } from "vitest";
import type { PeriodPairing } from "../league/selectors";
import type { LiveTeamScore } from "../league/points";
import { decided, stories } from "./stories";
import type { Deal, Pick, TeamOfTheWeek } from "./types";

// A real period's numbers: test2 41 test4 19 is a rout, test3 45 against 123's 31 an ordinary win.

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

/** The strongest story, which the front page leads on. */
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
    // An international break: no pairings, no eleven, and a trade.
    expect(top([], new Map(), null, [trade()], 1)).toMatchObject({
      kind: "trade",
      // Both managers, named here so the headline need not work them out again.
      sides: ["test2", "test3"],
    });
  });

  // A trade is news for one period: the caller hands over a season of history.
  it("does not tell a trade from a period the paper is not about", () => {
    expect(top([], new Map(), null, [trade({ period: 3 })], 4)).toBeNull();
    expect(top([], new Map(), null, [trade({ period: 4 })], 4)).toMatchObject({ kind: "trade" });
  });

  // An undated deal cannot be shown to be this week's.
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
    // A dash beaten by 41 has beaten nothing.
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
    // A margin of 22 is a hammering at this league's scale and ordinary at ten times it.
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
    // All four: test3 edged 123, test4 was taken apart, a best man sat out, and a trade.
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
    expect(stories(P1, new Map(), null, [], 1)).toEqual([]);
  });

  it("reports every decided tie, not just the ones the running order picked", () => {
    // A pundit is marked on all his calls, not only the thriller and the thrashing.
    expect(decided(P1, SETTLED).map((result) => result.winner.name)).toEqual(["test2", "test3"]);
  });

  it("has nothing to lead on before anybody has played", () => {
    expect(top(P1, new Map(), null, [], 1)).toBeNull();
  });
});
