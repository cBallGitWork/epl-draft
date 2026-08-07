import { describe, expect, it } from "vitest";
import type { PortraitSize } from "./portraits";
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
    expect(portraitUrl({ code: 223094 })).toContain("/p223094.png");
  });

  it("requests the largest size unless told otherwise", () => {
    // The optimizer downscales; asking for a small source can never be undone,
    // so the default must stay the biggest one FPL serves.
    expect(portraitUrl({ code: 223094 })).toBe(
      "https://resources.premierleague.com/premierleague/photos/players/250x250/p223094.png",
    );
  });

  it("honours an explicit size", () => {
    const size: PortraitSize = "40x40";
    expect(portraitUrl({ code: 223094 }, size)).toContain("/40x40/");
  });
});
