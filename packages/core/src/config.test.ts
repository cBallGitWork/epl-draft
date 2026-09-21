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
  it("is on the dummy league and on no other", () => {
    const withDemo = FANTRAX_LEAGUES.filter((league) => league.demoTeamId !== undefined);
    expect(withDemo.map((league) => league.key)).toEqual(["dummy"]);
  });

  it("is never on the league we actually serve from 10 Oct", () => {
    const real = FANTRAX_LEAGUES.find((league) => league.key === "real");
    expect(real?.demoTeamId).toBeUndefined();
  });
});
