import { describe, expect, it } from "vitest";
import { FANTRAX_LEAGUES } from "./config";

// The league table has one field that would be a bug if it ever appeared on the
// wrong row, so that is what this holds.

describe("the demo team", () => {
  // **The whole safety argument, as a test.** `demoTeamId` hands the app an
  // identity nobody signed in for. That is right for a league of ten test teams
  // and wrong for the league ten friends actually play in — and the protection
  // is that the field hangs off the league entry rather than off a flag, so the
  // 10 Oct swap removes it without anybody remembering to. If a demo team ever
  // lands on `real`, the swap stops being safe and this fails.
  // **The invariant is "never on `real`", not "only on dummy".** It was the
  // second of those for half a day, which was a test written against one
  // league's convenience rather than against the thing that would be a bug: the
  // rehearsal league is what production serves, so it needs a demo team too, and
  // a test that forbade it would have been read as a rule rather than as the
  // accident it was.
  it("is never on the league ten friends actually play in", () => {
    const real = FANTRAX_LEAGUES.find((league) => league.key === "real");
    expect(real?.demoTeamId).toBeUndefined();
  });

  it("is on every league that is not real, so it shows wherever we are pointed", () => {
    const without = FANTRAX_LEAGUES.filter((league) => league.demoTeamId === undefined);
    expect(without.map((league) => league.key)).toEqual(["real"]);
  });

  // Two leagues, two ids: a team id is per league and pasting one across is how
  // a demo team silently names nobody.
  it("gives each league its own id", () => {
    const ids = FANTRAX_LEAGUES.map((league) => league.demoTeamId).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
