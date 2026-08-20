import { describe, expect, it } from "vitest";
import { diffShapes, shapeOf } from "./shape";

describe("shapeOf", () => {
  it("records a path for every leaf, with its type", () => {
    // The type is part of the path on purpose: a field that turns from a number
    // into a string is as silent a failure as one that disappears, and without
    // the type it diffs as no change at all.
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
    // Fantrax does this: a roster row with no player carries no `scorer`. Both
    // shapes are real and both must survive the merge.
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
    // `logoUrl256` and `totalFpts2` are both plainly fields and both carry
    // digits. The uppercase is what tells them apart from `075zi`.
    const shape = shapeOf({ team: { logoUrl256: "a", totalFpts2: 1 } });
    expect(shape).toEqual(new Set(["team.logoUrl256:string", "team.totalFpts2:number"]));
  });

  it("reads a short lowercase key as a field, not an id", () => {
    expect(shapeOf({ holder: { abc123: { x: 1 } } })).toEqual(new Set(["holder.abc123.x:number"]));
  });

  it("merges a dictionary of one, which is what an empty league answers with", () => {
    // Fantrax's live scoring for a league with no teams carries a single
    // sentinel id — `-3`, the league average. A rule that needed two keys to
    // recognise a dictionary would read that one as a field name and diff every
    // path beneath it twice, once as missing and once as added. This is the
    // exact false positive the first run of `shape-diff` produced.
    expect(shapeOf({ stats: { "-3": { total: 1 } } })).toEqual(new Set(["stats{}.total:number"]));
    expect(shapeOf({ stats: { LG_AVG: { total: 1 } } })).toEqual(
      new Set(["stats{}.total:number"]),
    );
  });

  it("tells an empty array apart from a missing key", () => {
    // The difference between "no teams yet" and "no such field", which is the
    // whole reason this file exists. Our real league answers `[]` for months.
    expect(shapeOf({ teams: [] })).toEqual(new Set(["teams[]:empty"]));
    expect(shapeOf({})).toEqual(new Set([":empty-object"]));
  });

  it("records null as null rather than as absence", () => {
    // A key present and null is a provider saying "nothing here". A key absent
    // is a provider that has never heard of it. Different claims.
    expect(shapeOf({ points: null })).toEqual(new Set(["points:null"]));
  });
});

describe("diffShapes", () => {
  const reference = shapeOf({ draftType: "s", teams: [{ id: "a", name: "n" }] });

  it("names what the subject is missing, which is the dangerous direction", () => {
    // A mapper written against the reference reads `undefined` for every one of
    // these, and the screen quietly shows nothing.
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
    // Our real league answers every table with `[]` until draft night. Reporting
    // that as one missing path per column is the loudest possible way to say "no
    // teams yet": it buries a real difference and it reddens a gate that then
    // gets switched off.
    const drafted = shapeOf({ tableList: [{ rows: [{ cells: [{ content: "x" }] }] }] });
    const undrafted = shapeOf({ tableList: [] });
    const diff = diffShapes(drafted, undrafted);
    expect(diff.missing).toEqual([]);
    expect(diff.emptied).toEqual(["tableList[].rows[].cells[].content:string"]);
  });

  it("still reports a field missing beside a collection that is merely empty", () => {
    // The one that matters on ship day: the league has drafted, one table is
    // legitimately empty, and a field has genuinely gone.
    const before = shapeOf({ draftType: "s", rows: [{ id: "a" }] });
    const after = shapeOf({ rows: [] });
    const diff = diffShapes(before, after);
    expect(diff.missing).toEqual(["draftType:string"]);
    expect(diff.emptied).toEqual(["rows[].id:string"]);
  });

  it("does not let one empty field swallow a longer name beside it", () => {
    const before = shapeOf({ teamInfo: { a: 1 }, teamInfoExtra: { b: 2 } });
    const after = shapeOf({ teamInfo: {}, teamInfoExtra: {} });
    // Both are empty objects here, so both are emptied — the point is that the
    // stem match is a boundary match and not a bare prefix.
    expect(diffShapes(before, after).missing).toEqual([]);
    expect(diffShapes(shapeOf({ teamInfoExtra: { b: 2 } }), shapeOf({ teamInfo: {} })).missing)
      .toEqual(["teamInfoExtra.b:number"]);
  });

  it("says nothing about two payloads of the same shape", () => {
    const subject = shapeOf({ draftType: "other", teams: [{ id: "b", name: "m" }] });
    expect(diffShapes(reference, subject)).toEqual({ missing: [], emptied: [], added: [] });
  });
});
