import { describe, expect, it } from "vitest";
import { matchupState } from "./state";
import type { DraftMan, DraftSide } from "./types";

const man = (name: string, slot: string, points: number | null, minutes: number, left = 0, more: Partial<DraftMan> = {}): DraftMan => ({
  fantraxId: name, name, club: "Club", slot, points, minutes, played: left === 0 ? 1 : 0, left, debut: false, ...more,
});
const limits = { min: { G: 1, D: 3, M: 2, F: 1 }, max: { G: 1, D: 5, M: 5, F: 3 } };
const worth = { goal: { G: 10, D: 6, M: 5, F: 4 }, cleanSheet: { G: 4, D: 4, M: 1, F: 0 } };
const eleven = (tagged: string, over: Record<string, DraftMan> = {}) =>
  ["G", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"].map((slot, i) => over[`${slot}${i}`] ?? man(`${tagged}${slot}${i}`, slot, 2, 90));
const side = (name: string, total: number, xi: DraftMan[], bench: DraftMan[] = []): DraftSide => ({ teamId: name, name, total, eleven: xi, bench, benchNumbered: true });

describe("matchupState", () => {
  it("says a goal from the one man left wins it when he is worth more than the margin", () => {
    const home = side("Home", 40, eleven("h"));
    const away = side("Away", 36, eleven("a", { M5: man("Salah", "M", null, 0, 1) }));
    const lines = matchupState({ home, away }, worth, limits).lines;
    expect(lines[0]).toBe("Home 40-36 Away: Home lead by 4 points");
    expect(lines).toContain("one goal from Salah (worth 5) would win it for Away");
  });

  it("counts a reserve certain to come on, and names a reserve's big score that does not count", () => {
    const home = side("Home", 30, eleven("h", { D1: man("Blank", "D", null, 0) }), [man("Sub", "D", 3, 90), man("Star", "F", 9, 90)]);
    const away = side("Away", 31, eleven("a"));
    const state = matchupState({ home, away }, worth, limits);
    expect(state.home.total).toBe(33);
    expect(state.lines[0]).toBe("Home 30-31 Away; 33-31 with the substitutions Fantrax will make: Home lead by 2 points");
    expect(state.lines).toContain("Home: Blank (Club) did not play; Sub (Club) comes on from the bench, bringing 3 points");
    expect(state.lines).toContain("Home: Star (Club) scored 9 points on the bench, which do not count");
  });

  it("names an early exit, a first start for the side and a man with two matches", () => {
    const home = side("Home", 20, eleven("h", { M5: man("Early", "M", 1, 40), F9: man("New", "F", 2, 90, 1, { debut: true, played: 1 }) }));
    const lines = matchupState({ home, away: side("Away", 20, eleven("a")) }, worth, limits).lines;
    expect(lines).toEqual(expect.arrayContaining(["Home: Early (Club) played 40 minutes", "Home: New (Club) started for Home for the first time", "Home: New (Club) has 2 matches this period"]));
  });
});
