import { describe, expect, it } from "vitest";
import { draftMan as man } from "./__fixtures__/draftMan";
import { worthOf } from "./__fixtures__/worth";
import { matchupState } from "./state";
import type { DraftMan, DraftSide } from "./types";

const limits = { min: { G: 1, D: 3, M: 2, F: 1 }, max: { G: 1, D: 5, M: 5, F: 3 } };
const worth = worthOf();
const eleven = (tag: string, over: Record<string, DraftMan> = {}) =>
  ["G", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"].map((slot, i) => over[`${slot}${i}`] ?? man(`${tag}${slot}${i}`, slot, 2, 90));
const side = (name: string, total: number, xi: DraftMan[], bench: DraftMan[] = []): DraftSide => ({ teamId: name, name, total, eleven: xi, bench, subOrder: bench.map((m) => m.fantraxId) });

describe("matchupState", () => {
  it("names the man whose goal would win it once three or fewer are left, with no figure and no sums restated", () => {
    const state = matchupState({ home: side("Home", 40, eleven("h")), away: side("Away", 36, eleven("a", { M5: man("Salah", "M", null, 0, 1, { next: "away to Everton" }) })) }, worth, limits, "saturday");
    expect(state.score).toBe("Home 40-36 Away");
    expect(state.stillToPlay).toEqual(["Away have 1 still to play: Salah (Club, away to Everton)", "a goal from Salah would win it"]);
  });

  it("works no sums while more than three are left", () => {
    const five = eleven("a", { F9: man("a9", "F", null, 0, 1), F10: man("a10", "F", null, 0, 1), M8: man("a8", "M", null, 0, 1), M7: man("a7", "M", null, 0, 1) });
    const state = matchupState({ home: side("Home", 20, eleven("h")), away: side("Away", 10, five) }, worth, limits, "saturday");
    expect(state.stillToPlay).toHaveLength(1);
  });

  it("gives Saturday's score with the substitutes named, and the round's as a result flipped by them", () => {
    const home = side("Home", 30, eleven("h", { D1: man("Blank", "D", null, 0) }), [man("Vuskovic", "D", 6, 90)]);
    const away = side("Away", 33, eleven("a"));
    expect(matchupState({ home, away }, worth, limits, "saturday").score).toBe("Home 30-33 Away, 36-33 once Vuskovic comes on");
    expect(matchupState({ home, away }, worth, limits, "week").score).toBe("Home beat Away 36-33; Away led 33-30 before the substitutions");
  });

  it("says a late goal worth more than the margin decided it", () => {
    const home = side("Home", 38, eleven("h", { F9: man("Haaland", "F", 6, 90, 0, { goals: 1, scoredAt: [{ minute: 81 }] }) }));
    expect(matchupState({ home, away: side("Away", 37, eleven("a")) }, worth, limits, "week").score).toBe("Home beat Away 38-37, decided by Haaland's goal in the 81st minute");
  });

  it("names a Premier League match with the sides' men on opposing clubs, still to play or with a return in it", () => {
    const tie = { matches: [{ code: 7, label: "Man City v Sunderland" }] };
    const home = side("Home", 20, eleven("h", { D1: man("Meunier", "D", null, 0, 1, { ...tie, club: "Sunderland" }), D2: man("Hume", "D", null, 0, 1, { ...tie, club: "Sunderland" }) }));
    const away = side("Away", 20, eleven("a", { F9: man("Haaland", "F", null, 0, 1, { ...tie, club: "Man City" }) }));
    expect(matchupState({ home, away }, worth, limits, "saturday").stillToPlay).toContain("Man City v Sunderland: Meunier and Hume for Home, Haaland for Away");
    const mates = side("Away", 20, eleven("a", { F9: man("Ballard", "D", null, 0, 1, { ...tie, club: "Sunderland" }) }));
    expect(matchupState({ home, away: mates }, worth, limits, "saturday").stillToPlay.filter((l) => l.startsWith("Man City v"))).toEqual([]);
  });
});
