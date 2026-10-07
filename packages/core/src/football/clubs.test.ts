import { describe, expect, it } from "vitest";
import { clubColours, clubColoursOf, crestForShortName, crestUrl, inkOn, shirtUrl } from "./clubs";

const DARK_INK = "#0b0c10";
const WHITE_INK = "#ffffff";

const ink = (shortName: string) => inkOn(clubColours(shortName));

describe("clubColours", () => {
  it("is keyed on FPL's short name, not Fantrax's", () => {
    // Forest is "NFO" to FPL and "NOT" to Fantrax: a Fantrax label quietly takes the neutral.
    expect(clubColours("NFO").primary).toBe("#DD0000");
    expect(clubColours("NOT")).toEqual(clubColours("WBA"));
  });

  it("gives a club we have not styled a neutral that still carries a label", () => {
    // A promoted club reaches the API before the palette does; grey beats a hole.
    expect(clubColours("WBA")).toEqual({ primary: "#4b5563", secondary: "#FFFFFF" });
    expect(ink("WBA")).toBe(WHITE_INK);
  });
});

describe("clubColoursOf", () => {
  it("reads a club's colours off its short name, and the neutral for no club at all", () => {
    expect(clubColoursOf({ shortName: "NFO" })).toEqual(clubColours("NFO"));
    expect(clubColoursOf(undefined)).toEqual(clubColours("WBA"));
  });
});

describe("crestUrl", () => {
  it("keys the crest on the season-stable club code", () => {
    // `id` is renumbered each August, so a URL built from it would point at another club.
    expect(crestUrl({ code: 3 })).toBe(
      "https://resources.premierleague.com/premierleague/badges/t3.svg",
    );
  });
});

describe("inkOn", () => {
  it("puts dark ink on the near-white shirts", () => {
    // White initials on Fulham, Leeds or Spurs are invisible.
    expect(ink("FUL")).toBe(DARK_INK);
    expect(ink("LEE")).toBe(DARK_INK);
    expect(ink("TOT")).toBe(DARK_INK);
  });

  it("reads Hull's amber as light too, not only the whites", () => {
    expect(ink("HUL")).toBe(DARK_INK);
  });

  it("keeps white ink on the deep shirts", () => {
    expect(ink("NEW")).toBe(WHITE_INK);
    expect(ink("CHE")).toBe(WHITE_INK);
    expect(ink("AVL")).toBe(WHITE_INK);
  });

  it("calls both sky blues light", () => {
    // The close calls: dark ink must out-contrast white on both, so a nudge to either hex can flip it.
    expect(ink("MCI")).toBe(DARK_INK);
    expect(ink("COV")).toBe(DARK_INK);
  });
});

describe("shirtUrl", () => {
  const arsenal = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" };

  it("keys on the stable club code, like the crest does", () => {
    expect(shirtUrl(arsenal, false)).toBe(
      "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_3-220.png",
    );
  });

  it("asks for the keeper's own kit, which is a different shirt and not a tint", () => {
    expect(shirtUrl(arsenal, true)).toBe(
      "https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_3_1-220.png",
    );
  });
});

describe("crestForShortName", () => {
  it("finds the crest for a club named the way FPL names it", () => {
    expect(crestForShortName("ARS")).toContain("/badges/t3.svg");
  });

  it("knows every club this division has, and knows it has colours too", () => {
    // The colour and code tables must hold the same twenty clubs; update this list on promotion day.
    const division = [
      "ARS", "AVL", "BHA", "BOU", "BRE", "CHE", "COV", "CRY", "EVE", "FUL",
      "HUL", "IPS", "LEE", "LIV", "MCI", "MUN", "NEW", "NFO", "SUN", "TOT",
    ];
    for (const shortName of division) {
      expect(crestForShortName(shortName), shortName).not.toBeNull();
      expect(clubColours(shortName).primary, shortName).not.toBe(clubColours("XYZ").primary);
    }
  });

  it("answers null for a club it has never seen, rather than a wrong badge", () => {
    // A promoted side before the tables are updated: a wrong crest is worse than none.
    expect(crestForShortName("XYZ")).toBeNull();
  });
});
