import { describe, expect, it } from "vitest";
import { initials, portraitUrl } from "./portraits";

describe("initials", () => {
  it("takes the first letter of the first and last word", () => {
    expect(initials("João Pedro")).toBe("JP");
    expect(initials("Strand Larsen")).toBe("SL");
    expect(initials("Juanlu Sanchez")).toBe("JS");
  });

  it("reads through the punctuation FPL puts in a display name", () => {
    // Both are live pool names, not inventions: FPL abbreviates a given name to
    // an initial and sometimes drops the space after the dot.
    expect(initials("Bruno G.")).toBe("BG");
    expect(initials("E.Le Fée")).toBe("EF");
  });

  it("gives a mononym two letters rather than one", () => {
    // Most of the league is known by a single name, so this is the common path,
    // not the edge: a one-letter tile reads as a typo.
    expect(initials("Haaland")).toBe("HA");
    expect(initials("Ødegaard")).toBe("ØD");
  });

  it("answers with a placeholder for a nameless player rather than throwing", () => {
    // The tile renders before the bridge has resolved a name, and a whitespace
    // name is what a trimmed-empty Fantrax slot arrives as.
    expect(initials("")).toBe("?");
    expect(initials("   ")).toBe("?");
  });
});

describe("portraitUrl", () => {
  it("keys the asset on the season-stable code, not the per-season id", () => {
    expect(portraitUrl({ code: 223094 })).toContain("/223094.png");
  });

  it("builds the path the Premier League actually serves today", () => {
    // Asserted whole: the old path still answers 200 with two-year-old photographs.
    expect(portraitUrl({ code: 223094 })).toBe(
      "https://resources.premierleague.com/premierleague25/photos/players/110x140/223094.png",
    );
  });

  it("does not prefix the file with p, which the crest-era path did", () => {
    expect(portraitUrl({ code: 223094 })).not.toContain("/p223094");
  });

  it("stays on the small size unless asked, so no caller changes by accident", () => {
    expect(portraitUrl({ code: 223094 })).toBe(portraitUrl({ code: 223094 }, "small"));
  });

  it("builds the large path the Premier League also serves", () => {
    // Whole again: 250x250 and 330x330 both 403 under this prefix.
    expect(portraitUrl({ code: 223094 }, "large")).toBe(
      "https://resources.premierleague.com/premierleague25/photos/players/500x500/223094.png",
    );
  });
});

