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
    const [item] = dealNews([claim], name, null);
    expect(item.headline).toBe("Craig's XI sign Alexander Isak (LIV)");
    // **A sentence, not a ledger.** The body says what the headline did not —
    // the claim's cost — rather than restating its own nouns in a colon list.
    expect(item.body).toBe("Craig's XI have signed Alexander Isak (LIV), releasing Cody Gakpo (LIV) to make room.");
    expect(item.teamId).toBe("t1");
    expect(item.category).toBe("message");
  });

  it("makes a trade ONE item, belonging to neither side", () => {
    // Fantrax files both halves as separate rows sharing a `setId`. Reading them
    // apart is how you get a feed that says a manager signed a player and,
    // separately and mysteriously, lost one.
    const items = dealNews([trade], name, null);
    expect(items).toHaveLength(1);
    expect(items[0].headline).toBe("Craig's XI and Dave's XI agree a trade");
    expect(items[0].teamId).toBeNull();
  });

  // Fantrax may file a 1-for-1 as two INBOUND sides: each side's own `teamId` names its destination however split.
  it("names each man's destination in a trade", () => {
    const [item] = dealNews([trade], name, null);
    expect(item.body).toBe("The trade has gone through: Declan Rice joins Craig's XI.");
  });

  it("says a claim's cost rather than restating its headline", () => {
    const [item] = dealNews([{ ...claim, outbound: [] }], name, null);
    expect(item.body).toBe("Craig's XI have signed Alexander Isak (LIV).");
  });

  it("says where a released man went", () => {
    const [item] = dealNews([{ ...claim, inbound: [] }], name, null);
    expect(item.body).toBe("Craig's XI have released Cody Gakpo (LIV). He's back in the pool.");
  });

  it("never marks business urgent", () => {
    // A manager who made a deal already knows he made it, and a rival's is not
    // bad news. CM's red ground is for something else.
    expect(dealNews([claim, trade], name, null).every((item) => !item.urgent)).toBe(true);
  });

  it("keeps a manager the league no longer names, rather than dropping his deal", () => {
    const orphan: Deal = { ...claim, setId: "s3", inbound: [{ playerName: "X", teamId: "gone" }], outbound: [] };
    const [item] = dealNews([orphan], name, null);
    expect(item.headline).toBe("A manager sign X");
  });

  it("drops a deal with nobody on either side", () => {
    expect(dealNews([{ ...claim, setId: "s4", inbound: [], outbound: [] }], name, null)).toEqual([]);
  });

  it("writes the reader's own business as his assistant would", () => {
    const waiver: Deal = {
      ...claim,
      via: "waivers",
      inbound: [{ playerName: "Brian Brobbey", teamId: "t1", club: "SUN", clubName: "Sunderland" }],
      outbound: [{ playerName: "Kjell Scherpen", teamId: "t1", club: "IPS", clubName: "Ipswich" }],
    };
    const [item] = dealNews([waiver], name, "t1");
    expect(item.from).toBe("Your assistant");
    expect(item.headline).toBe("You sign Brian Brobbey (SUN)");
    expect(item.body).toBe(
      "Your waiver claim for Sunderland's Brian Brobbey went through, and Ipswich's Kjell Scherpen goes back into the pool to make room.",
    );
    expect(dealNews([{ ...waiver, via: "free agency", outbound: [] }], name, "t1")[0].body).toBe(
      "We've signed Sunderland's Brian Brobbey as a free agent.",
    );
  });

  it("writes a rival's business as the commissioner would", () => {
    const [item] = dealNews([{ ...claim, via: "waivers" }], name, "t2");
    expect(item.from).toBe("The commissioner");
    expect(item.body).toBe("Craig's XI have claimed Alexander Isak (LIV) off waivers, releasing Cody Gakpo (LIV) to make room.");
    expect(dealNews([trade], name, "t1")[0].body).toBe("Your trade has gone through: Declan Rice joins you.");
    expect(dealNews([trade], name, "t1")[0].from).toBe("Your assistant");
  });
});
