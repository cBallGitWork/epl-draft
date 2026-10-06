import { describe, expect, it } from "vitest";
import type { RawPlFixture } from "./raw";
import { plMatchFacts } from "./matchFacts";

// The detail read's own officials list, and the gameweek read's, which has none.

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
  halfTimeScore: { homeScore: 0, awayScore: 2 },
  matchOfficials: OFFICIALS,
} as unknown as RawPlFixture;

describe("plMatchFacts", () => {
  it("reads a played fixture off the detail read", () => {
    expect(plMatchFacts(detail)).toEqual({
      ground: "Portman Road",
      city: "Ipswich",
      attendance: 30019,
      halfTime: { home: 0, away: 2 },
      referee: "Darren England",
    });
  });

  // The gameweek read carries the ground and the gate; only the DETAIL read has the referee and the interval score.
  it("answers three of five off the round read, with no referee or interval", () => {
    const round = { ground: { name: "Anfield", city: "Liverpool" }, attendance: 60725 } as unknown as RawPlFixture;
    expect(plMatchFacts(round)).toEqual({
      ground: "Anfield",
      city: "Liverpool",
      attendance: 60725,
      halfTime: null,
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
      halfTime: null,
      referee: null,
    });
  });

  it("keeps a gate of nought rather than reading it as an absence", () => {
    const behindClosedDoors = { attendance: 0 } as unknown as RawPlFixture;
    expect(plMatchFacts(behindClosedDoors).attendance).toBe(0);
  });

  // A goalless first half is a real interval score and not a missing one, which
  // is the same trap the gate of nought carries.
  it("keeps a goalless interval rather than reading it as an absence", () => {
    const nilNil = { halfTimeScore: { homeScore: 0, awayScore: 0 } } as unknown as RawPlFixture;
    expect(plMatchFacts(nilNil).halfTime).toEqual({ home: 0, away: 0 });
  });
});
