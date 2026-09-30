import { describe, expect, it } from "vitest";
import { LIMITS } from "./__fixtures__/limits";
import { draftMan as man, goalAt } from "./__fixtures__/draftMan";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { worthOf } from "./__fixtures__/worth";
import { lateDecider, matchupState } from "./state";

const worth = worthOf();

describe("matchupState", () => {
  it("names the man whose goal would win it once three or fewer are left, with no figure and no sums restated", () => {
    const state = matchupState({ home: draftSide("Home", 40, eleven("h")), away: draftSide("Away", 36, eleven("a", { 5: man("Salah", "M", null, 0, 1, { next: { opponent: "Everton", home: false, kickoff: "2026-09-20T15:30:00Z" } }) })) }, worth, LIMITS, "saturday");
    expect(state.score).toBe("Home lead Away 40-36");
    expect(state.stillToPlay).toEqual(["Away have 1 still to play: Salah (Club, away to Everton on Sunday)", "a goal from Salah would win it"]);
  });

  it("works no sums while more than three are left", () => {
    const five = eleven("a", { 9: man("a9", "F", null, 0, 1), 10: man("a10", "F", null, 0, 1), 8: man("a8", "M", null, 0, 1), 7: man("a7", "M", null, 0, 1) });
    const state = matchupState({ home: draftSide("Home", 20, eleven("h")), away: draftSide("Away", 10, five) }, worth, LIMITS, "saturday");
    expect(state.stillToPlay).toHaveLength(1);
  });

  it("gives the score as the page prints it: the side ahead first, the certain substitutions counted", () => {
    const home = draftSide("Home", 30, eleven("h", { 1: man("Blank", "D", null, 0) }), [man("Vuskovic", "D", 6, 90)]);
    const away = draftSide("Away", 33, eleven("a"));
    expect(matchupState({ home, away }, worth, LIMITS, "saturday").score).toBe("Home lead Away 36-33");
    expect(matchupState({ home, away }, worth, LIMITS, "gameweek").score).toBe("Home beat Away 36-33");
    expect(matchupState({ home: draftSide("Home", 33, eleven("h")), away }, worth, LIMITS, "gameweek").score).toBe("Home and Away drew 33-33");
  });

  it("finds the late goal worth more than the margin that decided it, the last in time, not the latest minute", () => {
    const decider = (men: Record<number, ReturnType<typeof man>>) => lateDecider(matchupState({ home: draftSide("Home", 38, eleven("h", men)), away: draftSide("Away", 37, eleven("a")) }, worth, LIMITS, "gameweek").home, 1, worth);
    expect(decider({ 9: man("Haaland", "F", 6, 90, 0, { goals: 1, scoredAt: [goalAt(81)] }) })?.m.name).toBe("Haaland");
    expect(decider({ 9: man("Haaland", "F", 6, 90, 0, { goals: 1, scoredAt: [goalAt(79)] }) })).toBeNull();
    const twoDays = { 8: man("Groß", "M", 7, 90, 0, { goals: 1, scoredAt: [goalAt(88)] }), 9: man("Haaland", "F", 6, 90, 0, { goals: 1, scoredAt: [goalAt(81, undefined, "2026-09-27T15:30:00Z")] }) };
    expect(decider(twoDays)?.m.name).toBe("Haaland");
  });

  it("names a Premier League match with the sides' men on opposing clubs, still to play or with a return in it", () => {
    const tie = { matches: [{ code: 7, label: "Man City v Sunderland" }] };
    const home = draftSide("Home", 20, eleven("h", { 1: man("Meunier", "D", null, 0, 1, { ...tie, club: "Sunderland" }), 2: man("Hume", "D", null, 0, 1, { ...tie, club: "Sunderland" }) }));
    const away = draftSide("Away", 20, eleven("a", { 9: man("Haaland", "F", null, 0, 1, { ...tie, club: "Man City" }) }));
    expect(matchupState({ home, away }, worth, LIMITS, "saturday").stillToPlay).toContain("Man City v Sunderland: Meunier and Hume for Home, Haaland for Away");
    const mates = draftSide("Away", 20, eleven("a", { 9: man("Ballard", "D", null, 0, 1, { ...tie, club: "Sunderland" }) }));
    expect(matchupState({ home, away: mates }, worth, LIMITS, "saturday").stillToPlay.filter((l) => l.startsWith("Man City v"))).toEqual([]);
  });
});
