import { describe, expect, it } from "vitest";
import { BANNED, americanisms, banned, overused } from "./banned";

// The two failures this exists for, both printed: five headlines on "bank" in
// one edition, and "Isidor Off The Bench Wins It Short" filed by a writer that
// had just been told never to write it.

describe("banned", () => {
  it("catches the tic that got onto a front page five times", () => {
    expect(banned("test3 Banks a City Slicker")).toContain("banks");
    expect(banned("Sunderland Bank The Sheet")).toContain("bank");
  });

  it("catches a substitution claim, which a minutes figure never supports", () => {
    expect(banned("Isidor Off The Bench Wins It Short")).toContain("off the bench");
  });

  it("catches a ground, which we are never given and can only be recalling", () => {
    expect(banned("Gibbs-White Ten The Hard Way At Anfield")).toContain("Anfield");
  });

  it("does not fire inside a longer word, so a surname is not a warning", () => {
    // A check that cries wolf on a name is a check a human stops reading.
    expect(banned("Bankole kept a clean sheet")).toEqual([]);
    expect(banned("Cameron came through it")).toEqual([]);
  });

  it("names a phrase once however often it is used", () => {
    expect(banned("He banked it, then banked another, and banked a third")).toEqual(["banked"]);
  });

  it("is silent on prose that breaks nothing", () => {
    expect(banned("Cherki hauled eleven from midfield and testf had no answer.")).toEqual([]);
  });

  it("lists every phrase in lower case except the proper nouns", () => {
    // The list is interpolated straight into the prompt, so it is read by a
    // human as well as matched by a regex: a stray capital reads as emphasis.
    const odd = BANNED.filter(
      (phrase) => phrase !== phrase.toLowerCase() && !/^(the )?[A-Z]/.test(phrase),
    );
    expect(odd).toEqual([]);
  });
});

describe("americanisms", () => {
  it("names the listed American words in list order, then the first -ize, and spares size and prize", () => {
    expect(americanisms("The defense realized it and organized a lineup.")).toEqual(["lineup", "defense", "realized"]);
    expect(americanisms("A prize for the size of the squad.")).toEqual([]);
    expect(americanisms("The defense realized it.", [])).toEqual(["realized"]);
  });
});

describe("overused", () => {
  it("files each phrase past its cap with the times it was used, whole words only", () => {
    expect(overused("On paper, on paper, on paper. Paperwork.", [["on paper", 2], ["paper", 3]])).toEqual(["on paper ×3"]);
  });
});
