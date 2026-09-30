import { describe, expect, it } from "vitest";
import { ATTRIBUTE_ROWS, attributes, preferredFoot, ratedLine, ratedRunning, shotLine } from "./attributes";
import type { Scouted, ShotLine } from "./attributes";
import { LINE_COUNTS } from "./intel/lines";
import type { Running, PlayerLine } from "./intel/lines";
import type { Shot } from "./intel/shots";

const line = (over: Partial<PlayerLine> = {}): PlayerLine => ({
  code: 1,
  minutes: 900,
  starts: 10,
  fplMinutes: 900,
  ratings: [],
  running: null,
  ...(Object.fromEntries(LINE_COUNTS.map((key) => [key, 0])) as Record<(typeof LINE_COUNTS)[number], number>),
  ...over,
});

const man = (over: Partial<PlayerLine> = {}, rest: Partial<Scouted> = {}): Scouted => ({
  code: 1,
  keeper: false,
  line: line(over),
  running: null,
  penaltyShare: 0,
  setPieceShare: 0,
  ...rest,
});

/** Ten men on a spread of tackle counts, so a percentile has something to rank against. */
const league = Array.from({ length: 10 }, (_, i) => man({ tackles: i }));

const ratingOf = (grid: ReturnType<typeof attributes>, name: string) => grid.find((a) => a.name === name)?.rating ?? null;

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
    const big = Array.from({ length: 225 }, (_, i) => man({ tackles: i }));
    expect(ratingOf(attributes(big[224], big), "Tackling")).toBe(20);
    expect(ratingOf(attributes(big[0], big), "Tackling")).toBe(1);
  });

  it("gives men on the same figure the same rating, at the bottom of a block of noughts", () => {
    const level = Array.from({ length: 6 }, () => man({ tackles: 0 }));
    const grid = level.map((subject) => ratingOf(attributes(subject, level), "Tackling"));
    expect(new Set(grid)).toEqual(new Set([1]));
  });

  it("rates per 90 of his minutes, not on his total", () => {
    const busy = man({ minutes: 900, tackles: 20 });
    const sharp = man({ minutes: 450, tackles: 15 });
    const cohort = [busy, sharp, ...league];
    expect(ratingOf(attributes(sharp, cohort), "Tackling")).toBeGreaterThan(ratingOf(attributes(busy, cohort), "Tackling") ?? 0);
  });

  it("rates FPL's figures per 90 of the minutes FPL covered", () => {
    const covered = man({ minutes: 900, fplMinutes: 450, bps: 200 });
    const whole = man({ minutes: 900, fplMinutes: 900, bps: 300 });
    const cohort = [covered, whole];
    expect(ratingOf(attributes(covered, cohort), "Determination")).toBeGreaterThan(ratingOf(attributes(whole, cohort), "Determination") ?? 0);
  });

  it("rates finishing on expected goals on target, so the striker who hits the target most rates highest", () => {
    const striker = man({ xgot: 20 });
    const centreHalf = man({ xgot: 1 });
    const cohort = [striker, centreHalf, ...league];
    expect(ratingOf(attributes(striker, cohort), "Finishing")).toBeGreaterThan(ratingOf(attributes(centreHalf, cohort), "Finishing") ?? 0);
  });

  it("rates work rate, pace and acceleration on this season's running", () => {
    const run = (km: number, sprints: number, topSpeed: number): Running => ({ minutes: 450, km, sprints, topSpeed });
    const runner = man({}, { running: run(55, 100, 33) });
    const walker = man({}, { running: run(45, 60, 35) });
    const cohort = [runner, walker];
    expect(ratingOf(attributes(runner, cohort), "Work Rate")).toBeGreaterThan(ratingOf(attributes(walker, cohort), "Work Rate") ?? 0);
    expect(ratingOf(attributes(walker, cohort), "Pace")).toBeGreaterThan(ratingOf(attributes(runner, cohort), "Pace") ?? 0);
    expect(ratingOf(attributes(man(), cohort), "Work Rate")).toBeNull();
  });

  it("rates consistency on how good his bad days are, not on how much his rating swings", () => {
    // A striker's rating swings with his goals; his worst games still count as good.
    const striker = man({ ratings: [9.5, 8.8, 7.4, 7.2, 9.1, 7.3, 8.9, 7.5] });
    const plodder = man({ ratings: [6.6, 6.5, 6.7, 6.6, 6.5, 6.6, 6.7, 6.5] });
    const cohort = [striker, plodder];
    expect(ratingOf(attributes(striker, cohort), "Consistency")).toBeGreaterThan(ratingOf(attributes(plodder, cohort), "Consistency") ?? 0);
    expect(ratingOf(attributes(man({ ratings: [7, 7, 7] }), cohort), "Consistency")).toBeNull();
  });

  it("rates a keeper against keepers only, on a keeper's rows", () => {
    // Handling is his save share, so a keeper behind a tight defence is not marked down for idleness.
    const keeper = man({ saves: 60, conceded: 20 }, { keeper: true });
    const other = man({ saves: 30, conceded: 5 }, { keeper: true });
    const grid = attributes(keeper, [keeper, other, ...league]);
    expect(ratingOf(grid, "Handling")).toBe(1);
    expect(grid.map((a) => a.name)).toEqual(ATTRIBUTE_ROWS.filter((row) => row.for !== "outfield").map((row) => row.name));
    expect(grid.some((a) => a.name === "Finishing")).toBe(false);
    expect(attributes(league[0], league).some((a) => a.name === "Handling")).toBe(false);
  });

  it("says nothing about a man with no season to rate", () => {
    const grid = attributes(man({}, { line: null, penaltyShare: null, setPieceShare: null }), league);
    expect(grid.every((a) => a.rating === null)).toBe(true);
    expect(grid.length).toBeGreaterThan(0);
  });

  it("leaves set pieces blank when the sister repo has no file for his club", () => {
    const untold = man({}, { setPieceShare: null });
    expect(ratingOf(attributes(untold, [untold, ...league]), "Set Pieces")).toBeNull();
  });

  it("gives every attribute a provenance, and is pure", () => {
    for (const attribute of attributes(league[0], league)) expect(attribute.from).toBeTruthy();
    expect(attributes(league[3], league)).toEqual(attributes(league[3], league));
  });
});

describe("ratedLine", () => {
  const floors = { last: 1140, now: 150 };

  it("rates on last season when he played enough of it", () => {
    const last = line({ minutes: 2953 });
    expect(ratedLine(last, line({ minutes: 450 }), floors)).toBe(last);
  });

  it("rates a new man, or a bit-part one last season, on this season", () => {
    const now = line({ minutes: 450 });
    expect(ratedLine(undefined, now, floors)).toBe(now);
    expect(ratedLine(line({ minutes: 600 }), now, floors)).toBe(now);
  });

  it("rates nobody who has played enough of neither", () => {
    expect(ratedLine(line({ minutes: 600 }), line({ minutes: 100 }), floors)).toBeNull();
  });

  it("counts this season's running once he has run enough of it", () => {
    const running = { minutes: 400, km: 44, sprints: 80, topSpeed: 34 };
    expect(ratedRunning(line({ running }), floors)).toBe(running);
    expect(ratedRunning(line({ running: { ...running, minutes: 100 } }), floors)).toBeNull();
    expect(ratedRunning(undefined, floors)).toBeNull();
  });
});

describe("shotLine", () => {
  const shot = (over: Partial<Shot>): Shot => ({
    code: 1, fplFixtureId: 1, minute: 10, x: 90, y: 50, xg: 0.1, xgot: null, outcome: "miss",
    situation: null, bodyPart: "right-foot", assistCode: null, pass: null, ...over,
  });

  it("counts his shots and each foot, and carries the chances he made", () => {
    const counted = shotLine([shot({ bodyPart: "head" }), shot({ bodyPart: "left-foot" }), shot({})], 4);
    expect(counted).toEqual({ struck: 3, created: 4, left: 1, right: 1 });
  });
});

describe("preferredFoot", () => {
  const feet = (left: number, right: number): ShotLine => ({ struck: left + right, created: 0, left, right });

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
