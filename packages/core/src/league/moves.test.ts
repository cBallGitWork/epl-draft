import { describe, expect, it } from "vitest";
import { applyMove, eligibilityOf, eligibleSlots, legalMoves } from "./moves";
import type { Move } from "./moves";
import type { RosterLimits, RosterSlot } from "./types";
import planning from "./__fixtures__/lineupPlanning.json";

// A real team, captured 12 Aug 2026: test3 in the rehearsal league, the day
// Craig restored dual eligibility and signed Kevin Schade. Chosen because it
// holds four dual-eligible players and because its XI is in the state every XI
// is in most of the time — completely full, with one position at its cap.
//
//   active   M4 F3 D3 G1 = 11, which IS maxActivePlayers
//   bench    4
//   caps     G1 D5 M5 F3 — so F is full and M has one space that the squad
//            cap makes unreachable
//
// Both leagues' limits are in the fixture and both are exercised. They disagree
// (15/11/5 against 14/11/3) and rendering both correctly is the 10 Oct swap.

const slots = planning.slots as RosterSlot[];
const eligibility = eligibilityOf(planning.eligibility);
// The recorded rehearsal league publishes every cap, so these are numbers here
// even though the type allows null — a league that has not said is a different
// case and `violations.test.ts` covers it separately.
const limits = planning.rehearsalLimits as RosterLimits & {
  maxTotalPlayers: number;
  maxActivePlayers: number;
  maxReservePlayers: number;
};
const realLimits = planning.realLimits as RosterLimits;

const at = (id: string) => slots.find((s) => s.fantraxId === id);

/** A player with two eligible positions, in or out of the XI.
 *
 *  Found by property rather than by name. Every assertion below is about
 *  eligibility and caps rather than about any particular footballer, and a
 *  re-recorded fixture — a transfer, a commissioner edit — should not require
 *  this file to be edited to stay true. The fixture still carries names, so a
 *  failure can say who. */
function dualEligible(status: string): string {
  const found = planning.eligibility.find(
    (p) => p.eligiblePositions.length > 1 && at(p.fantraxId)?.status === status,
  );
  if (!found) throw new Error(`fixture has no dual-eligible ${status} player`);
  return found.fantraxId;
}

/** In the XI, holding two positions — so the interesting question is whether he
 *  may move between them. */
const DUAL_ACTIVE = dualEligible("ACTIVE");
/** On the bench, holding two positions — so the question is what gets him on. */
const DUAL_BENCHED = dualEligible("RESERVE");

describe("the fixture is the state we think it is", () => {
  it("has a full XI with forwards at their cap", () => {
    expect(slots.filter((s) => s.status === "ACTIVE")).toHaveLength(limits.maxActivePlayers);
    expect(slots.filter((s) => s.status === "ACTIVE" && s.position === "F")).toHaveLength(
      limits.maxActiveByPosition.F,
    );
    // The two subjects are what they claim to be: one in the XI and one out of
    // it, both holding more than one position.
    expect(at(DUAL_ACTIVE)?.status).toBe("ACTIVE");
    expect(at(DUAL_BENCHED)?.status).toBe("RESERVE");
    for (const id of [DUAL_ACTIVE, DUAL_BENCHED]) {
      expect(eligibility.get(id)?.length).toBeGreaterThan(1);
    }
  });
});

describe("eligibleSlots", () => {
  it("refuses a position the player is not eligible for", () => {
    const options = eligibleSlots(slots, eligibility, limits, DUAL_ACTIVE);
    expect(options.find((o) => o.position === "D")).toEqual({
      position: "D",
      open: false,
      blockedBy: "not-eligible",
    });
  });

  it("names the cap that forbids a move rather than just refusing", () => {
    // He is eligible up front and would be allowed there on an emptier team. The
    // reason he cannot go is the forward cap, and a manager is owed that reason.
    const options = eligibleSlots(slots, eligibility, limits, DUAL_ACTIVE);
    expect(options.find((o) => o.position === "F")).toEqual({
      position: "F",
      open: false,
      blockedBy: "position-full",
    });
  });

  it("does not offer a player the position he is already in", () => {
    // Closed with no blocker: nothing is wrong, it is simply not a move.
    const here = at(DUAL_ACTIVE)?.position ?? "";
    const options = eligibleSlots(slots, eligibility, limits, DUAL_ACTIVE);
    expect(options.find((o) => o.position === here)).toEqual({ position: here, open: false });
  });

  it("blames the squad cap, not the position, when the XI is full", () => {
    // Midfield has a free slot (4 of 5) and the bench cannot reach it, because
    // the eleven is already eleven. Two different limits, two different answers.
    const midfield = eligibleSlots(slots, eligibility, limits, DUAL_BENCHED).find(
      (o) => o.position === "M",
    );
    expect(midfield).toEqual({ position: "M", open: false, blockedBy: "squad-full" });
  });

  it("treats an unknown player as unknown, never as eligible anywhere", () => {
    const options = eligibleSlots(slots, eligibility, limits, "nobody");
    expect(options.every((o) => !o.open && o.blockedBy === "unknown-eligibility")).toBe(true);
  });
});

describe("legalMoves", () => {
  it("offers a bench player a swap for every incumbent when the XI is full", () => {
    // The case that matters most, because a full XI is the ordinary state. An
    // earlier version offered nothing here — the squad cap blocked the promotion
    // and only a full POSITION was thought to be swappable — which made the
    // planner silent exactly when a manager needs it.
    const moves = legalMoves(slots, eligibility, limits, DUAL_BENCHED);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((m) => m.kind === "swap")).toBe(true);

    // Into midfield he may replace anyone, since the count is what binds.
    const intoMidfield = moves.filter((m) => m.kind === "swap" && m.to === "M");
    expect(intoMidfield).toHaveLength(limits.maxActivePlayers);

    // Into a full forward line he may only replace a forward — swapping a
    // midfielder out would still leave four forwards.
    const intoAttack = moves.filter((m) => m.kind === "swap" && m.to === "F");
    expect(intoAttack).toHaveLength(limits.maxActiveByPosition.F);
    for (const move of intoAttack) {
      expect(at(move.kind === "swap" ? move.withId : "")?.position).toBe("F");
    }
  });

  it("lets an active player step down while there is bench room", () => {
    expect(legalMoves(slots, eligibility, limits, DUAL_ACTIVE)).toContainEqual({
      kind: "demote",
      fantraxId: DUAL_ACTIVE,
    });
  });

  it("refuses to bench anyone once the bench is full", () => {
    // The real league seats three reserves; this team is carrying four, which is
    // legal there and not here. The same roster, two leagues, two answers — and
    // nothing in the module knows which league it is looking at.
    const benched = (l: RosterLimits) =>
      legalMoves(slots, eligibility, l, DUAL_ACTIVE).some((m) => m.kind === "demote");
    expect(benched(realLimits)).toBe(false);
    expect(benched(limits)).toBe(true);
  });

  it("offers nothing at all for a player whose eligibility we do not have", () => {
    // Not "anywhere". We do not know, so we do not offer — the alternative is
    // showing a manager a move that Fantrax then rejects.
    expect(legalMoves(slots, eligibility, limits, "nobody")).toEqual([]);
    const noPositions = eligibilityOf([{ fantraxId: DUAL_ACTIVE, eligiblePositions: [] }]);
    expect(legalMoves(slots, noPositions, limits, DUAL_ACTIVE)).toEqual([]);
  });

  it("offers a shift once the destination has room", () => {
    // Clear the forwards and he can move up. Same player, same eligibility —
    // only the shape changed.
    const thinner = slots.filter((s) => !(s.status === "ACTIVE" && s.position === "F"));
    expect(legalMoves(thinner, eligibility, limits, DUAL_ACTIVE)).toContainEqual({
      kind: "shift",
      fantraxId: DUAL_ACTIVE,
      to: "F",
    });
  });
});

describe("applyMove", () => {
  it("returns a new roster and leaves the original untouched", () => {
    // The planner shows an edited XI beside the real one, so the real one has to
    // survive a plan being abandoned.
    const before = JSON.stringify(slots);
    const after = applyMove(slots, { kind: "demote", fantraxId: DUAL_ACTIVE });
    expect(JSON.stringify(slots)).toBe(before);
    expect(after).not.toBe(slots);
    expect(after.find((s) => s.fantraxId === DUAL_ACTIVE)?.status).toBe("RESERVE");
  });

  it("moves both players in a swap, in one step", () => {
    const incumbent = slots.find((s) => s.status === "ACTIVE" && s.position === "F");
    expect(incumbent).toBeDefined();
    const withId = incumbent?.fantraxId ?? "";

    const move: Move = { kind: "swap", fantraxId: DUAL_BENCHED, withId, to: "F" };
    const after = applyMove(slots, move);

    expect(after.find((s) => s.fantraxId === DUAL_BENCHED)).toMatchObject({
      position: "F",
      status: "ACTIVE",
    });
    expect(after.find((s) => s.fantraxId === withId)?.status).toBe("RESERVE");
    // And the XI is still an XI.
    expect(after.filter((s) => s.status === "ACTIVE")).toHaveLength(limits.maxActivePlayers);
  });

  it("keeps a shifted player active and a promoted player's new position", () => {
    const shifted = applyMove(slots, { kind: "shift", fantraxId: DUAL_ACTIVE, to: "F" });
    expect(shifted.find((s) => s.fantraxId === DUAL_ACTIVE)).toMatchObject({
      position: "F",
      status: "ACTIVE",
    });

    const promoted = applyMove(slots, { kind: "promote", fantraxId: DUAL_BENCHED, to: "F" });
    expect(promoted.find((s) => s.fantraxId === DUAL_BENCHED)).toMatchObject({
      position: "F",
      status: "ACTIVE",
    });
  });

  it("produces only moves that were legal, applied across a whole squad", () => {
    // Every move the module offers, applied, must leave a roster inside every
    // limit. This is the property the individual cases above are examples of.
    for (const slot of slots) {
      for (const move of legalMoves(slots, eligibility, limits, slot.fantraxId)) {
        const after = applyMove(slots, move);
        const active = after.filter((s) => s.status === "ACTIVE");
        expect(active.length).toBeLessThanOrEqual(limits.maxActivePlayers);
        expect(after.length - active.length).toBeLessThanOrEqual(limits.maxReservePlayers);
        for (const [position, cap] of Object.entries(limits.maxActiveByPosition)) {
          expect(active.filter((s) => s.position === position).length).toBeLessThanOrEqual(cap);
        }
      }
    }
  });
});
