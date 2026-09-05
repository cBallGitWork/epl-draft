import { describe, expect, it } from "vitest";
import type { RawPlFixture } from "./raw";
import { plMatchFacts } from "./matchFacts";

// The shapes are the ones counted on 5 Sep 2026: the detail read's own officials
// list, and the round read's, which has none.

const OFFICIALS = [
  { role: "MAIN", name: { display: "Darren England" } },
  // The two running assistants carry NO role key. This is the reason the referee
  // is found by matching rather than taken from a position in the array.
  { name: { display: "Richard West" } },
  { name: { display: "Adrian Holmes" } },
  { role: "FOURTH_OFFICIAL", name: { display: "Lewis Smith" } },
  { role: "VAR", name: { display: "Nicholas Hopton" } },
  { role: "ASSISTANT_VAR", name: { display: "Gary Beswick" } },
];

const detail = {
  ground: { name: "Portman Road", city: "Ipswich" },
  attendance: 30019,
  matchOfficials: OFFICIALS,
} as unknown as RawPlFixture;

describe("plMatchFacts", () => {
  it("reads a played fixture off the detail read", () => {
    expect(plMatchFacts(detail)).toEqual({
      ground: "Portman Road",
      city: "Ipswich",
      attendance: 30019,
      referee: "Darren England",
    });
  });

  // The point of taking `RawPlFixture` rather than a detail-only type: the round
  // read the wire already makes carries the ground and the gate, and only the
  // referee is missing from it.
  it("answers three of four off the round read, with no referee", () => {
    const round = { ground: { name: "Anfield", city: "Liverpool" }, attendance: 60725 } as unknown as RawPlFixture;
    expect(plMatchFacts(round)).toEqual({
      ground: "Anfield",
      city: "Liverpool",
      attendance: 60725,
      referee: null,
    });
  });

  it("finds no referee among officials who have none", () => {
    const noMain = { matchOfficials: OFFICIALS.slice(1) } as unknown as RawPlFixture;
    expect(plMatchFacts(noMain).referee).toBeNull();
  });

  // Absence, not nought. The gate is published after the match rather than
  // during it, so an unfinished fixture has no attendance and saying "0" would
  // be a claim that nobody came.
  it("gives every field as null when the feed carries none of them", () => {
    expect(plMatchFacts({} as unknown as RawPlFixture)).toEqual({
      ground: null,
      city: null,
      attendance: null,
      referee: null,
    });
  });

  it("keeps a gate of nought rather than reading it as an absence", () => {
    const behindClosedDoors = { attendance: 0 } as unknown as RawPlFixture;
    expect(plMatchFacts(behindClosedDoors).attendance).toBe(0);
  });
});
