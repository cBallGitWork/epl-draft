import { describe, expect, it } from "vitest";
import played from "./__fixtures__/liveScoringPlayed.json";
import { diffShapes, shapeOf } from "./shape";

describe("shapeOf", () => {
  it("records a path for every leaf, with its type", () => {
    // The type is part of the path: a number turned string is as silent a failure as a field gone.
    expect(shapeOf({ period: 1, name: "test4" })).toEqual(
      new Set(["period:number", "name:string"]),
    );
  });

  it("merges an array's elements into one branch", () => {
    // Sixteen teams are sixteen copies of one shape and no information.
    const shape = shapeOf({ teams: [{ id: "a" }, { id: "b" }, { id: "c" }] });
    expect(shape).toEqual(new Set(["teams[].id:string"]));
  });

  it("keeps a union of shapes when an array is not uniform", () => {
    // A Fantrax roster row with no player carries no `scorer`; both shapes must survive the merge.
    const shape = shapeOf({ rows: [{ scorer: { id: "a" } }, { cells: [] }] });
    expect(shape).toEqual(new Set(["rows[].scorer.id:string", "rows[].cells[]:empty"]));
  });

  it("merges an object keyed by ids rather than walking every id", () => {
    const shape = shapeOf({
      rosters: {
        "8enbgqo5msgb375j": { teamName: "123" },
        sezrgvl2mshcpazf: { teamName: "test4" },
      },
    });
    expect(shape).toEqual(new Set(["rosters{}.teamName:string"]));
  });

  it("does not mistake a field name carrying a digit for an id", () => {
    // `logoUrl256` and `totalFpts2` are fields with digits; the uppercase sets them apart from `075zi`.
    const shape = shapeOf({ team: { logoUrl256: "a", totalFpts2: 1 } });
    expect(shape).toEqual(new Set(["team.logoUrl256:string", "team.totalFpts2:number"]));
  });

  it("reads a short lowercase key as a field, not an id", () => {
    expect(shapeOf({ holder: { abc123: { x: 1 } } })).toEqual(new Set(["holder.abc123.x:number"]));
  });

  it("merges a dictionary of one, which is what an empty league answers with", () => {
    // A teamless league's live scoring carries a lone sentinel id, `-3`: a two-key rule would diff its paths twice.
    expect(shapeOf({ stats: { "-3": { total: 1 } } })).toEqual(new Set(["stats{}.total:number"]));
    expect(shapeOf({ stats: { LG_AVG: { total: 1 } } })).toEqual(
      new Set(["stats{}.total:number"]),
    );
  });

  it("merges a league's scoring categories and their positions, which are settings and not fields", () => {
    // A league swapping its categories (A, AF, Sv for AT, GKP) is a choice, not a lost field.
    const rehearsal = { scoringSystem: { scoringCategories: { GOALIE: { A: { Default: "points3" }, Sv: { Default: "range1|99|1|3.0" } } } } };
    const real = { scoringSystem: { scoringCategories: { GOALIE: { AT: { Default: "points3" }, GKP: { G: "points0" } } } } };
    expect(shapeOf(real)).toEqual(new Set(["scoringSystem.scoringCategories.GOALIE{}{}:string"]));
    expect(diffShapes(shapeOf(rehearsal), shapeOf(real))).toEqual({ missing: [], emptied: [], added: [] });
    // The groups themselves stay fields: losing NON_GOALIE is a real difference.
    expect(diffShapes(shapeOf({ scoringSystem: { scoringCategories: { GOALIE: {}, NON_GOALIE: { G: { D: "points6" } } } } }), shapeOf(real)).missing).toEqual([
      "scoringSystem.scoringCategories.NON_GOALIE{}{}:string",
    ]);
  });

  it("tells an empty array apart from a missing key", () => {
    // "No teams yet" is not "no such field": a league answers `[]` until it drafts.
    expect(shapeOf({ teams: [] })).toEqual(new Set(["teams[]:empty"]));
    expect(shapeOf({})).toEqual(new Set([":empty-object"]));
  });

  it("records null as null rather than as absence", () => {
    // Present and null says "nothing here"; absent says the provider never heard of it.
    expect(shapeOf({ points: null })).toEqual(new Set(["points:null"]));
  });
});

describe("diffShapes", () => {
  const reference = shapeOf({ draftType: "s", teams: [{ id: "a", name: "n" }] });

  it("names what the subject is missing, which is the dangerous direction", () => {
    // A mapper written against the reference reads `undefined` for each of these.
    const subject = shapeOf({ teams: [{ id: "a" }] });
    expect(diffShapes(reference, subject).missing).toEqual([
      "draftType:string",
      "teams[].name:string",
    ]);
  });

  it("names what the subject has added, which usually does not matter", () => {
    const subject = shapeOf({
      draftType: "s",
      leagueHistoryId: "h",
      teams: [{ id: "a", name: "n" }],
    });
    expect(diffShapes(reference, subject).added).toEqual(["leagueHistoryId:string"]);
    expect(diffShapes(reference, subject).missing).toEqual([]);
  });

  it("catches a field that changed type without disappearing", () => {
    const subject = shapeOf({ draftType: 7, teams: [{ id: "a", name: "n" }] });
    const diff = diffShapes(reference, subject);
    expect(diff.missing).toEqual(["draftType:string"]);
    expect(diff.added).toEqual(["draftType:number"]);
  });

  it("does not call an empty collection a hundred missing fields", () => {
    // An undrafted league answers every table with `[]`: a missing path per column would bury a real difference.
    const drafted = shapeOf({ tableList: [{ rows: [{ cells: [{ content: "x" }] }] }] });
    const undrafted = shapeOf({ tableList: [] });
    const diff = diffShapes(drafted, undrafted);
    expect(diff.missing).toEqual([]);
    expect(diff.emptied).toEqual(["tableList[].rows[].cells[].content:string"]);
  });

  it("still reports a field missing beside a collection that is merely empty", () => {
    // After the draft: one table legitimately empty, and a field genuinely gone.
    const before = shapeOf({ draftType: "s", rows: [{ id: "a" }] });
    const after = shapeOf({ rows: [] });
    const diff = diffShapes(before, after);
    expect(diff.missing).toEqual(["draftType:string"]);
    expect(diff.emptied).toEqual(["rows[].id:string"]);
  });

  it("does not let one empty instance hide a field its filled siblings lost", () => {
    // A goalie subtotal's `object2` is `[]` beside ten men's full ones: the collection is not empty, the field is gone.
    const reference = shapeOf({ statsMap: { "05g2o": { object2: [{ fpts: 2 }] }, _5020: { object2: [] } } });
    const subject = shapeOf({ statsMap: { "05g2o": { object2: [{ points: 2 }] }, _5020: { object2: [] } } });
    const diff = diffShapes(reference, subject);
    expect(diff.missing).toEqual(["statsMap{}.object2[].fpts:number"]);
    expect(diff.emptied).toEqual([]);
  });

  it("catches a per-category field renamed in a recorded live-scoring payload", () => {
    const renamed = JSON.parse(JSON.stringify(played)) as typeof played;
    for (const team of Object.values(renamed.statsPerTeam.allTeamsStats)) {
      for (const man of Object.values(team.ACTIVE.statsMap) as { object2: Record<string, unknown>[] }[]) {
        for (const row of man.object2) {
          row.points = row.fpts;
          delete row.fpts;
        }
      }
    }
    expect(diffShapes(shapeOf(played), shapeOf(renamed)).missing).toEqual([
      "statsPerTeam.allTeamsStats{}.ACTIVE.statsMap{}.object2[].fpts:number",
    ]);
  });

  it("does not let one empty field swallow a longer name beside it", () => {
    const before = shapeOf({ teamInfo: { a: 1 }, teamInfoExtra: { b: 2 } });
    const after = shapeOf({ teamInfo: {}, teamInfoExtra: {} });
    // Both are empty, so both are emptied; the stem match is a boundary, not a bare prefix.
    expect(diffShapes(before, after).missing).toEqual([]);
    expect(diffShapes(shapeOf({ teamInfoExtra: { b: 2 } }), shapeOf({ teamInfo: {} })).missing)
      .toEqual(["teamInfoExtra.b:number"]);
  });

  it("says nothing about two payloads of the same shape", () => {
    const subject = shapeOf({ draftType: "other", teams: [{ id: "b", name: "m" }] });
    expect(diffShapes(reference, subject)).toEqual({ missing: [], emptied: [], added: [] });
  });
});

describe("emptiness sentinels", () => {
  it("never reports one as a lost or gained field", () => {
    // `draftSettings:empty-object` gone says the league acquired draft settings; as MISSING it reads like one vanished.
    const before = shapeOf({ draftSettings: {}, teams: [] });
    const after = shapeOf({ draftSettings: { rounds: 15 }, teams: [{ id: "a" }] });

    const forward = diffShapes(before, after);
    expect(forward.missing).toEqual([]);
    expect(forward.added.some((p) => p.endsWith(":empty") || p.endsWith(":empty-object"))).toBe(
      false,
    );

    const back = diffShapes(after, before);
    expect(back.missing.some((p) => p.endsWith(":empty-object"))).toBe(false);
  });

  it("still uses them to attribute what is inside an empty collection", () => {
    // Unreported, the sentinel still files a column absent only because its table is empty as `emptied`.
    const populated = shapeOf({ table: { rows: [{ name: "a" }] } });
    const empty = shapeOf({ table: { rows: [] } });
    const diff = diffShapes(populated, empty);
    expect(diff.missing).toEqual([]);
    expect(diff.emptied).toEqual(["table.rows[].name:string"]);
  });
});
