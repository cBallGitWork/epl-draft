import { describe, expect, it } from "vitest";
import { attributes } from "./attributes";
import type { Scouted } from "./attributes";
import { NO_SEASON } from "./noSeason";
import type { FootballPlayer, SeasonTotals } from "./types";

const man = (name: string, season: Partial<SeasonTotals>, setPieceShare: number | null = null): Scouted => ({
  player: {
    id: 1,
    code: 1,
    name,
    fullName: name,
    clubId: 1,
    status: "a",
    news: "",
    chanceOfPlaying: null,
    optaCode: null,
    birthDate: null, joinedClub: null,
    season: { ...NO_SEASON, ...season },
  } satisfies FootballPlayer,
  setPieceShare,
});

/** Ten men on a spread of tackle rates, so a percentile has something to rank
 *  against. All well past the minutes floor. */
const league = Array.from({ length: 10 }, (_, i) =>
  man(`p${i}`, { minutes: 900, starts: 10, tackles: i, expectedGoalsConceded: 10 }),
);

const ratingOf = (grid: ReturnType<typeof attributes>, name: string) =>
  grid.find((a) => a.name === name)?.rating ?? null;

describe("attributes", () => {
  it("rates on Championship Manager's 1–20 and never outside it", () => {
    for (const subject of league) {
      for (const attribute of attributes(subject, league)) {
        if (attribute.rating === null) continue;
        expect(attribute.rating).toBeGreaterThanOrEqual(1);
        expect(attribute.rating).toBeLessThanOrEqual(20);
      }
    }
  });

  it("orders the league — better figure, better rating, all the way down", () => {
    const ratings = league.map((subject) => ratingOf(attributes(subject, league), "Tackling"));
    expect(ratings).toEqual([...ratings].sort((a, b) => (a ?? 0) - (b ?? 0)));
    expect(ratings[9]).toBeGreaterThan(ratings[0] ?? 0);
  });

  it("reaches both ends of the scale on a real-sized league", () => {
    // The bottom is reached at any size — nobody is below the worst. The top
    // needs a real cohort: one man in ten is a tenth of the scale short of it,
    // and the pool this ranks against is the ~225 men past the minutes floor.
    expect(ratingOf(attributes(league[0], league), "Tackling")).toBe(1);
    const big = Array.from({ length: 225 }, (_, i) =>
      man(`q${i}`, { minutes: 900, starts: 10, tackles: i, expectedGoalsConceded: 10 }),
    );
    expect(ratingOf(attributes(big[224], big), "Tackling")).toBe(20);
    expect(ratingOf(attributes(big[0], big), "Tackling")).toBe(1);
  });

  it("puts a man at the bottom of a measure most of the league scores nought on", () => {
    // The bug this replaced a midrank percentile to fix. 203 of the 225 men past
    // the minutes floor had made no saves on 4 Sep 2026, so the midpoint of the
    // zero block was 0.451 and every outfielder came out at Handling 10 —
    // Maguire rated a better handler than a fifth of the goalkeepers.
    const keeper = man("keeper", { minutes: 900, starts: 10, saves: 40, expectedGoalsConceded: 12 });
    const outfield = Array.from({ length: 90 }, (_, i) =>
      man(`o${i}`, { minutes: 900, starts: 10, saves: 0, expectedGoalsConceded: 10 }),
    );
    const cohort = [keeper, ...outfield];
    expect(ratingOf(attributes(outfield[0], cohort), "Handling")).toBe(1);
    expect(ratingOf(attributes(keeper, cohort), "Handling")).toBe(20);
  });

  it("gives every attribute a provenance", () => {
    for (const attribute of attributes(league[0], league)) {
      expect(attribute.from).toBeTruthy();
    }
  });

  it("says nothing at all about a man who has not played ninety minutes", () => {
    // A rate off forty minutes is arithmetic, not evidence. Every rating is
    // null rather than one — an absence, not a bottom mark.
    const fringe = man("fringe", { minutes: 40, starts: 0, tackles: 2 });
    const grid = attributes(fringe, league);
    expect(grid.every((a) => a.rating === null)).toBe(true);
    expect(grid.length).toBeGreaterThan(0);
  });

  it("ranks against men who have played, not against six hundred noughts", () => {
    // The whole pool is mostly rows of zero. If they counted, anyone who had
    // kicked a ball would sit in the top decile of everything.
    const bench = Array.from({ length: 200 }, (_, i) => man(`b${i}`, { minutes: 0 }));
    const withBench = attributes(league[5], [...league, ...bench]);
    const without = attributes(league[5], league);
    expect(ratingOf(withBench, "Tackling")).toBe(ratingOf(without, "Tackling"));
  });

  it("gives men on the same figure the same rating", () => {
    // Four hundred men on nought tackles must not be spread from 1 to 13 by
    // nothing but their order in the array.
    const level = Array.from({ length: 6 }, (_, i) => man(`level${i}`, { minutes: 900, starts: 10, tackles: 0 }));
    const grid = level.map((subject) => ratingOf(attributes(subject, level), "Tackling"));
    expect(new Set(grid).size).toBe(1);
  });

  it("rates a keeper's handling above an outfielder's, on one scale for both", () => {
    const keeper = man("keeper", { minutes: 900, starts: 10, saves: 40, expectedGoalsConceded: 12 });
    const outfielder = man("outfielder", { minutes: 900, starts: 10, saves: 0, expectedGoalsConceded: 12 });
    const cohort = [keeper, outfielder, ...league];
    expect(ratingOf(attributes(keeper, cohort), "Handling")).toBeGreaterThan(
      ratingOf(attributes(outfielder, cohort), "Handling") ?? 0,
    );
    // An outfielder is measured and the measurement is none — a low mark, not a
    // blank. CM has Michael Ball at Reflexes 4.
    expect(ratingOf(attributes(outfielder, cohort), "Reflexes")).not.toBeNull();
  });

  it("rates finishing on the gap to expected goals, not on the goals", () => {
    // A winger on five from two expected must out-rank a striker on twenty from
    // twenty-two, or the column is just a goal count wearing another name.
    const winger = man("winger", { minutes: 900, starts: 10, goals: 5, expectedGoals: 2 });
    const striker = man("striker", { minutes: 900, starts: 10, goals: 20, expectedGoals: 22 });
    const cohort = [winger, striker, ...league];
    expect(ratingOf(attributes(winger, cohort), "Finishing")).toBeGreaterThan(
      ratingOf(attributes(striker, cohort), "Finishing") ?? 0,
    );
  });

  it("leaves set pieces blank when the sister repo has no file for his club", () => {
    // Null is not "takes none" — it is "we were not told", and the two must not
    // render the same.
    const untold = man("untold", { minutes: 900, starts: 10 }, null);
    expect(ratingOf(attributes(untold, [untold, ...league]), "Set Pieces")).toBeNull();
  });

  it("is pure — the same inputs give the same grid", () => {
    expect(attributes(league[3], league)).toEqual(attributes(league[3], league));
  });
});
