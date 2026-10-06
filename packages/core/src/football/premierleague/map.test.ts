import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import { OPTA_TO_CODE as optaToCode } from "../__fixtures__/plFixtureCodes";
import recordedRound from "../__fixtures__/plRound.json";
import recordedStats from "../__fixtures__/plMatchStats.json";
import recordedStreams from "../__fixtures__/plTextstream.json";
import {
  mapMatchEvents,
  mapRoundGoals,
  plFixtureCode,
  plCommentary,
  plMatchMetrics,
  worthReading,
} from "./map";
import { plPlayerCodes } from "./teamSheet";
import type {
  RawPlFixture,
  RawPlFixturePage,
  RawPlTextstream,
} from "./raw";
import type { RawPlMatchStats } from "./rawStats";

// Liverpool 2-2 Nottingham Forest (GW2): an assisted goal, a penalty, a VAR-cancelled goal and nine changes.
// The second stream is an unstarted fixture.
const [PLAYED, UNSTARTED] = recordedStreams as unknown as RawPlTextstream[];
const DETAIL = recordedFixture as unknown as RawPlFixture;

const codes = plPlayerCodes(DETAIL, optaToCode);
const events = mapMatchEvents(PLAYED.events.content, 2_645_211, codes);

describe("plFixtureCode", () => {
  it("reads FPL's fixture code off the provider's own id for the match", () => {
    expect(plFixtureCode(DETAIL)).toBe(2_645_211);
  });

  it("answers null for a fixture carrying no altIds, which the LIST does not", () => {
    // The textstream's own header and every row of a fixture list read without `altIds=true` omit it.
    expect(plFixtureCode(PLAYED.fixture)).toBeNull();
  });
});

describe("mapMatchEvents", () => {
  it("keeps the seven kinds that matter and drops the rest", () => {
    // 107 events in the match, 20 worth printing; the rest are corners, throw-ins and free kicks.
    expect(PLAYED.events.content).toHaveLength(107);
    expect(events).toHaveLength(20);
  });

  // A second yellow is a sending-off, and Opta spells its type with no space.
  it("reads a second yellow as a red card", () => {
    const sent = mapMatchEvents(
      [
        {
          id: 1,
          type: "secondyellow card",
          text: "Second yellow card to Abdul Fatawu (Ipswich Town).",
          time: { label: "67", secs: 4020 },
          playerIds: [],
        },
      ],
      1,
      codes,
    );
    expect(sent.map((event) => event.kind)).toEqual(["red-card"]);
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
    // `end 1` carries 2910 and the second half's `start` 2700; none is a kind we keep, so `seconds` orders the rest.
    const boundaries = PLAYED.events.content.filter((e) =>
      ["start", "end 1", "end 2", "end 14"].includes(e.type),
    );
    expect(boundaries.length).toBeGreaterThan(0);
    expect(mapMatchEvents(boundaries, 1, codes)).toEqual([]);
  });

  it("carries a clock that orders THIS match, and says so", () => {
    // As a string "90+2" sorts before "9", and as a number it equals 90.
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
    // Wirtz's 32nd minute: Opta emits the cancellation and no `goal` beside it, so nothing is un-printed.
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

// Gameweek 2's ten fixtures, recorded WITH `altIds=true`, without which there is no join key.
const ROUND = recordedRound as unknown as RawPlFixturePage;

describe("plCommentary", () => {
  const lines = plCommentary(PLAYED.events.content);

  it("keeps the WHOLE vocabulary, which is the difference from mapMatchEvents", () => {
    // The wire keeps seven kinds; a report wants everything in one match.
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
    // An event with no time, or no text, cannot go in a timeline.
    const blind = plCommentary([
      { id: 1, type: "goal", text: "Goal!" },
      { id: 2, type: "goal", text: "", time: { label: "3", secs: 180 } },
      { id: 3, type: "goal", text: "Goal!", time: { label: "5", secs: 300 } },
    ]);
    expect(blind.map((line) => line.id)).toEqual([3]);
  });
});

describe("mapRoundGoals", () => {
  /** Every man in the gameweek's goals, coded as his own id plus a million so a wrong join shows. */
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
    // Every fixture's goals match its scoreline, own goals and penalties included.
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
    // 22 of 32 carry an assist; the rest are unassisted, so the slot stays and holds null.
    expect(goals.every((g) => g.players.length === 2)).toBe(true);
    expect(goals.filter((g) => g.players[1] !== null)).toHaveLength(22);
  });

  it("orders the round on the wall clock and not on the match clock", () => {
    // Every match's clock starts at nought, so `seconds` alone misorders the day; `absolute` does not.
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

// `/stats/match/128939`: the same Liverpool 2-2 Nottingham Forest, so the two files describe one match.
const STATS = recordedStats as unknown as RawPlMatchStats;

describe("plMatchMetrics", () => {
  const liverpool = plMatchMetrics(STATS, 10);
  const forest = plMatchMetrics(STATS, 15);

  it("reads a metric by Opta's own name", () => {
    expect(liverpool?.("possession_percentage")).toBe(69.1);
    expect(liverpool?.("total_scoring_att")).toBe(13);
  });

  it("answers NOUGHT for a metric they omitted, not undefined", () => {
    // Neither side was sent off, so `total_red_card` is absent from both; a dash would hedge a fact we hold.
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
    // Distinct from the nought above: no stats at all may not become a board of noughts.
    expect(plMatchMetrics(STATS, 999)).toBeNull();
  });
});

describe("worthReading, against the recorded match", () => {
  const lines = plCommentary(PLAYED.events.content);

  it("keeps not one line of either foul type, nor an offside", () => {
    const kept = worthReading(lines);
    expect(kept.some((line) => line.type === "free kick won")).toBe(false);
    expect(kept.some((line) => line.type === "free kick lost")).toBe(false);
    expect(kept.some((line) => line.type === "offside")).toBe(false);
  });

  it("had offsides to take out, so the case above is not vacuous", () => {
    // A recorded match with no offsides would let the assertion pass on nothing.
    expect(lines.some((line) => line.type === "offside")).toBe(true);
  });

  it("takes out a large share of a real feed, which is the whole point", () => {
    // A floor, not a figure: the exact share is one afternoon's refereeing.
    const dropped = lines.length - worthReading(lines).length;
    expect(dropped / lines.length).toBeGreaterThan(0.2);
  });

  it("keeps every goal, card and substitution", () => {
    const kept = worthReading(lines);
    for (const type of ["goal", "yellow card", "substitution"]) {
      expect(kept.filter((line) => line.type === type)).toEqual(
        lines.filter((line) => line.type === type),
      );
    }
  });

  it("leaves the order alone", () => {
    const kept = worthReading(lines);
    expect(kept).toEqual(
      lines.filter((line) => !line.type.startsWith("free kick") && line.type !== "offside"),
    );
  });

  it("has nothing to do on an empty feed", () => {
    expect(worthReading([])).toEqual([]);
  });
});
