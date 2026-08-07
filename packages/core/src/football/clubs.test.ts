import { describe, expect, it } from "vitest";
import { clubColours, crestUrl, inkOn } from "./clubs";

const DARK_INK = "#0b0c10";
const WHITE_INK = "#ffffff";

const ink = (shortName: string) => inkOn(clubColours(shortName));

describe("clubColours", () => {
  it("is keyed on FPL's short name, not Fantrax's", () => {
    // Forest is "NFO" to FPL and "NOT" to Fantrax. A league-layer label arriving
    // here does not throw — it quietly takes the neutral and the club loses its
    // colours, which is why the two layers never join on short name.
    expect(clubColours("NFO").primary).toBe("#DD0000");
    expect(clubColours("NOT")).toEqual(clubColours("WBA"));
  });

  it("gives a club we have not styled a neutral that still carries a label", () => {
    // Three clubs come up every May and reach the API before the palette does.
    // A hole where a crest should be is a worse answer than a grey one.
    expect(clubColours("WBA")).toEqual({ primary: "#4b5563", secondary: "#FFFFFF" });
    expect(ink("WBA")).toBe(WHITE_INK);
  });
});

describe("crestUrl", () => {
  it("keys the crest on the season-stable club code", () => {
    // `code` survives relegation and return; `id` is renumbered each August, so a
    // URL built from it would start pointing at a different club.
    expect(crestUrl({ code: 3 })).toBe(
      "https://resources.premierleague.com/premierleague/badges/t3.svg",
    );
  });
});

describe("inkOn", () => {
  it("puts dark ink on the near-white shirts", () => {
    // The whole reason the function exists: white initials on Fulham, Leeds or
    // Spurs are invisible, and the portrait fallback underneath is all a January
    // signing has for weeks.
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
    // The close calls: Rec. 601 luma is 0.62 for City and 0.73 for Coventry
    // against a 0.6 cut. City clears it by a whisker, so any nudge to the
    // threshold or to that hex flips its label from black to white.
    expect(ink("MCI")).toBe(DARK_INK);
    expect(ink("COV")).toBe(DARK_INK);
  });
});
