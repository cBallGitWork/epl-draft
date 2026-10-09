import { describe, expect, it } from "vitest";
import { tradeColumn } from "./hereWeGoWriter";

describe("tradeColumn", () => {
  it("prints the desk's headline and deck over the item, and the sign-off under it in words", () => {
    const job = {
      headline: "Here we go! Gabriel Magalhaes to Truffles",
      deck: "Truffles get Gabriel Magalhaes from Beef for Adrien Truffert",
      transfer: { teamId: "a", team: "Truffles" },
    };
    expect(tradeColumn(job, "  Gabriel Magalhaes joins Truffles. Truffert goes to Beef. \n")).toEqual({
      ...job,
      body: "Gabriel Magalhaes joins Truffles. Truffert goes to Beef.\n\nHere we go!",
    });
  });
});
