import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import recordedStreams from "../__fixtures__/plTextstream.json";
import { mapMatchEvents, plFixtureCode, plMatchClock, plPlayerCodes } from "./map";
import type { RawPlFixture, RawPlTextstream } from "./raw";

// Recorded from the Premier League's own API on 4 Sep 2026, never fetched
// (CODE_RULES §6). The match is Liverpool 2-2 Nottingham Forest, gameweek 2 —
// picked because it is the only one in the round carrying all four hard cases at
// once: a goal with an assist, a penalty goal, a goal cancelled by VAR, and nine
// substitutions. The second stream is an unstarted fixture.
const [PLAYED, UNSTARTED] = recordedStreams as unknown as RawPlTextstream[];
const DETAIL = recordedFixture as unknown as RawPlFixture;

/** FPL's `opta_code` → `code`, which the app builds from a bootstrap it holds.
 *  Every player on both sheets, coded as his own id plus a million so a wrong
 *  join is visible rather than coincidental. */
const optaToCode = new Map(
  [...(DETAIL.teamLists ?? [])].flatMap((list) =>
    [...list.lineup, ...list.substitutes].flatMap((p) =>
      p.altIds ? [[p.altIds.opta, p.id + 1_000_000] as [string, number]] : [],
    ),
  ),
);

const codes = plPlayerCodes(DETAIL, optaToCode);
const events = mapMatchEvents(PLAYED.events.content, 2_645_211, codes);

describe("plFixtureCode", () => {
  it("reads FPL's fixture code off the provider's own id for the match", () => {
    expect(plFixtureCode(DETAIL)).toBe(2_645_211);
  });

  it("answers null for a fixture carrying no altIds, which the LIST does not", () => {
    // The textstream's own header and every row of the fixture list omit it.
    // A mapper that read the code from there would answer an empty round and
    // no error, which is how this was nearly shipped.
    expect(plFixtureCode(PLAYED.fixture)).toBeNull();
  });
});

describe("plPlayerCodes", () => {
  it("covers both squads, starters and bench", () => {
    expect(codes.size).toBe(40);
  });

  it("keys on the id the event feed speaks in, not on the opta string", () => {
    // 21737 is Alexander Isak in the provider's own numbering, and it is what
    // `playerIds` carries. The opta code is the join and never the key.
    expect(codes.get(21_737)).toBe(21_737 + 1_000_000);
  });

  it("drops a player FPL has no code for rather than inventing one", () => {
    expect(plPlayerCodes(DETAIL, new Map()).size).toBe(0);
  });
});

describe("mapMatchEvents", () => {
  it("keeps the seven kinds that matter and drops the rest", () => {
    // 107 events in the match, 20 of them worth printing. The other 87 are
    // corners, throw-ins and free kicks — a feed nobody could read.
    expect(PLAYED.events.content).toHaveLength(107);
    expect(events).toHaveLength(20);
  });

  it("reads a fixture nobody has played as empty rather than throwing", () => {
    expect(UNSTARTED.events.content).toHaveLength(0);
    expect(mapMatchEvents(UNSTARTED.events.content, 1, codes)).toEqual([]);
  });

  it("puts the scorer first and the assister second", () => {
    const goal = events.find((e) => e.id === 2_790_296);
    expect(goal?.kind).toBe("goal");
    expect(goal?.minute).toBe("60");
    // Isak, assisted by Gakpo.
    expect(goal?.players).toEqual([21_737 + 1_000_000, 32_894 + 1_000_000]);
  });

  it("puts the man coming on first and the man going off second", () => {
    const sub = events.find((e) => e.id === 2_790_351);
    expect(sub?.kind).toBe("substitution");
    expect(sub?.players).toEqual([51_813 + 1_000_000, 50_623 + 1_000_000]);
  });

  it("keeps stoppage time as it is printed rather than rounding it to a number", () => {
    expect(events.find((e) => e.id === 2_790_543)?.minute).toBe("90+2");
  });

  it("drops the period-boundary types whose seconds run backwards", () => {
    // `end 1` carries 2910 and the second half's `start` carries 2700 — the
    // provider's clock restarts at the interval. None of them is a kind we
    // keep, which is the only reason `seconds` orders this list at all.
    const boundaries = PLAYED.events.content.filter((e) =>
      ["start", "end 1", "end 2", "end 14"].includes(e.type),
    );
    expect(boundaries.length).toBeGreaterThan(0);
    expect(mapMatchEvents(boundaries, 1, codes)).toEqual([]);
  });

  it("carries a clock that orders THIS match, and says so", () => {
    // The reason the two are kept apart: as a string "90+2" sorts before "9",
    // and as a number it equals 90. A wire interleaving ten matches needs
    // neither answer.
    const stoppage = events.find((e) => e.id === 2_790_543);
    const ninth = events.find((e) => e.id === 2_789_801);
    expect(stoppage?.minute).toBe("90+2");
    expect(stoppage?.seconds).toBeGreaterThan(ninth?.seconds ?? 0);
    expect([...events].sort((a, b) => a.seconds - b.seconds).map((e) => e.id)).toEqual(
      events.map((e) => e.id),
    );
  });

  it("calls a penalty its own kind, so a goals feed reading only `goal` cannot miss it", () => {
    expect(events.find((e) => e.id === 2_790_385)?.kind).toBe("penalty-goal");
  });

  it("holds an unresolved man's PLACE rather than closing the array around him", () => {
    // The position is the meaning: compacting would promote Gakpo to scorer.
    const partial = new Map([[21_737, 99]]);
    const goal = mapMatchEvents(PLAYED.events.content, 1, partial).find(
      (e) => e.id === 2_790_296,
    );
    expect(goal?.players).toEqual([99, null]);
  });

  it("never publishes a cancelled goal as a goal, so the feed reconciles to the score", () => {
    // Wirtz's 32nd minute. Opta emits the cancellation and no `goal` beside it,
    // which is why counting this feed reproduces all 21 played scorelines and
    // nothing ever has to be un-printed.
    const cancelled = events.filter((e) => e.kind === "disallowed-goal");
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0].minute).toBe("32");

    const scored = events.filter(
      (e) => e.kind === "goal" || e.kind === "penalty-goal" || e.kind === "own-goal",
    );
    expect(scored).toHaveLength(4);
    const [home, away] = PLAYED.fixture.teams;
    expect((home.score ?? 0) + (away.score ?? 0)).toBe(scored.length);
  });
});

describe("plMatchClock", () => {
  it("drops the seconds nobody quotes", () => {
    expect(plMatchClock(DETAIL)).toBe("90+6");
  });

  it("answers null before kick-off, when the provider sends no clock at all", () => {
    expect(plMatchClock(UNSTARTED.fixture)).toBeNull();
  });
});
