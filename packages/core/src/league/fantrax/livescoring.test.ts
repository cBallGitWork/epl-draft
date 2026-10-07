import { describe, expect, it } from "vitest";
import recorded from "./__fixtures__/liveScoring.json";
import played from "./__fixtures__/liveScoringPlayed.json";
import unplayed from "./__fixtures__/liveScoringUnplayed.json";
import bench from "./__fixtures__/liveScoringBench.json";
import {
  mapBenchPlayerPoints,
  mapLivePlayerPoints,
  mapLiveScores,
  mapProjectedTotals,
} from "./livescoring";
import type { RawLiveScoring } from "./livescoring";

describe("mapLiveScores", () => {
  it("reads every team's total from one recorded response", () => {
    // Trimmed from a real read before kickoff: every total is a nought Fantrax stated.
    const scores = mapLiveScores(recorded as RawLiveScoring);
    expect(scores).toHaveLength(2);
    expect(scores.map((s) => s.points)).toEqual([0, 0]);
    expect(scores.every((s) => s.teamId.length > 0)).toBe(true);
  });

  it("counts the players who still have football to come", () => {
    const [first] = mapLiveScores(recorded as RawLiveScoring);
    // Four in the trimmed fixture, all yet to kick off.
    expect(first.toPlay).toBe(4);
  });

  it("counts down as fixtures finish", () => {
    const scores = mapLiveScores({
      statsPerTeam: {
        allTeamsStats: {
          a: { ACTIVE: { totalFpts: 41, remainingEventPercent: { p1: 0, p2: 0.5, p3: 1 } } },
        },
      },
    });
    expect(scores).toEqual([{ teamId: "a", points: 41, toPlay: 2 }]);
  });

  it("reports a missing total as unknown rather than nought", () => {
    const scores = mapLiveScores({
      statsPerTeam: { allTeamsStats: { a: { ACTIVE: { remainingEventPercent: { p1: 1 } } } } },
    });
    expect(scores).toEqual([{ teamId: "a", points: null, toPlay: 1 }]);
  });

  it("skips a team with no active section rather than inventing one", () => {
    // Only ACTIVE scores; a team without it is one we cannot speak for.
    expect(mapLiveScores({ statsPerTeam: { allTeamsStats: { a: {}, b: undefined } } })).toEqual([]);
  });

  it("survives a response with nothing in it", () => {
    expect(mapLiveScores({})).toEqual([]);
    expect(mapLiveScores({ statsPerTeam: {} })).toEqual([]);
  });

  it("says nothing about players when Fantrax lists none", () => {
    const scores = mapLiveScores({
      statsPerTeam: { allTeamsStats: { a: { ACTIVE: { totalFpts: 12 } } } },
    });
    expect(scores).toEqual([{ teamId: "a", points: 12, toPlay: null }]);
  });
});

describe("mapLivePlayerPoints", () => {
  // One league's period 1, played, and period 2, not yet kicked off, two teams each: live scoring honours the period,
  // where `getTeamRosterInfo` answers every period alike.
  const first = (raw: unknown) => mapLivePlayerPoints(raw as RawLiveScoring)[0];

  it("reads each player's slot-priced total", () => {
    const squad = first(played);
    expect(squad.teamId).toBe("8enbgqo5msgb375j");
    expect(squad.players).toHaveLength(8);
    expect(squad.players.every((p) => typeof p.points === "number")).toBe(true);
  });

  it("sums to the total Fantrax puts on the scoreboard", () => {
    // Priced at the roster slot, so the eleven sums to the header; the stat tables price a man at his default position.
    for (const raw of [played, unplayed]) {
      const scores = new Map(mapLiveScores(raw as RawLiveScoring).map((s) => [s.teamId, s.points]));
      for (const squad of mapLivePlayerPoints(raw as RawLiveScoring)) {
        const summed = squad.players.reduce((total, p) => total + p.points, 0);
        expect(summed).toBe(scores.get(squad.teamId));
      }
    }
  });

  it("leaves out the group subtotals, which are not men", () => {
    // `_5010` and `_5020` are the outfield and goalie totals; read as players they double every score.
    const ids = first(played).players.map((p) => p.fantraxId);
    expect(ids.some((id) => id.startsWith("_"))).toBe(false);
  });

  it("leaves out a man who has not played, rather than putting him on nought", () => {
    // Fantrax names eleven in `remainingEventPercent` and prices eight: the three who never appeared stay absent,
    // and this test stops the dash being "fixed" back into a nought.
    const active = (played as RawLiveScoring).statsPerTeam?.allTeamsStats?.[
      "8enbgqo5msgb375j"
    ]?.ACTIVE;
    if (active === undefined) throw new Error("fixture lost its team");
    const named = Object.keys(active.remainingEventPercent ?? {});
    const priced = first(played).players.map((p) => p.fantraxId);

    expect(named).toHaveLength(11);
    expect(priced).toHaveLength(8);
    expect(named.filter((id) => !priced.includes(id))).toHaveLength(3);
    expect(priced.every((id) => named.includes(id))).toBe(true);
  });

  it("keeps a nought Fantrax actually stated", () => {
    const squad = first({
      statsPerTeam: { allTeamsStats: { t: { ACTIVE: { statsMap: { a: { object1: 0 } } } } } },
    });
    expect(squad.players).toEqual([{ fantraxId: "a", points: 0, categories: [], counts: [] }]);
  });

  it("says nothing about a man with categories but no total", () => {
    const squad = first({
      statsPerTeam: {
        allTeamsStats: {
          t: { ACTIVE: { statsMap: { a: { object2: [{ scipId: "5010#6090#-1", fpts: 5 }] } } } },
        },
      },
    });
    expect(squad.players).toEqual([]);
  });

  it("prices period 2 differently from period 1", () => {
    // The unplayed period's only `statsMap` keys are the two group subtotals.
    expect(first(played).players).toHaveLength(8);
    expect(first(unplayed).players).toHaveLength(0);
  });

  it("reads ACTIVE and never BENCH", () => {
    const squad = first({
      statsPerTeam: {
        allTeamsStats: {
          t: {
            ACTIVE: { statsMap: { keeper: { object1: 4 } } },
            BENCH: { statsMap: { reserve: { object1: 9 } } },
          },
        },
      },
    });
    expect(squad.players.map((p) => p.fantraxId)).toEqual(["keeper"]);
  });

  it("drops the position segment from Fantrax's category key", () => {
    // `object2` always says `#-1`, a row `getLeagueInfo` lacks for outfield Goals and Clean Sheets: kept, they vanish.
    const squad = first({
      statsPerTeam: {
        allTeamsStats: {
          t: { ACTIVE: { statsMap: { a: { object1: 5, object2: [
            { scipId: "5010#6090#-1", sv: "1", av: 1, fpts: 5 },
          ] } } } },
        },
      },
    });
    expect(squad.players[0].categories).toEqual([
      { category: "5010#6090", points: 5, value: "1" },
    ]);
  });

  it("drops categories that contributed nothing, and keys it cannot read", () => {
    const squad = first({
      statsPerTeam: {
        allTeamsStats: {
          t: { ACTIVE: { statsMap: { a: { object1: 2, object2: [
            { scipId: "5010#6120#-1", sv: "90", av: 90, fpts: 2 },
            { scipId: "5010#6280#-1", sv: "0", av: 0, fpts: 0 },
            { scipId: "nonsense", fpts: 3 },
          ] } } } },
        },
      },
    });
    expect(squad.players[0].categories).toEqual([
      { category: "5010#6120", points: 2, value: "90" },
    ]);
  });

  it("keeps every count Fantrax stated for a stat board, the noughts included", () => {
    const squad = first({
      statsPerTeam: {
        allTeamsStats: {
          t: { ACTIVE: { statsMap: { a: { object1: 2, object2: [
            { scipId: "5010#6120#-1", sv: "90", av: 90, fpts: 2 },
            { scipId: "5010#6280#-1", sv: "0", av: 0, fpts: 0 },
            { scipId: "nonsense", fpts: 3 },
          ] } } } },
        },
      },
    });
    expect(squad.players[0].counts).toEqual([
      { category: "5010#6120", points: 2, value: "90" },
      { category: "5010#6280", points: 0, value: "0" },
    ]);
  });

  it("carries what he DID beside what it paid him", () => {
    // Off the recorded payload: 90 minutes for 2, one goal for 4.
    const scorer = first(played).players.find((p) => p.fantraxId === "05g2o");
    if (scorer === undefined) throw new Error("fixture lost its scorer");
    expect(scorer.categories).toEqual(
      expect.arrayContaining([
        { category: "5010#6120", points: 2, value: "90" },
        { category: "5010#6090", points: 4, value: "1" },
      ]),
    );
  });

  it("reads the rendered string and not the number beside it", () => {
    // `sv` and `av` are the same fact; a person reads the string Fantrax rendered.
    const squad = first({
      statsPerTeam: {
        allTeamsStats: {
          t: { ACTIVE: { statsMap: { a: { object1: 2, object2: [
            { scipId: "5010#6120#-1", sv: "90", av: 90, fpts: 2 },
          ] } } } },
        },
      },
    });
    expect(squad.players[0].categories[0].value).toBe("90");
  });

  it("says nothing for a category Fantrax priced without a count", () => {
    // Null, not "0" or "": a nought is a count Fantrax stated.
    const squad = first({
      statsPerTeam: {
        allTeamsStats: {
          t: { ACTIVE: { statsMap: { a: { object1: 3, object2: [
            { scipId: "5010#6000#-1", av: 1, fpts: 3 },
          ] } } } },
        },
      },
    });
    expect(squad.players[0].categories).toEqual([
      { category: "5010#6000", points: 3, value: null },
    ]);
  });

  it("keeps a count of nought that Fantrax did state, where the row still paid", () => {
    // Points drop a row, never the count: "none conceded" earns on a stated nought.
    const squad = first({
      statsPerTeam: {
        allTeamsStats: {
          t: { ACTIVE: { statsMap: { a: { object1: 4, object2: [
            { scipId: "5010#6101#-1", sv: "0", av: 0, fpts: 4 },
          ] } } } },
        },
      },
    });
    expect(squad.players[0].categories).toEqual([
      { category: "5010#6101", points: 4, value: "0" },
    ]);
  });

  it("says nothing for a team Fantrax priced nobody in", () => {
    expect(first({ statsPerTeam: { allTeamsStats: { t: { ACTIVE: {} } } } }).players).toEqual([]);
  });
});

describe("mapProjectedTotals", () => {
  const projected = (map: Record<string, number>) => ({
    statsPerTeam: { allTeamsStats: { t1: { ACTIVE: { totalFpts: 0, projectedTotalsMap: map } } } },
  });

  it("sums Fantrax's per-player guesses, because there is no team field to read", () => {
    // `totalFpts` is what a squad has ACTUALLY scored, a truthful nought all week.
    expect(mapProjectedTotals(projected({ a: 5.5, b: 4.5 }))).toEqual([{ teamId: "t1", points: 10 }]);
  });

  it("skips the group subtotals, which would roughly double every projection", () => {
    // `_5010` and `_5020` are the outfield and goalie groups, which on their own sum to the team total.
    expect(mapProjectedTotals(projected({ a: 5.5, b: 4.5, _5010: 5.5, _5020: 4.5 }))).toEqual([
      { teamId: "t1", points: 10 },
    ]);
  });

  it("reads a team Fantrax has not guessed at as null, never nought", () => {
    const none = { statsPerTeam: { allTeamsStats: { t1: { ACTIVE: { totalFpts: 0 } } } } };
    expect(mapProjectedTotals(none)).toEqual([{ teamId: "t1", points: null }]);
    expect(mapProjectedTotals(projected({}))).toEqual([{ teamId: "t1", points: null }]);
  });

  it("keeps the sum a number a person would write down", () => {
    expect(mapProjectedTotals(projected({ a: 0.1, b: 0.2 }))).toEqual([{ teamId: "t1", points: 0.3 }]);
  });
});

describe("mapBenchPlayerPoints", () => {
  // Rehearsal period 5 with `playerViewType: "2"`: TEST2's eleven made 34, and two of four reserves were priced, at 1 and 3.
  const squad = () => mapBenchPlayerPoints(bench as RawLiveScoring)[0];

  it("prices the reserves who played, and only them", () => {
    expect(squad().teamId).toBe("pbxm9fgimshcpazf");
    expect(squad().players.map((p) => [p.fantraxId, p.points])).toEqual([
      ["0784p", 1],
      ["0785j", 3],
    ]);
  });

  it("carries what each reserve did alongside what it earned", () => {
    const hackney = squad().players.find((p) => p.fantraxId === "0784p");
    expect(hackney?.categories.length).toBeGreaterThan(0);
    expect(hackney?.categories.every((c) => c.points !== 0)).toBe(true);
  });

  it("never adds a reserve to the team's total", () => {
    expect(mapLiveScores(bench as RawLiveScoring)[0]?.points).toBe(34);
    const eleven = mapLivePlayerPoints(bench as RawLiveScoring)[0]?.players ?? [];
    expect(eleven.reduce((total, p) => total + p.points, 0)).toBe(34);
  });

  it("says nothing for a team whose bench Fantrax did not send", () => {
    expect(mapBenchPlayerPoints(played as RawLiveScoring)).toEqual([]);
  });
});
