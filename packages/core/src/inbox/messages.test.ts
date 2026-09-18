import { describe, expect, it } from "vitest";
import type { Deal } from "../gazette/types";
import { dealNews } from "./messages";

const NAMES: Record<string, string> = { t1: "Craig's XI", t2: "Dave's XI" };
const name = (id: string) => NAMES[id] ?? null;

const claim: Deal = {
  setId: "s1",
  kind: "claim",
  inbound: [{ playerName: "Alexander Isak", teamId: "t1", club: "LIV" }],
  outbound: [{ playerName: "Cody Gakpo", teamId: "t1", club: "LIV" }],
  processedAt: "Fri Sep 4, 2026, 7:45PM",
  period: 3,
};

const trade: Deal = {
  setId: "s2",
  kind: "trade",
  inbound: [{ playerName: "Declan Rice", teamId: "t1" }],
  outbound: [{ playerName: "Kai Havertz", teamId: "t2" }],
  processedAt: "Thu Sep 3, 2026, 1:00PM",
  period: 3,
};
describe("dealNews", () => {
  it("names the manager and what he signed", () => {
    const [item] = dealNews([claim], name);
    expect(item.headline).toBe("Craig's XI sign Alexander Isak (LIV)");
    // **A sentence, not a ledger.** The body says what the headline did not —
    // the claim's cost — rather than restating its own nouns in a colon list.
    expect(item.body).toBe(
      "Alexander Isak (LIV) joins Craig's XI off the waiver wire. Cody Gakpo (LIV) makes way.",
    );
    expect(item.teamId).toBe("t1");
    expect(item.category).toBe("message");
  });

  it("makes a trade ONE item, belonging to neither side", () => {
    // Fantrax files both halves as separate rows sharing a `setId`. Reading them
    // apart is how you get a feed that says a manager signed a player and,
    // separately and mysteriously, lost one.
    const items = dealNews([trade], name);
    expect(items).toHaveLength(1);
    expect(items[0].headline).toBe("Craig's XI and Dave's XI agree a trade");
    expect(items[0].teamId).toBeNull();
  });

  // The bug this shape was written against: Fantrax filed a 1-for-1 as two
  // INBOUND sides and no outbound, so a body built from "what came in" and "what
  // went out" said "A and B changes hands" — plural subject, singular verb, and
  // neither destination named. Reading each side's own `teamId` cannot get that
  // wrong however the rows are split.
  it("names each man's destination in a trade", () => {
    const [item] = dealNews([trade], name);
    expect(item.body).toBe("Declan Rice joins Craig's XI.");
  });

  it("says a claim's cost rather than restating its headline", () => {
    const [item] = dealNews([{ ...claim, outbound: [] }], name);
    expect(item.body).toBe("Alexander Isak (LIV) joins Craig's XI off the waiver wire.");
  });

  it("says where a released man went", () => {
    const [item] = dealNews([{ ...claim, inbound: [] }], name);
    expect(item.body).toBe("Cody Gakpo (LIV) leaves Craig's XI and is back in the pool.");
  });

  it("never marks business urgent", () => {
    // A manager who made a deal already knows he made it, and a rival's is not
    // bad news. CM's red ground is for something else.
    expect(dealNews([claim, trade], name).every((item) => !item.urgent)).toBe(true);
  });

  it("keeps a manager the league no longer names, rather than dropping his deal", () => {
    const orphan: Deal = { ...claim, setId: "s3", inbound: [{ playerName: "X", teamId: "gone" }], outbound: [] };
    const [item] = dealNews([orphan], name);
    expect(item.headline).toBe("A manager sign X");
  });

  it("drops a deal with nobody on either side", () => {
    expect(dealNews([{ ...claim, setId: "s4", inbound: [], outbound: [] }], name)).toEqual([]);
  });
});
