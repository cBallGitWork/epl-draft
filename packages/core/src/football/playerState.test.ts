import { describe, expect, it } from "vitest";
import { NO_SEASON } from "./noSeason";
import { availabilityOf, isDoubtful } from "./playerState";
import type { FootballPlayer } from "./types";

function player(over: Partial<FootballPlayer> = {}): FootballPlayer {
  return {
    id: 1,
    code: 100,
    name: "Player",
    fullName: "A Player",
    clubId: 1,
    status: "a",
    news: "",
    chanceOfPlaying: null,
    optaCode: null, season: NO_SEASON,
    ...over,
  };
}

describe("availabilityOf", () => {
  it("is silent for a fit man", () => {
    expect(availabilityOf(player()).state).toBe("fit");
    expect(availabilityOf(player()).label).toBe("");
  });

  it("is silent for a man the bridge has not settled", () => {
    // The pool carries academy names FPL has never listed. Absence is not a doubt.
    expect(availabilityOf(null).state).toBe("fit");
  });

  it("reads 100% with nothing written against it as FPL saying he is fine", () => {
    expect(availabilityOf(player({ chanceOfPlaying: 100 })).state).toBe("fit");
  });

  it("gives each letter its own word", () => {
    expect(availabilityOf(player({ status: "i" })).label).toBe("Inj");
    expect(availabilityOf(player({ status: "s" })).label).toBe("Sus");
    expect(availabilityOf(player({ status: "u" })).label).toBe("Unav");
    expect(availabilityOf(player({ status: "d" })).label).toBe("Dbt");
  });

  it("marks the three that mean he is not playing as out", () => {
    for (const status of ["i", "s", "u"]) {
      expect(availabilityOf(player({ status })).out).toBe(true);
    }
  });

  it("leaves a doubt at full strength, because he might yet play", () => {
    const doubt = availabilityOf(player({ status: "d", chanceOfPlaying: 75 }));
    expect(doubt.state).toBe("doubt");
    expect(doubt.out).toBe(false);
  });

  it("treats a stated nought as out whatever letter it arrives under", () => {
    expect(availabilityOf(player({ status: "d", chanceOfPlaying: 0 })).out).toBe(true);
    // The word stays the letter's — "why not" is what the box answers.
    expect(availabilityOf(player({ status: "d", chanceOfPlaying: 0 })).label).toBe("Dbt");
  });

  it("calls an available letter carrying news a doubt", () => {
    // FPL's commonest doubt: a knock that never became a status.
    const knock = availabilityOf(player({ news: "Knock - 75% chance of playing" }));
    expect(knock.state).toBe("doubt");
    expect(knock.out).toBe(false);
  });

  it("carries the chance and the untruncated news through", () => {
    const a = availabilityOf(player({ status: "i", news: "Knee injury - Expected back 15 Sep", chanceOfPlaying: 0 }));
    expect(a.news).toBe("Knee injury - Expected back 15 Sep");
    expect(a.chance).toBe(0);
  });
});

describe("isDoubtful", () => {
  // It had two callers before this module existed and must answer identically,
  // or a doubt appears on one tab and not the next — the fault its own comment
  // records.
  it("answers exactly as the rule it replaced", () => {
    expect(isDoubtful(player())).toBe(false);
    expect(isDoubtful(player({ chanceOfPlaying: 100 }))).toBe(false);
    expect(isDoubtful(player({ status: "i" }))).toBe(true);
    expect(isDoubtful(player({ status: "d" }))).toBe(true);
    expect(isDoubtful(player({ news: "Knock" }))).toBe(true);
    expect(isDoubtful(player({ chanceOfPlaying: 50 }))).toBe(true);
    expect(isDoubtful(player({ chanceOfPlaying: 100, news: "Knock" }))).toBe(true);
  });
});
