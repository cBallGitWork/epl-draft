import { describe, expect, it } from "vitest";
import { eligibilityOf } from "./moves";
import { ACTIVE } from "./rosterStatus";
import { violations } from "./violations";
import type { RosterLimits, RosterSlot } from "./types";
import planning from "./__fixtures__/lineupPlanning.json";

// The move tests' team, test3 in the rehearsal league on 12 Aug: a full, legal XI with four reserves, which each
// case breaks in a way no move of ours could.

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

describe("violations", () => {
  it("finds nothing wrong with a lineup Fantrax accepted", () => {
    expect(violations(slots, eligibility, limits)).toEqual([]);
  });

  it("reports the bench overflowing under the league that seats fewer", () => {
    // The same fifteen men, carrying four reserves: legal here, illegal in the
    // real league, and nothing in the module knows which one it is looking at.
    expect(violations(slots, eligibility, realLimits)).toContainEqual({
      kind: "too-many-reserve",
      count: 4,
      cap: realLimits.maxReservePlayers,
    });
  });

  it("reports both caps a squad breaks, not the first one", () => {
    // A twelfth man fielded, in a forward line already at three. One remedy per
    // line, so a manager fixing one can see whether he is finished.
    const reserve = slots.find((slot) => slot.status !== ACTIVE);
    const overloaded = slots.map((slot) =>
      slot.fantraxId === reserve?.fantraxId ? { ...slot, position: "F", status: ACTIVE } : slot,
    );

    expect(violations(overloaded, eligibility, limits)).toEqual(
      expect.arrayContaining([
        {
          kind: "too-many-active",
          count: limits.maxActivePlayers + 1,
          cap: limits.maxActivePlayers,
        },
        {
          kind: "position-over-cap",
          position: "F",
          count: limits.maxActiveByPosition.F + 1,
          cap: limits.maxActiveByPosition.F,
        },
      ]),
    );
  });

  it("names a player the commissioner has since made ineligible where he stands", () => {
    // A commissioner narrows a dual-eligible man's eligibility under a legal XI. A single-position man would be left
    // with none, which reads as data we do not hold, not a rule broken.
    const playing = slots.find(
      (slot) =>
        slot.status === ACTIVE && (eligibility.get(slot.fantraxId)?.length ?? 0) > 1,
    );
    expect(playing).toBeDefined();
    const narrowed = eligibilityOf(
      planning.eligibility.map((player) =>
        player.fantraxId === playing?.fantraxId
          ? {
              ...player,
              eligiblePositions: player.eligiblePositions.filter((pos) => pos !== playing.position),
            }
          : player,
      ),
    );

    expect(violations(slots, narrowed, limits)).toEqual([
      { kind: "not-eligible", fantraxId: playing?.fantraxId, position: playing?.position },
    ]);
  });

  it("does not accuse a player whose eligibility we simply do not hold", () => {
    // Missing data is not a broken rule, and this is the one violation no move
    // could clear — so the wrong answer here strands a manager rather than just
    // misinforming him.
    expect(violations(slots, eligibilityOf([]), limits)).toEqual([]);
  });
});

// What a league that has not published its caps must NOT produce.
describe("a league that publishes no limits", () => {
  const silent: RosterLimits = {
    maxTotalPlayers: null,
    maxActivePlayers: null,
    maxReservePlayers: null,
    maxActiveByPosition: {},
  minActiveByPosition: {},
  };

  it("reports nothing rather than reporting everyone", () => {
    // THE BUG. `mapLeagueInfo` folded an absent cap to `0` with `?? 0`, so every
    // count exceeded it and a squad of fifteen was reported as breaking three
    // rules the league had never stated. Absence is not zero (CODE_RULES §5).
    const slots = Array.from({ length: 15 }, (_, i) => ({
      fantraxId: `p${i}`,
      position: i === 0 ? "G" : "D",
      status: i < 11 ? "ACTIVE" : "RESERVE",
    }));
    expect(violations(slots, eligibility, silent)).toEqual([]);
  });

  it("still reports a real breach when the league DID publish that cap", () => {
    const onlyActive: RosterLimits = { ...silent, maxActivePlayers: 11 };
    const slots = Array.from({ length: 12 }, (_, i) => ({
      fantraxId: `p${i}`,
      position: "D",
      status: "ACTIVE",
    }));
    expect(violations(slots, eligibility, onlyActive)).toContainEqual({
      kind: "too-many-active",
      count: 12,
      cap: 11,
    });
  });
});
