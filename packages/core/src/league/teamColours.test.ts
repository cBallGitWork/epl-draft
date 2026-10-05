import { describe, expect, it } from "vitest";
import { inkOn } from "../football/clubs";
import { teamColours } from "./teamColours";

// A test file may cross the layers where the source may not: it is proving that
// the two independently-declared shapes still fit together, which is exactly the
// claim the split makes and the one thing worth checking.

/** WCAG 2.1's own arithmetic, written out here rather than imported: the point
 *  of the test is to check the source independently, and a test that reuses the
 *  function it is checking proves only that it agrees with itself. */
function ratio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const h = hex.replace("#", "");
    const [r, g, b2] = [0, 2, 4]
      .map((at) => parseInt(h.slice(at, at + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("teamColours", () => {
  it("gives a listed team its own colour", () => {
    expect(teamColours("pbxm9fgimshcpazf").primary).toBe("#0b5cd5");
  });

  it("falls back for a team nobody has styled", () => {
        expect(teamColours("a-real-league-id-nobody-has-added")).toEqual(
      teamColours("another-unlisted-id"),
    );
  });

  it("never returns nothing, whatever it is asked", () => {
    expect(teamColours("").primary).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("gives every team's plate an ink that clears the AA floor", () => {
    // The whole point of the table, and the check `sweep` had to make on the
    // rendered page before anyone thought to make it here. Three of the ten
    // colours failed when `inkOn` picked by brightness rather than by contrast
    // — the orange was at 2.69:1, well under half the floor.
    const ids = [
      "pbxm9fgimshcpazf", "j9zadacnmshcpazf", "8enbgqo5msgb375j", "jtsmt5jxmtj31znh",
      "sezrgvl2mshcpazf", "dq2yk3zxmtj31znh", "v6bxgqm5mtj31znh", "yf96763gmtj31zni",
      "mxet9tt7mtj31zni", "vzqubu25mtj31zni",
      "1b6gp5utmtj36y3g", "y6viv6jfmtj36y3g", "98yx3o50mtj36y3g", "hy0w28p5mtj36y3g",
      "deo9ljvtmtj36y3g", "fq5omv5kmtj36y3g", "dpdkp2bbmtj36y3g", "g80h3bf5mtj36y3g",
      "pzmd243ymtj36y3g", "kg18w2cvmtj36y3g",
      "l5kunst8msgbirdf", "kpj0z744muh1qwtd", "7to6xosimu8hyyw5", "0g0j5mkomuqqwsbu",
      "qgucu9dgmufwva1x",
      "nobody-has-styled-this-one",
    ];

    for (const id of ids) {
      const colours = teamColours(id);
      expect(ratio(colours.primary, inkOn(colours)), id).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("hands every plate an ink that reads on it", () => {
    // The white-Torquay case (`cm9900/16.jpg`): a pale team must get dark ink
    // rather than white-on-white. `inkOn` is the football layer's and takes a
    // colour rather than a club, so a league object may hand it one.
    const pale = teamColours("mxet9tt7mtj31zni"); // testf, #d9d2c5
    const dark = teamColours("pbxm9fgimshcpazf"); // test2, #0b5cd5

    expect(inkOn(pale)).toBe("#0b0c10");
    expect(inkOn(dark)).toBe("#ffffff");
  });
});
