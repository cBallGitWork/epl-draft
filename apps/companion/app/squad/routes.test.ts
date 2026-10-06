import { describe, expect, it } from "vitest";
import { LEAGUE } from "../league/routes";
import { OWN, teamBack } from "./routes";

/** A Fantrax team id, which is sixteen characters of base-36. */
const RIVAL = "1b6gp5utmtj36y3g";

describe("a team's way back on a phone", () => {
  it("falls back to the league table on a rival's squad", () => {
    expect(teamBack(RIVAL)).toBe(LEAGUE);
  });

  it("is not drawn on your own team, which has its own tab", () => {
    expect(teamBack(OWN)).toBeUndefined();
  });
});
