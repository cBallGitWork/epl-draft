import { describe, expect, it } from "vitest";
import { callTie, type PickSide } from "./pick";

const side = (teamId: string, projected: number | null, over: Partial<PickSide> = {}): PickSide => ({
  teamId,
  projected,
  bestManDoubt: false,
  liverpool: 0,
  backLineEase: 10,
  ...over,
});

describe("callTie", () => {
  it("backs the higher total, and prints the rounded totals with the winner's first", () => {
    const call = callTie(side("h", 52.1), side("a", 41.6));
    expect(call).toMatchObject({ callsTeamId: "h", instinct: null, score: { home: 52, away: 42 }, close: false });
    expect(callTie(side("h", 40.0), side("a", 41.7))).toMatchObject({ callsTeamId: "a", score: { home: 40, away: 42 } });
  });

  it("never prints a draw for a tie it called", () => {
    // 40.4 and 40.2 both round to 40.
    expect(callTie(side("h", 40.4), side("a", 40.2)).score).toEqual({ home: 40, away: 39 });
  });

  it("gives level totals to the home side", () => {
    expect(callTie(side("h", 40), side("a", 40)).callsTeamId).toBe("h");
  });

  it("goes against the favourite on a close tie when his best man is a doubt", () => {
    // 47.4 against 44.2 is a 6.8% gap: close.
    const call = callTie(side("h", 47.4, { bestManDoubt: true }), side("a", 44.2));
    expect(call).toMatchObject({ callsTeamId: "a", instinct: "doubt", close: true });
    // By the one point the numbers would not give him.
    expect(call.score).toEqual({ home: 47, away: 48 });
  });

  it("goes against the favourite when the underdog's back line has the kinder round", () => {
    const kind = callTie(side("h", 45, { backLineEase: 14 }), side("a", 43, { backLineEase: 11 }));
    expect(kind).toMatchObject({ callsTeamId: "a", instinct: "defence" });
    const near = callTie(side("h", 45, { backLineEase: 13 }), side("a", 43, { backLineEase: 11 }));
    expect(near).toMatchObject({ callsTeamId: "h", instinct: null });
    // No ratings, no instinct.
    expect(callTie(side("h", 45, { backLineEase: null }), side("a", 43, { backLineEase: 1 })).instinct).toBeNull();
  });

  it("goes against the favourite when the underdog holds more Liverpool men", () => {
    const call = callTie(side("h", 45, { liverpool: 1 }), side("a", 43, { liverpool: 2 }));
    expect(call).toMatchObject({ callsTeamId: "a", instinct: "liverpool" });
    expect(callTie(side("h", 45, { liverpool: 2 }), side("a", 43, { liverpool: 2 })).instinct).toBeNull();
  });

  it("names the football before the loyalty when several instincts fire", () => {
    const both = callTie(side("h", 45, { bestManDoubt: true, backLineEase: 15 }), side("a", 43, { liverpool: 3 }));
    expect(both.instinct).toBe("doubt");
    const later = callTie(side("h", 45, { backLineEase: 15 }), side("a", 43, { liverpool: 3 }));
    expect(later.instinct).toBe("defence");
  });

  it("overrules a tie that is not close for Liverpool men alone, and only so far", () => {
    // 45 against 41 is an 8.9% gap: the football cannot overturn it, Liverpool can.
    expect(callTie(side("h", 45, { bestManDoubt: true, backLineEase: 20 }), side("a", 41))).toMatchObject({ callsTeamId: "h", instinct: null, close: false });
    expect(callTie(side("h", 45), side("a", 41, { liverpool: 1 }))).toMatchObject({ callsTeamId: "a", instinct: "liverpool", close: false });
    // 45 against 38 is 15.6%: not even for Liverpool.
    expect(callTie(side("h", 45), side("a", 38, { liverpool: 5 })).instinct).toBeNull();
  });

  it("only reads the favourite's doubt, never the underdog's", () => {
    expect(callTie(side("h", 45), side("a", 43, { bestManDoubt: true })).callsTeamId).toBe("h");
  });

  it("makes no call without numbers for both sides", () => {
    expect(callTie(side("h", null), side("a", 40))).toMatchObject({ callsTeamId: null, score: null, instinct: null });
    expect(callTie(side("h", 0), side("a", 0))).toMatchObject({ callsTeamId: null, score: null });
  });

  it("backs the underdog exactly when an instinct is set", () => {
    // The page prints no numbers' pick, so this invariant is the only way to know it.
    for (const [home, away] of [[45, 43], [43, 45], [52, 40], [44.1, 44.0]]) {
      for (const doubt of [true, false]) {
        const h = side("h", home, { bestManDoubt: home >= away && doubt });
        const a = side("a", away, { bestManDoubt: away > home && doubt });
        const call = callTie(h, a);
        const favourite = away > home ? "a" : "h";
        expect(call.callsTeamId === favourite).toBe(call.instinct === null);
      }
    }
  });
});
