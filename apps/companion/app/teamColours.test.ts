import { describe, expect, it } from "vitest";
import { inkOn } from "@epl/core";
import file from "../../../data/leagues/team-colours.json";
import { teamColours } from "./teamColours";

/** WCAG 2.1's own arithmetic, written out rather than imported: a test that reuses the function it checks proves
 *  only that it agrees with itself. */
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
  it("gives a listed team the file's colour", () => {
    expect(teamColours("pbxm9fgimshcpazf").primary).toBe("#0b5cd5");
  });

  it("gives every team's plate an ink that clears the AA floor, the unlisted one included", () => {
    for (const id of [...Object.keys(file.teamColours), "nobody-has-styled-this-one"]) {
      const colours = teamColours(id);
      expect(ratio(colours.primary, inkOn(colours)), id).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("hands a pale plate dark ink and a dark one white", () => {
    // The white-Torquay case (`cm9900/16.jpg`): `inkOn` is the football layer's and takes a colour, not a club.
    expect(inkOn(teamColours("mxet9tt7mtj31zni"))).toBe("#0b0c10"); // testf, #d9d2c5
    expect(inkOn(teamColours("pbxm9fgimshcpazf"))).toBe("#ffffff"); // test2, #0b5cd5
  });
});
