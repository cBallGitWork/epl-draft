import { describe, expect, it } from "vitest";
import { LIMITS } from "./__fixtures__/limits";
import { draftMan as man, goalAt } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { worthOf } from "./__fixtures__/worth";
import { lateDecider, matchupState, opposedMatches } from "./state";

const worth = worthOf();

describe("matchupState", () => {
  it("gives the score as the page prints it: the side ahead first, the certain substitutions counted", () => {
    const home = draftSide("Home", 30, eleven("h", { 1: man("Blank", "D", null, 0) }), [man("Vuskovic", "D", 6, 90)]);
    const away = draftSide("Away", 33, eleven("a"));
    expect(matchupState({ home, away }, LIMITS, "saturday").score).toBe("Home lead Away 36-33");
    expect(matchupState({ home, away }, LIMITS, "gameweek").score).toBe("Home beat Away 36-33");
    expect(matchupState({ home: draftSide("Home", 33, eleven("h")), away }, LIMITS, "gameweek").score).toBe("Home and Away drew 33-33");
  });

  it("prints a side Fantrax gave no total as a dash, never a nought it lost by", () => {
    const unscored = { ...draftSide("Dons", 0, eleven("h")), total: null };
    expect(matchupState({ home: unscored, away: draftSide("Rovers", 30, eleven("a")) }, LIMITS, "gameweek").score).toBe("Dons —, Rovers 30");
  });

  it("finds the late goal worth more than the margin that decided it, the last in time, not the latest minute", () => {
    const decider = (men: Record<number, ReturnType<typeof man>>) => lateDecider(matchupState({ home: draftSide("Home", 38, eleven("h", men)), away: draftSide("Away", 37, eleven("a")) }, LIMITS, "gameweek").home, 1, worth);
    expect(decider({ 9: man("Haaland", "F", 6, 90, 0, { goals: 1, scoredAt: [goalAt(81)] }) })?.m.name).toBe("Haaland");
    expect(decider({ 9: man("Haaland", "F", 6, 90, 0, { goals: 1, scoredAt: [goalAt(79)] }) })).toBeNull();
    const twoDays = { 8: man("Groß", "M", 7, 90, 0, { goals: 1, scoredAt: [goalAt(88)] }), 9: man("Haaland", "F", 6, 90, 0, { goals: 1, scoredAt: [goalAt(81, undefined, "2026-09-27T15:30:00Z")] }) };
    expect(decider(twoDays)?.m.name).toBe("Haaland");
  });

  it("names a Premier League match still to play with the sides' men on opposing clubs, and not club-mates", () => {
    const tie = { matches: [{ code: 7, label: "Man City v Sunderland" }] };
    const home = draftSide("Home", 20, eleven("h", { 1: man("Meunier", "D", null, 0, 1, { ...tie, club: "Sunderland" }), 2: man("Hume", "D", null, 0, 1, { ...tie, club: "Sunderland" }) }));
    const away = draftSide("Away", 20, eleven("a", { 9: man("Haaland", "F", null, 0, 1, { ...tie, club: "Man City" }) }));
    expect(opposedMatches(home, away)).toEqual(["Man City v Sunderland: Meunier and Hume for Home, Haaland for Away"]);
    const mates = draftSide("Away", 20, eleven("a", { 9: man("Ballard", "D", null, 0, 1, { ...tie, club: "Sunderland" }) }));
    expect(opposedMatches(home, mates)).toEqual([]);
  });
});
