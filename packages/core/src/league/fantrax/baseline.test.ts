import { describe, expect, it } from "vitest";
import { orphaned, unacknowledged } from "./baseline";
import type { AcknowledgedDifference } from "./baseline";

const judged: AcknowledgedDifference[] = [
  { read: "getDraftResults", path: "draftDate:string", why: "no draft scheduled" },
  { read: "getDraftResults", path: "startDate:string", why: "no draft scheduled" },
  { read: "getLeagueInfo", path: "draftDate:string", why: "a different read entirely" },
];

describe("unacknowledged", () => {
  it("reddens on a path nobody has looked at", () => {
    expect(unacknowledged("getDraftResults", ["draftDate:string", "brandNew:string"], judged)).toEqual({
      residue: ["brandNew:string"],
      settled: ["startDate:string"],
    });
  });

  it("is quiet when every difference has been judged", () => {
    expect(
      unacknowledged("getDraftResults", ["draftDate:string", "startDate:string"], judged).residue,
    ).toEqual([]);
  });

  it("judges per read, so the same path under another read is still new", () => {
    // `draftDate:string` is acknowledged for `getLeagueInfo` too, and that entry
    // must not excuse it here — a path means a different thing in each payload.
    expect(unacknowledged("getStandings", ["draftDate:string"], judged).residue).toEqual([
      "draftDate:string",
    ]);
  });

  it("names an entry that has stopped differing, so the file can be pruned", () => {
    // The day the real league answers one of these it becomes clutter, and
    // clutter in this file is a blindfold rather than a note.
    expect(unacknowledged("getDraftResults", [], judged).settled).toEqual([
      "draftDate:string",
      "startDate:string",
    ]);
  });

  it("has nothing to say about a read with no entries", () => {
    expect(unacknowledged("getStandings", [], judged)).toEqual({ residue: [], settled: [] });
  });
});

describe("orphaned", () => {
  it("names an entry whose read the differ no longer makes", () => {
    // A renamed read strands its judgements: they match nothing and the gate reddens on audited paths.
    expect(orphaned(judged, ["getDraftResults"])).toEqual([judged[2]]);
  });

  it("is empty when every entry names a read that runs", () => {
    expect(orphaned(judged, ["getDraftResults", "getLeagueInfo"])).toEqual([]);
  });
});
