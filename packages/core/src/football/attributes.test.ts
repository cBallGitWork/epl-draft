import { describe, expect, it } from "vitest";
import { attributes, preferredFoot, shotLine } from "./attributes";
import type { Role, Scouted, ShotLine } from "./attributes";
import type { StatsRow } from "./intel/stats";
import type { Shot } from "./intel/shots";
import { NO_SEASON } from "./noSeason";
import type { FootballPlayer, SeasonTotals } from "./types";

const man = (
  name: string,
  season: Partial<SeasonTotals>,
  setPieceShare: number | null = null,
  stats: StatsRow | null = null,
): Scouted => ({
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
    birthDate: null, region: null, newsAdded: null,
    season: { ...NO_SEASON, ...season },
  } satisfies FootballPlayer,
  setPieceShare,
  penaltyShare: setPieceShare,
  shots: null,
  touches: null,
  stats,
});

/** Ten men on a spread of tackle rates, so a percentile has something to rank
 *  against. All well past the minutes floor. */
const league = Array.from({ length: 10 }, (_, i) =>
  man(`p${i}`, { minutes: 900, starts: 10, expectedGoalsConceded: 10 }, null, { minutes: 900, tacklesWon: i }),
);

const ratingOf = (grid: ReturnType<typeof attributes>, name: string) =>
  grid.find((a) => a.name === name)?.rating ?? null;

describe("attributes", () => {
  it("rates on Championship Manager's 1–20 and never outside it", () => {
    for (const subject of league) {
      for (const attribute of attributes(subject, league, "outfield")) {
        if (attribute.rating === null) continue;
        expect(attribute.rating).toBeGreaterThanOrEqual(1);
        expect(attribute.rating).toBeLessThanOrEqual(20);
      }
    }
  });

  it("orders the league — better figure, better rating, all the way down", () => {
    const ratings = league.map((subject) => ratingOf(attributes(subject, league, "outfield"), "Tackling"));
    expect(ratings).toEqual([...ratings].sort((a, b) => (a ?? 0) - (b ?? 0)));
    expect(ratings[9]).toBeGreaterThan(ratings[0] ?? 0);
  });

  it("reaches both ends of the scale on a real-sized league", () => {
    // The bottom is reached at any size — nobody is below the worst. The top
    // needs a real cohort: one man in ten is a tenth of the scale short of it,
    // and the pool this ranks against is the ~225 men past the minutes floor.
    expect(ratingOf(attributes(league[0], league, "outfield"), "Tackling")).toBe(1);
    const big = Array.from({ length: 225 }, (_, i) =>
      man(`q${i}`, { minutes: 900, starts: 10, expectedGoalsConceded: 10 }, null, { minutes: 900, tacklesWon: i }),
    );
    expect(ratingOf(attributes(big[224], big, "outfield"), "Tackling")).toBe(20);
    expect(ratingOf(attributes(big[0], big, "outfield"), "Tackling")).toBe(1);
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
    expect(ratingOf(attributes(outfield[0], cohort, "keeper"), "Handling")).toBe(1);
    expect(ratingOf(attributes(keeper, cohort, "keeper"), "Handling")).toBe(20);
  });

  it("gives every attribute a provenance", () => {
    for (const attribute of attributes(league[0], league, "outfield")) {
      expect(attribute.from).toBeTruthy();
    }
  });

  it("says nothing at all about a man who has not played ninety minutes", () => {
    // A rate off forty minutes is arithmetic, not evidence. Every rating is
    // null rather than one — an absence, not a bottom mark.
    const fringe = man("fringe", { minutes: 40, starts: 0 }, null, { minutes: 40, tacklesWon: 2 });
    const grid = attributes(fringe, league, "outfield");
    expect(grid.every((a) => a.rating === null)).toBe(true);
    expect(grid.length).toBeGreaterThan(0);
  });

  it("ranks against men who have played, not against six hundred noughts", () => {
    // The whole pool is mostly rows of zero. If they counted, anyone who had
    // kicked a ball would sit in the top decile of everything.
    const bench = Array.from({ length: 200 }, (_, i) => man(`b${i}`, { minutes: 0 }));
    const withBench = attributes(league[5], [...league, ...bench], "outfield");
    const without = attributes(league[5], league, "outfield");
    expect(ratingOf(withBench, "Tackling")).toBe(ratingOf(without, "Tackling"));
  });

  it("gives men on the same figure the same rating", () => {
    // Four hundred men on nought tackles must not be spread from 1 to 13 by
    // nothing but their order in the array.
    const level = Array.from({ length: 6 }, (_, i) =>
      man(`level${i}`, { minutes: 900, starts: 10 }, null, { minutes: 900, tacklesWon: 0 }),
    );
    const grid = level.map((subject) => ratingOf(attributes(subject, level, "outfield"), "Tackling"));
    expect(new Set(grid).size).toBe(1);
  });

  it("rates a keeper's handling above an outfielder's, on one scale for both", () => {
    const keeper = man("keeper", { minutes: 900, starts: 10, saves: 40, expectedGoalsConceded: 12 });
    const outfielder = man("outfielder", { minutes: 900, starts: 10, saves: 0, expectedGoalsConceded: 12 });
    const cohort = [keeper, outfielder, ...league];
    expect(ratingOf(attributes(keeper, cohort, "keeper"), "Handling")).toBeGreaterThan(
      ratingOf(attributes(outfielder, cohort, "keeper"), "Handling") ?? 0,
    );
    // An outfielder rated as a keeper is measured and the measurement is none —
    // a low mark, not a blank. CM has Michael Ball at Reflexes 4.
    expect(ratingOf(attributes(outfielder, cohort, "keeper"), "Reflexes")).not.toBeNull();
  });

  it("rates finishing on the gap to expected goals, not on the goals", () => {
    // A winger on five from two expected must out-rank a striker on twenty from
    // twenty-two, or the column is just a goal count wearing another name.
    const winger = man("winger", { minutes: 900, starts: 10, goals: 5, expectedGoals: 2 });
    const striker = man("striker", { minutes: 900, starts: 10, goals: 20, expectedGoals: 22 });
    const cohort = [winger, striker, ...league];
    expect(ratingOf(attributes(winger, cohort, "outfield"), "Finishing")).toBeGreaterThan(
      ratingOf(attributes(striker, cohort, "outfield"), "Finishing") ?? 0,
    );
  });

  it("leaves set pieces blank when the sister repo has no file for his club", () => {
    // Null is not "takes none" — it is "we were not told", and the two must not
    // render the same.
    const untold = man("untold", { minutes: 900, starts: 10 }, null);
    expect(ratingOf(attributes(untold, [untold, ...league], "outfield"), "Set Pieces")).toBeNull();
  });

  it("is pure — the same inputs give the same grid", () => {
    expect(attributes(league[3], league, "outfield")).toEqual(attributes(league[3], league, "outfield"));
  });
});

describe("the stats league's rows", () => {
  const counted = (name: string, stats: StatsRow | null) => man(name, { minutes: 900, starts: 10 }, null, stats);

  it("rates heading on aerial duels won, and leaves it blank where the stats league is silent", () => {
    const aerial = counted("aerial", { minutes: 900, aerialsWon: 30 });
    const grounded = counted("grounded", { minutes: 900, aerialsWon: 2 });
    const cohort = [aerial, grounded, ...league];
    expect(ratingOf(attributes(aerial, cohort, "outfield"), "Heading")).toBeGreaterThan(
      ratingOf(attributes(grounded, cohort, "outfield"), "Heading") ?? 0,
    );
    expect(ratingOf(attributes(counted("unmapped", null), cohort, "outfield"), "Heading")).toBeNull();
  });

  it("takes a rate over his minutes in the stats league", () => {
    // Twenty tackles won in 1,800 minutes is one a game; ten in 450 is two.
    const steady = counted("steady", { minutes: 1800, tacklesWon: 20 });
    const busy = counted("busy", { minutes: 450, tacklesWon: 10 });
    const cohort = [steady, busy, ...league];
    expect(ratingOf(attributes(busy, cohort, "outfield"), "Tackling")).toBeGreaterThan(
      ratingOf(attributes(steady, cohort, "outfield"), "Tackling") ?? 0,
    );
  });
});

describe("roles", () => {
  const rowsOf = (role: Role) => attributes(league[0], league, role).map((a) => a.name);

  it("gives a keeper his own rows and an outfielder his", () => {
    expect(rowsOf("keeper")).toEqual(["Anticipation", "Determination", "Handling", "Influence", "Positioning", "Reflexes", "Teamwork"]);
    expect(rowsOf("outfield")).toContain("Crossing");
    expect(rowsOf("outfield")).not.toContain("Handling");
  });

  it("measures Positioning as goals prevented for a keeper and interceptions for an outfielder", () => {
    const from = (role: Role) => attributes(league[0], league, role).find((a) => a.name === "Positioning")?.from;
    expect(from("keeper")).toMatch(/goals conceded/);
    expect(from("outfield")).toBe("interceptions per 90");
  });
});

describe("shotLine", () => {
  const shot = (over: Partial<Shot>): Shot => ({
    code: 1, fplFixtureId: 1, minute: 10, x: 90, y: 50, xg: 0.1, xgot: null, outcome: "miss",
    situation: null, bodyPart: "right-foot", assistCode: null, pass: null, ...over,
  });

  it("counts a shot outside the box by distance and by width", () => {
    const line = shotLine([shot({ x: 90, y: 50 }), shot({ x: 75, y: 50 }), shot({ x: 95, y: 5 })], 0);
    expect(line.struck).toBe(3);
    expect(line.outsideBox).toBe(2);
  });

  it("counts headers and each foot, and carries the chances he made", () => {
    const line = shotLine([shot({ bodyPart: "head" }), shot({ bodyPart: "left-foot" }), shot({})], 4);
    expect(line).toMatchObject({ headers: 1, left: 1, right: 1, created: 4 });
  });
});

describe("preferredFoot", () => {
  const feet = (left: number, right: number): ShotLine => ({
    struck: left + right, headers: 0, outsideBox: 0, created: 0, left, right,
  });

  it("names the foot he shoots with", () => {
    expect(preferredFoot(feet(1, 9))).toBe("Right");
    expect(preferredFoot(feet(8, 1))).toBe("Left");
  });

  it("calls him two-footed when the weaker foot takes a third", () => {
    expect(preferredFoot(feet(4, 6))).toBe("Either");
  });

  it("says nothing on too few shots or no map", () => {
    expect(preferredFoot(feet(1, 3))).toBeNull();
    expect(preferredFoot(null)).toBeNull();
  });
});
