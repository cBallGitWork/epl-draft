import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import recordedRound from "../__fixtures__/plRound.json";
import recordedStats from "../__fixtures__/plMatchStats.json";
import recordedStreams from "../__fixtures__/plTextstream.json";
import {
  mapMatchEvents,
  mapRoundGoals,
  plFixtureCode,
  plCommentary,
  plMatchMetrics,
} from "./map";
import { plPlayerCodes } from "./teamSheet";
import type {
  RawPlFixture,
  RawPlFixturePage,
  RawPlTextstream,
} from "./raw";
import type { RawPlMatchStats } from "./rawStats";

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
    list === null
      ? []
      : [...list.lineup, ...list.substitutes].flatMap((p) =>
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


// Gameweek 2's ten fixtures, recorded WITH `altIds=true` — the parameter the
// round read answers no join key at all without.
const ROUND = recordedRound as unknown as RawPlFixturePage;

describe("plCommentary", () => {
  const lines = plCommentary(PLAYED.events.content);

  it("keeps the WHOLE vocabulary, which is the difference from mapMatchEvents", () => {
    // That one reduces to seven kinds because the Live tab prints a wire and
    // 1,083 events a round is a firehose. A report is the opposite question:
    // one match, and everything that happened in it.
    expect(lines.length).toBeGreaterThan(events.length);
    const kinds = new Set(lines.map((line) => line.type));
    expect(kinds.has("attempt saved")).toBe(true);
    expect(kinds.has("corner")).toBe(true);
    expect(kinds.has("goal")).toBe(true);
  });

  it("runs newest first", () => {
    const seconds = lines.map((line) => line.seconds);
    expect([...seconds].sort((a, b) => b - a)).toEqual(seconds);
  });

  it("drops an event it cannot place in the match", () => {
    // `end 14` means "match ends" and carries a junk `time.label` of "01"; an
    // event with no time is one we cannot put in a timeline at all.
    const blind = plCommentary([
      { id: 1, type: "goal", text: "Goal!" },
      { id: 2, type: "goal", text: "", time: { label: "3", secs: 180 } },
      { id: 3, type: "goal", text: "Goal!", time: { label: "5", secs: 300 } },
    ]);
    expect(blind.map((line) => line.id)).toEqual([3]);
  });
});

describe("mapRoundGoals", () => {
  /** Every player named in the round's goals, coded as his own id plus a
   *  million, so a wrong join shows up rather than coinciding. */
  const roundCodes = new Map(
    ROUND.content.flatMap((f) =>
      (f.goals ?? []).flatMap((g) =>
        [g.personId, g.assistId].flatMap((id) =>
          id === undefined ? [] : [[id, id + 1_000_000] as [number, number]],
        ),
      ),
    ),
  );
  const goals = mapRoundGoals(ROUND.content, roundCodes);

  it("answers every goal in the round from ONE read", () => {
    // The whole reason the live path is one request and not ten.
    expect(ROUND.content).toHaveLength(10);
    expect(goals).toHaveLength(32);
  });

  it("reconciles with every scoreline", () => {
    // The property, not the four goals: counted across gameweeks 1-3 this holds
    // on 21 of 21 played fixtures, own goals and penalties included.
    for (const fixture of ROUND.content) {
      const [home, away] = fixture.teams;
      const scored = (home.score ?? 0) + (away.score ?? 0);
      expect(goals.filter((g) => g.fixtureCode === plFixtureCode(fixture))).toHaveLength(
        scored,
      );
    }
  });

  it("reads the round's own one-letter vocabulary, which is not the commentary's", () => {
    // Counted off the recording: 27 `G`, 3 `O`, 2 `P`.
    const kinds = goals.map((g) => g.kind);
    expect(kinds.filter((k) => k === "goal")).toHaveLength(27);
    expect(kinds.filter((k) => k === "own-goal")).toHaveLength(3);
    expect(kinds.filter((k) => k === "penalty-goal")).toHaveLength(2);
  });

  it("holds the assist's place when nobody was credited with one", () => {
    // 22 of 32 carry an assist across the round; the rest are unassisted goals
    // and not gaps, so the slot stays and the value is null.
    expect(goals.every((g) => g.players.length === 2)).toBe(true);
    expect(goals.filter((g) => g.players[1] !== null)).toHaveLength(22);
  });

  it("orders the round on the wall clock and not on the match clock", () => {
    // Two matches kicking off at different times both start their own clock at
    // nought; sorting a round on `seconds` alone puts the afternoon out of
    // order. `absolute` is the field that does not.
    const byAbsolute = [...goals].sort((a, b) => (a.absolute ?? 0) - (b.absolute ?? 0));
    const bySeconds = [...goals].sort((a, b) => a.seconds - b.seconds);
    expect(byAbsolute.map((g) => g.id)).not.toEqual(bySeconds.map((g) => g.id));
    expect(goals.every((g) => g.absolute !== null)).toBe(true);
  });

  it("gives every goal a stable id, so a poll does not redraw the wire", () => {
    expect(new Set(goals.map((g) => g.id)).size).toBe(goals.length);
    expect(mapRoundGoals(ROUND.content, roundCodes).map((g) => g.id)).toEqual(
      goals.map((g) => g.id),
    );
  });
});


// Recorded from `/stats/match/128939` on 4 Sep 2026 — the same Liverpool 2-2
// Nottingham Forest, so the two files describe one match.
const STATS = recordedStats as unknown as RawPlMatchStats;

describe("plMatchMetrics", () => {
  const liverpool = plMatchMetrics(STATS, 10);
  const forest = plMatchMetrics(STATS, 15);

  it("reads a metric by Opta's own name", () => {
    expect(liverpool?.("possession_percentage")).toBe(69.1);
    expect(liverpool?.("total_scoring_att")).toBe(13);
  });

  it("answers NOUGHT for a metric they omitted, not undefined", () => {
    // The inversion this whole function exists for. Neither side was sent off,
    // so `total_red_card` is absent from both — and a board printing a dash for
    // "no red cards" would hedge a fact we hold. Counted across 40 team-sides,
    // the metric is present on exactly 1, and there was exactly 1 red card.
    expect(liverpool?.("total_red_card")).toBe(0);
    expect(forest?.("total_red_card")).toBe(0);
    expect(STATS.data["10"].M.some((m) => m.name === "total_red_card")).toBe(false);
  });

  it("keys on the provider's team id and gives both sides", () => {
    expect(liverpool).not.toBeNull();
    expect(forest).not.toBeNull();
    expect(liverpool?.("goals")).toBe(2);
    expect(forest?.("goals")).toBe(2);
  });

  it("answers null for a fixture they have no stats for, which IS an absence", () => {
    // Distinct from the zero above: no stats at all may not become a board of
    // noughts. The caller has to tell the two apart, so the types do.
    expect(plMatchMetrics(STATS, 999)).toBeNull();
  });
});
