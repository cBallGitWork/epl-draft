import { describe, expect, it } from "vitest";
import { matchHref } from "./matchRoutes";

describe("matchHref", () => {
  it("puts a tab under the match, and the Overview at the bare match", () => {
    expect(matchHref(41, "overview")).toBe("/prem/match/41");
    expect(matchHref(41, "zones")).toBe("/prem/match/41/zones");
  });

  it("keeps a default out of the URL and the rest in the order given", () => {
    expect(matchHref(41, "players", { side: undefined, view: "pitch" })).toBe("/prem/match/41/players?view=pitch");
    expect(matchHref(41, "stats", { view: "home", sort: "xG", dir: "asc" })).toBe(
      "/prem/match/41/stats?view=home&sort=xG&dir=asc",
    );
  });
});
