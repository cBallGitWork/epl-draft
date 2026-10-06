import { describe, expect, it } from "vitest";
import { ailment, noteBesideChance, readNote } from "./notes";

describe("readNote", () => {
  it("reads an injury with no return date", () => {
    expect(readNote("Knee injury - Unknown return date")).toEqual({
      kind: "injury",
      complaint: "Knee injury",
      outlook: "unknown",
    });
  });

  it("reads an expected return and a chance of playing", () => {
    expect(readNote("Hamstring injury - Expected back 11 Oct")).toMatchObject({ outlook: { back: "11 Oct" } });
    expect(readNote("Calf injury - 50% chance of playing.")).toMatchObject({ outlook: { chance: 50 } });
  });

  it("reads a ban, with and without its end", () => {
    expect(readNote("Suspended until 10 Oct")).toEqual({ kind: "ban", until: "10 Oct" });
    expect(readNote("Suspended")).toEqual({ kind: "ban", until: null });
  });

  it("reads a move as a clause to follow his name", () => {
    expect(readNote("Has joined  Juventus on loan for the rest of the season.")).toEqual({
      kind: "move",
      clause: "has joined Juventus on loan for the rest of the season",
    });
    expect(readNote("has departed the club as a free agent.")).toMatchObject({ kind: "move" });
  });

  it("carries a shape it does not know whole", () => {
    expect(readNote("Knock - Game-time decision")).toEqual({ kind: "other", text: "Knock - Game-time decision" });
  });
});

describe("ailment", () => {
  it("puts FPL's complaint after his name with its article", () => {
    expect(ailment("Knee injury")).toBe("has a knee injury");
    expect(ailment("Ankle injury")).toBe("has an ankle injury");
    expect(ailment("Knock")).toBe("has a knock");
  });

  it("says the awkward ones as a person would", () => {
    expect(ailment("Unspecified injury")).toBe("has an injury");
    expect(ailment("Illness")).toBe("is ill");
    expect(ailment("Lack of match fitness")).toBe("is short of match fitness");
  });
});

describe("noteBesideChance", () => {
  it("drops the chance when the heading already says it", () => {
    // The card's heading already reads "75% CHANCE OF PLAYING".
    expect(noteBesideChance("Ankle injury - 75% chance of playing", 75)).toBe("Ankle injury");
  });

  it("keeps the note whole when it says something the heading does not", () => {
    expect(noteBesideChance("Hamstring injury - Unknown return date", 0)).toBe("Hamstring injury - Unknown return date");
    expect(noteBesideChance("Calf injury - Expected back 11 Oct", 25)).toBe("Calf injury - Expected back 11 Oct");
    expect(noteBesideChance("Suspended until 10 Oct", 0)).toBe("Suspended until 10 Oct");
  });

  it("keeps a figure that disagrees with the heading, or one with no heading beside it", () => {
    expect(noteBesideChance("Knock - 50% chance of playing", 75)).toBe("Knock - 50% chance of playing");
    expect(noteBesideChance("Knock - 50% chance of playing", null)).toBe("Knock - 50% chance of playing");
  });
});
