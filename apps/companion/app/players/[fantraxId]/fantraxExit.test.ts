import { describe, expect, it } from "vitest";
import { FANTRAX_LEAGUE_ID, FANTRAX_LEAGUE_PAGE, FANTRAX_PLAYER_BASE } from "@epl/core";
import { fantraxExit } from "./fantraxExit";

describe("fantraxExit", () => {
  it("offers a trade on the roster of the team that holds him, with Fantrax's trade panel up", () => {
    // Craig, 1 Oct 2026: "trade link should go to ... team/roster;teamId=98yx3o50mtj36y3g?tx=true".
    expect(fantraxExit("078wl", "98yx3o50mtj36y3g", "reader")).toEqual({
      label: "Offer a trade on Fantrax",
      href: `${FANTRAX_LEAGUE_PAGE}/team/roster;teamId=98yx3o50mtj36y3g?tx=true`,
    });
  });

  it("sends a free agent and the reader's own man to his page in the league", () => {
    const page = `${FANTRAX_PLAYER_BASE}/04fk1/${FANTRAX_LEAGUE_ID}`;
    expect(fantraxExit("04fk1", null, "reader")).toEqual({ label: "Claim him on Fantrax", href: page });
    expect(fantraxExit("04fk1", "reader", "reader")).toEqual({ label: "Open on Fantrax", href: page });
  });

  it("offers a trade when nobody is signed in and he is held", () => {
    expect(fantraxExit("04fk1", "owner", null).label).toBe("Offer a trade on Fantrax");
  });
});
