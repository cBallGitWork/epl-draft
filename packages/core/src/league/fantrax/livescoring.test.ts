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
    // Trimmed from a real 13 Aug read. Every total is zero because no football
    // has been played yet — which is the point: zero is what Fantrax said, and a
    // scoreboard that showed anything else would be inventing it.
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
    // A team on nought and a team we have no number for are different things,
    // and only one of them is worth putting on a screen as a score.
    const scores = mapLiveScores({
      statsPerTeam: { allTeamsStats: { a: { ACTIVE: { remainingEventPercent: { p1: 1 } } } } },
    });
    expect(scores).toEqual([{ teamId: "a", points: null, toPlay: 1 }]);
  });

  it("skips a team with no active section rather than inventing one", () => {
    // Only ACTIVE scores, and only ACTIVE is public. A team without it is a team
    // we cannot speak for.
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
  // Both fixtures were recorded on 27 Aug 2026, from the same league on the same
  // afternoon: period 1 with gameweek 1 played out, period 2 with none of
  // gameweek 2 kicked off. Two teams each, values untouched.
  //
  // The pair is the point. Asked for periods 1, 2 and 3, `getTeamRosterInfo`
  // answers byte-identical payloads — which is why a card headed "This period"
  // was showing a season total. `getLiveScoringStats` honours the period, and
  // these two fixtures are the proof.
  const first = (raw: unknown) => mapLivePlayerPoints(raw as RawLiveScoring)[0];

  it("reads each player's slot-priced total", () => {
    const squad = first(played);
    expect(squad.teamId).toBe("8enbgqo5msgb375j");
    expect(squad.players).toHaveLength(8);
    expect(squad.players.every((p) => typeof p.points === "number")).toBe(true);
  });

  it("sums to the total Fantrax puts on the scoreboard", () => {
    // The whole reason for reading this map rather than the stat tables: these
    // are priced at the roster slot, so the eleven adds up to the header above
    // it. The season table does not — it prices a dual-eligible man at his
    // default position, which is how a board showed 16 over an eleven of 14.
    for (const raw of [played, unplayed]) {
      const scores = new Map(mapLiveScores(raw as RawLiveScoring).map((s) => [s.teamId, s.points]));
      for (const squad of mapLivePlayerPoints(raw as RawLiveScoring)) {
        const summed = squad.players.reduce((total, p) => total + p.points, 0);
        expect(summed).toBe(scores.get(squad.teamId));
      }
    }
  });

  it("leaves out the group subtotals, which are not men", () => {
    // `_5010` and `_5020` are the outfield and goalie totals and sum to the
    // team's. Read as players they double every score.
    const ids = first(played).players.map((p) => p.fantraxId);
    expect(ids.some((id) => id.startsWith("_"))).toBe(false);
  });

  it("leaves out a man who has not played, rather than putting him on nought", () => {
    // The load-bearing one. Fantrax names eleven active players in
    // `remainingEventPercent` and prices ten of them: the eleventh was in the
    // eleven and never appeared. A nought for him would be a claim about a man
    // who did not kick a ball, and this test is what stops the dash being
    // "fixed" back into a zero.
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
    // Under `getTeamRosterInfo` these two reads were byte-identical. Here the
    // played period names eight men and the unplayed one names nobody at all —
    // its only `statsMap` keys are the two group subtotals.
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
    // `object2` always says `#-1`, while `getLeagueInfo` lists outfield Goals
    // and Clean Sheets only under the positions it prices them for. Keying on
    // the whole id resolves Minutes and Assists and silently loses exactly the
    // two categories worth reading — which looks like "he did not score".
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
    // Off the recorded payload: 90 minutes for 2, one goal for 4. "Minutes
    // Played +2" is a price with the thing it priced left out, and the count is
    // the half a breakdown could not say before.
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
    // `sv` and `av` are the same fact twice, and this one is read back to a
    // person — so it stays the string Fantrax already chose to render it with.
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
    // Null and not "0", and not "": a nought is a count Fantrax stated, and an
    // empty string is a count that fits in the gap where one should be.
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
    // What drops a row is the points, never the count. A category that pays for
    // what a man did NOT do — none conceded — earns on a stated nought, and
    // "+4" with the nought thrown away is the price without the reason.
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
    // `totalFpts` is what a squad has ACTUALLY scored and reads a truthful nought
    // all week. A preview built on it says nought against nought for every tie.
    expect(mapProjectedTotals(projected({ a: 5.5, b: 4.5 }))).toEqual([{ teamId: "t1", points: 10 }]);
  });

  it("skips the group subtotals, which would roughly double every projection", () => {
    // `_5010` and `_5020` are the outfield and goalie groups and sum to the team
    // total on their own — the same two phantoms `mapLivePlayerPoints` drops.
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
  // Rehearsal period 5, read 24 Sep 2026 with `playerViewType: "2"`: TEST2's
  // eleven made 34 and two of his four reserves were priced, at 1 and 3.
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
