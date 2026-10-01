import { describe, expect, it } from "vitest";
import { rateMatch } from "./rating";
import type { RatedMatch } from "./rating";
import { RATING_WEIGHTS } from "./weights";

const AVERAGE = { attack: 1, defence: 1 };
const FORWARD = { goal: 4, assist: 3 };

/** A forward's ninety-minute blank against an average side: two points for his minutes. */
const match = (over: Partial<RatedMatch> = {}): RatedMatch => ({
  minutes: 90,
  points: { total: 2, attacking: 0, cleanSheet: 0 },
  prices: FORWARD,
  opponent: AVERAGE,
  stats: {},
  ...over,
});
const rate = (m: RatedMatch) => rateMatch(m, RATING_WEIGHTS);
const rating = (m: RatedMatch) => rate(m).rating ?? Number.NaN;
const scored = (goals: number, extra = 0) => ({ total: 2 + goals * 4 + extra, attacking: goals * 4, cleanSheet: 0 });

describe("rateMatch", () => {
  it("puts a ninety-minute blank between 4 and 5", () => {
    expect(rating(match())).toBeGreaterThanOrEqual(4);
    expect(rating(match())).toBeLessThanOrEqual(5);
  });

  it("rises with his league points", () => {
    expect(rating(match({ points: scored(1) }))).toBeGreaterThan(rating(match()));
    expect(rating(match({ points: scored(2) }))).toBeGreaterThan(rating(match({ points: scored(1) })));
  });

  it("keeps 10 for the biggest days alone", () => {
    expect(rating(match({ points: scored(3) }))).toBeLessThan(10);
    expect(rating(match({ points: scored(5) }))).toBe(10);
  });

  it("reaches 1 for a disaster", () => {
    const disaster = { total: -4, attacking: 0, cleanSheet: 0 };
    expect(rating(match({ points: disaster, stats: { errorsLeadingToGoal: 1 } }))).toBe(1);
  });

  it("rewards the same goal more against a strong defence", () => {
    const strong = rating(match({ points: scored(1), opponent: { attack: 1, defence: 1.5 } }));
    const weak = rating(match({ points: scored(1), opponent: { attack: 1, defence: 0.7 } }));
    expect(strong).toBeGreaterThan(weak);
  });

  it("rewards the same clean sheet more against a strong attack", () => {
    const sheet = { total: 6, attacking: 0, cleanSheet: 4 };
    const strong = rating(match({ points: sheet, opponent: { attack: 1.4, defence: 1 } }));
    const weak = rating(match({ points: sheet, opponent: { attack: 0.7, defence: 1 } }));
    expect(strong).toBeGreaterThan(weak);
  });

  it("marks a man down for the big chances he missed", () => {
    expect(rating(match({ stats: { bigChancesMissed: 2 } }))).toBeLessThan(rating(match()));
  });

  it("does not rate a cameo with nothing in it, nor a man the league did not score", () => {
    expect(rate(match({ minutes: 4, points: { total: 1, attacking: 0, cleanSheet: 0 } })).rating).toBeNull();
    expect(rate(match({ points: null })).rating).toBeNull();
  });

  it("leaves a part out, not at nought, when its feed is missing", () => {
    const parts = rate(match()).parts;
    expect(parts.find((p) => p.name === "mistakes")?.points).toBeNull();
    expect(parts.find((p) => p.name === "points")?.points).toBe(2);
  });
});

describe("underlying", () => {
  it("tells a busy blank from a quiet one, though both rate the same", () => {
    const quiet = rate(match({ stats: { xg: 0.05, xa: 0, shots: 0, keyPasses: 0 } }));
    const busy = rate(match({ stats: { xg: 1.2, xa: 0.4, shots: 6, keyPasses: 3 } }));
    expect(busy.rating).toBe(quiet.rating);
    expect(busy.underlying ?? 0).toBeGreaterThan((quiet.underlying ?? 0) + 1.5);
  });

  it("marks a lucky goal's underlying below its rating", () => {
    const lucky = rate(match({ points: scored(1), stats: { xg: 0.04, xa: 0, shots: 1, keyPasses: 0 } }));
    expect(lucky.underlying ?? 10).toBeLessThan(lucky.rating ?? 0);
  });

  it("has no reading without xG", () => {
    expect(rate(match()).underlying).toBeNull();
  });
});

describe("against expectation", () => {
  it("is par when he did what was expected, and plus when he beat it", () => {
    const star = rate(match({ points: scored(1), expected: { attacking: 3.6, cleanSheet: 0 } }));
    const minnow = rate(match({ points: scored(1), expected: { attacking: 0.8, cleanSheet: 0 } }));
    expect(star.vsExpected).toBeCloseTo(0.4, 5);
    expect(minnow.vsExpected).toBeGreaterThan(star.vsExpected ?? 0);
  });

  it("has no reading without an expectation", () => {
    expect(rate(match()).vsExpected).toBeNull();
  });
});
