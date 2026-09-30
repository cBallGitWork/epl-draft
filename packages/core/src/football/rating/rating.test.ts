import { describe, expect, it } from "vitest";
import { rateMatch } from "./rating";
import type { RatedMatch } from "./rating";
import { RATING_WEIGHTS } from "./weights";

const AVERAGE = { attack: 1, defence: 1 };

/** A quiet ninety for a forward against an average side; each test changes what it is about. */
const match = (over: Partial<RatedMatch> = {}): RatedMatch => ({
  position: "FWD",
  minutes: 90,
  opponent: AVERAGE,
  stats: {},
  ...over,
});
const rate = (m: RatedMatch) => rateMatch(m, RATING_WEIGHTS);
const rating = (m: RatedMatch) => rate(m).rating ?? Number.NaN;

describe("rateMatch", () => {
  it("gives a quiet ninety an ordinary mark", () => {
    const r = rating(match());
    expect(r).toBeGreaterThanOrEqual(5.5);
    expect(r).toBeLessThanOrEqual(6.5);
  });

  it("marks a striker down for two missed penalties, whatever his xG says", () => {
    const r = rating(match({ stats: { xg: 1.58, penaltyXg: 1.58, penaltiesMissed: 2, shots: 2 } }));
    expect(r).toBeLessThan(5);
  });

  it("rewards the same clean sheet more against a strong attack", () => {
    const sheet = { cleanSheet: 1, goalsAgainstOnPitch: 0 };
    const strong = rating(match({ position: "DEF", stats: sheet, opponent: { attack: 1.4, defence: 1 } }));
    const weak = rating(match({ position: "DEF", stats: sheet, opponent: { attack: 0.75, defence: 1 } }));
    expect(strong).toBeGreaterThan(weak);
  });

  it("rewards the same goal more against a strong defence", () => {
    const strong = rating(match({ stats: { goals: 1 }, opponent: { attack: 1, defence: 1.35 } }));
    const weak = rating(match({ stats: { goals: 1 }, opponent: { attack: 1, defence: 0.8 } }));
    expect(strong).toBeGreaterThan(weak);
  });

  it("separates two men on the same return by how busy they were", () => {
    const quiet = rating(match({ stats: { goals: 1, xg: 0.3 } }));
    const busy = rating(match({ stats: { goals: 1, xg: 0.9, shotsOnTarget: 3, keyPasses: 3, bigChancesCreated: 1 } }));
    expect(busy).toBeGreaterThan(quiet);
  });

  it("counts a penalty goal for less than an open-play goal", () => {
    const pen = rating(match({ stats: { goals: 1, penaltyGoals: 1, xg: 0.79, penaltyXg: 0.79 } }));
    const open = rating(match({ stats: { goals: 1, xg: 0.2 } }));
    expect(open).toBeGreaterThan(pen);
  });

  it("gives a goal from outside the box more than one from inside", () => {
    const outside = rating(match({ stats: { goals: 1, goalsOutsideBox: 1, xg: 0.05 } }));
    const inside = rating(match({ stats: { goals: 1, xg: 0.05 } }));
    expect(outside).toBeGreaterThan(inside);
  });

  it("marks a late substitute below a ninety-minute man on the same line", () => {
    expect(rating(match({ minutes: 12 }))).toBeLessThan(rating(match()));
  });

  it("marks down a red card and an own goal", () => {
    const good = { goals: 1, keyPasses: 2 };
    expect(rating(match({ stats: { ...good, redCards: 1 } }))).toBeLessThan(rating(match({ stats: good })));
    expect(rating(match({ stats: { ...good, ownGoals: 1 } }))).toBeLessThan(rating(match({ stats: good })));
  });

  it("stays between 1 and 10 at the extremes", () => {
    const haul = rating(match({ stats: { goals: 5, assists: 3, xg: 4, keyPasses: 8, shotsOnTarget: 8 } }));
    const disaster = rating(match({ stats: { redCards: 1, ownGoals: 2, penaltiesMissed: 2, errorsLeadingToGoal: 2 } }));
    expect(haul).toBeLessThanOrEqual(10);
    expect(haul).toBeGreaterThan(9);
    expect(disaster).toBeGreaterThanOrEqual(1);
    expect(disaster).toBeLessThan(3);
  });

  it("leaves a part out, not at nought, when its feed is missing", () => {
    const parts = rate(match({ stats: { goals: 1 } })).parts;
    expect(parts.find((p) => p.name === "defending")?.points).toBeNull();
    expect(parts.find((p) => p.name === "returns")?.points).toBeGreaterThan(0);
  });

  it("does not rate a cameo with nothing in it", () => {
    expect(rate(match({ minutes: 4 })).rating).toBeNull();
    expect(rate(match({ minutes: 4, stats: { goals: 1 } })).rating).not.toBeNull();
  });

  it("scores the keeper's work: saves and goals prevented", () => {
    const keeper = { position: "GK" as const, stats: { goalsAgainstOnPitch: 1 } };
    const busy = rating(match({ ...keeper, stats: { ...keeper.stats, saves: 7, goalsPrevented: 1.5 } }));
    expect(busy).toBeGreaterThan(rating(match(keeper)));
  });

  it("carries no opponent factor when the strength reading is missing", () => {
    expect(rating(match({ stats: { goals: 1 }, opponent: null }))).toBe(rating(match({ stats: { goals: 1 } })));
  });
});

describe("rateMatch against expectation", () => {
  const expected = { goals: 0.8, assists: 0.2, cleanSheet: 0.3 };

  it("is par when he did what was expected, and plus when he beat it", () => {
    const star = rate(match({ stats: { goals: 1 }, expected }));
    const minnow = rate(match({ stats: { goals: 1 }, expected: { goals: 0.2, assists: 0.1, cleanSheet: 0.1 } }));
    expect(star.vsExpected).toBeLessThan(minnow.vsExpected ?? 0);
    expect(minnow.vsExpected).toBeGreaterThan(0);
  });

  it("has no reading without an expectation", () => {
    expect(rate(match({ stats: { goals: 1 } })).vsExpected).toBeNull();
  });
});
