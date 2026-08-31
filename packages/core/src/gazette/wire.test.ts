import { describe, expect, it } from "vitest";
import type { Deal } from "./types";
import { wireFacts } from "./wire";

/** Newest first, the way the feed arrives. */
const deal = (over: Partial<Deal> = {}): Deal => ({
  setId: "s1",
  kind: "claim",
  inbound: [],
  outbound: [],
  processedAt: null,
  period: 2,
  ...over,
});

describe("wireFacts", () => {
  it("counts claims and drops per manager, busiest first", () => {
    const facts = wireFacts([
      deal({ inbound: [{ playerName: "A", teamId: "t1" }], outbound: [{ playerName: "B", teamId: "t1" }] }),
      deal({ setId: "s2", inbound: [{ playerName: "C", teamId: "t2" }] }),
    ]);
    expect(facts.teams[0]).toEqual({ teamId: "t1", claimed: 1, dropped: 1 });
    expect(facts.teams[1]).toEqual({ teamId: "t2", claimed: 1, dropped: 0 });
    expect(facts.deals).toBe(2);
  });

  it("names a man the wire keeps passing around, and only past the threshold", () => {
    const facts = wireFacts([
      deal({ setId: "s2", inbound: [{ playerName: "Nketiah", teamId: "t2" }] }),
      deal({ setId: "s1", outbound: [{ playerName: "Nketiah", teamId: "t1" }], inbound: [{ playerName: "Solo", teamId: "t1" }] }),
    ]);
    expect(facts.passedAround.map((p) => p.playerName)).toEqual(["Nketiah"]);
    expect(facts.passedAround[0].moves).toBe(2);
  });

  it("reads the LAST thing that happened to a man, not the first", () => {
    // The feed is newest-first; walked in that order, a player dropped last
    // week and reclaimed today would read as binned.
    const facts = wireFacts([
      deal({ setId: "s2", inbound: [{ playerName: "Nketiah", teamId: "t2" }] }),
      deal({ setId: "s1", outbound: [{ playerName: "Nketiah", teamId: "t1" }] }),
    ]);
    expect(facts.binned).toEqual([]);
    expect(facts.passedAround[0].dropped).toBe(false);
  });

  it("counts a trade as a sale rather than an obituary", () => {
    // A man moved between managers was wanted by somebody. Only a drop with
    // nobody on the other side is a binning.
    const traded = wireFacts([
      deal({ kind: "trade", outbound: [{ playerName: "Saka", teamId: "t1" }], inbound: [{ playerName: "Palmer", teamId: "t1" }] }),
    ]);
    expect(traded.binned).toEqual([]);

    const binned = wireFacts([deal({ kind: "claim", outbound: [{ playerName: "Saka", teamId: "t1" }] })]);
    expect(binned.binned).toEqual(["Saka"]);
  });

  it("answers a quiet window honestly rather than inventing activity", () => {
    const facts = wireFacts([]);
    expect(facts).toEqual({ teams: [], passedAround: [], binned: [], deals: 0 });
  });
});
