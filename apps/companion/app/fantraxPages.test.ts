import { describe, expect, it } from "vitest";
import { FANTRAX_LEAGUE_PAGE, FANTRAX_MATCHUPS_PATH } from "@epl/core";
import { fantraxPage } from "./fantraxPages";

describe("fantraxPage", () => {
  it("hangs a path off the league's page", () => {
    expect(fantraxPage("home")).toBe(`${FANTRAX_LEAGUE_PAGE}/home`);
  });

  it("asks for a period in Fantrax's own matrix form", () => {
    expect(fantraxPage(FANTRAX_MATCHUPS_PATH, 7)).toBe(`${FANTRAX_LEAGUE_PAGE}/${FANTRAX_MATCHUPS_PATH};period=7`);
  });

  it("leaves the period to Fantrax when we could not read one", () => {
    expect(fantraxPage(FANTRAX_MATCHUPS_PATH, null)).toBe(`${FANTRAX_LEAGUE_PAGE}/${FANTRAX_MATCHUPS_PATH}`);
  });
});
