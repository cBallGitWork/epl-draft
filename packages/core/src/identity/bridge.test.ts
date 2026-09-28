import { describe, expect, it } from "vitest";
import { type Bridge, fplCodeOf, isAssumed, isUnmapped, mergeBridge, settledIds } from "./bridge";

describe("mergeBridge", () => {
  it("adds players it has never seen", () => {
    const merged = mergeBridge(
      {},
      { a1: { fplCode: 100, matchedBy: "exact", confidence: 100 } },
    );
    expect(merged.a1).toMatchObject({ fplCode: 100 });
  });

  it("never revises what a human audited", () => {
    // The commissioner mutates the pool constantly, so this script runs over and
    // over. A re-run that quietly overwrote an audited decision would make the
    // file untrustworthy exactly where it was most carefully made.
    const existing: Bridge = {
      a1: { fplCode: 100, matchedBy: "manual", confidence: 100, auditedAt: "2026-08-05" },
    };
    const merged = mergeBridge(existing, {
      a1: { fplCode: 999, matchedBy: "fuzzy", confidence: 91 },
    });
    expect(merged.a1).toEqual(existing.a1);
  });

  it("keeps a person's unmapped verdict unmapped", () => {
    const existing: Bridge = {
      a1: { status: "unmapped", unmappedBy: "manual", note: "retired" },
    };
    const merged = mergeBridge(existing, {
      a1: { fplCode: 500, matchedBy: "fuzzy", confidence: 89 },
    });
    expect(merged.a1).toEqual(existing.a1);
  });

  it("keeps a machine assumption a person went on to confirm", () => {
    // Confirming the script's reasoning is a person looking. `unmappedBy` still
    // says who reasoned; `auditedAt` is what makes the row final.
    const existing: Bridge = {
      a1: { status: "unmapped", unmappedBy: "no-fpl-match", bestScore: 41, auditedAt: "2026-08-19" },
    };
    const merged = mergeBridge(existing, {
      a1: { fplCode: 500, matchedBy: "fuzzy", confidence: 89 },
    });
    expect(merged.a1).toEqual(existing.a1);
  });

  it("replaces its own assumption when the player turns up in FPL", () => {
    // Three of the first residue we recorded were listed by FPL a week later.
    // "Nobody looks like him" was only ever true of the list that run read.
    const merged = mergeBridge(
      { a1: { status: "unmapped", unmappedBy: "no-fpl-match", bestScore: 47 } },
      { a1: { fplCode: 465920, matchedBy: "exact", confidence: 100 } },
    );
    expect(merged.a1).toEqual({ fplCode: 465920, matchedBy: "exact", confidence: 100 });
  });

  it("refreshes an assumption with what this run saw", () => {
    // The score is evidence about a particular FPL list, so a stale one is worse
    // than none: a rising best score is the tell that somebody close has arrived.
    const merged = mergeBridge(
      { a1: { status: "unmapped", unmappedBy: "no-fpl-match", bestScore: 36 } },
      { a1: { status: "unmapped", unmappedBy: "no-fpl-match", bestScore: 48 } },
    );
    expect(merged.a1).toMatchObject({ bestScore: 48 });
  });

  it("forgets an assumption this run did not make again", () => {
    // The run that dropped him did so by sending him to review instead. Keeping
    // the row would have the file say "no FPL counterpart" about the one player
    // it is simultaneously asking somebody to identify.
    const merged = mergeBridge(
      {
        a1: { status: "unmapped", unmappedBy: "no-fpl-match", bestScore: 47 },
        a2: { status: "unmapped", unmappedBy: "manual", auditedAt: "2026-08-19" },
      },
      {},
    );
    expect(merged).toEqual({
      a2: { status: "unmapped", unmappedBy: "manual", auditedAt: "2026-08-19" },
    });
  });

  it("leaves unrelated entries alone", () => {
    const existing: Bridge = { a1: { fplCode: 100, matchedBy: "exact", confidence: 100 } };
    const merged = mergeBridge(existing, {
      a2: { fplCode: 200, matchedBy: "exact", confidence: 100 },
    });
    expect(Object.keys(merged).sort()).toEqual(["a1", "a2"]);
  });
});

describe("settledIds", () => {
  it("counts a mapped player and a person's unmapped verdict as settled", () => {
    const bridge: Bridge = {
      a1: { fplCode: 100, matchedBy: "exact", confidence: 100 },
      a2: { status: "unmapped", unmappedBy: "manual", auditedAt: "2026-08-05" },
    };
    expect(settledIds(bridge)).toEqual(new Set(["a1", "a2"]));
  });

  it("does not count the script's own assumption as settled", () => {
    // Recorded, but not settled: it goes back through the matcher every run,
    // which is the only thing that ever promotes an academy player FPL lists in
    // January.
    const bridge: Bridge = {
      a1: { status: "unmapped", unmappedBy: "no-fpl-match", bestScore: 36 },
    };
    expect(settledIds(bridge)).toEqual(new Set());
  });
});

describe("isAssumed", () => {
  it("tells the script's conclusion from a person's without reading a date", () => {
    expect(isAssumed({ status: "unmapped", unmappedBy: "no-fpl-match" })).toBe(true);
    expect(isAssumed({ status: "unmapped", unmappedBy: "manual" })).toBe(false);
  });

  it("treats a mapped player as final however he was matched", () => {
    expect(isAssumed({ fplCode: 1, matchedBy: "fuzzy", confidence: 88 })).toBe(false);
  });
});

describe("isUnmapped", () => {
  it("covers both kinds, so no caller has to know there are two", () => {
    // roster.ts and the player page branch on this and on nothing else. A second
    // check at the app edge would be the same test in two places.
    expect(isUnmapped({ status: "unmapped", unmappedBy: "no-fpl-match" })).toBe(true);
    expect(isUnmapped({ status: "unmapped", unmappedBy: "manual" })).toBe(true);
    expect(isUnmapped({ fplCode: 1, matchedBy: "exact", confidence: 100 })).toBe(false);
  });
});

describe("fplCodeOf", () => {
  const bridge: Bridge = {
    a1: { fplCode: 100, matchedBy: "exact", confidence: 100 },
    b2: { status: "unmapped", unmappedBy: "no-fpl-match" },
  };

  it("answers a matched man's code", () => {
    expect(fplCodeOf(bridge, "a1")).toBe(100);
  });

  it("answers null for a man FPL has no row for, and for one the bridge has not seen", () => {
    expect(fplCodeOf(bridge, "b2")).toBeNull();
    expect(fplCodeOf(bridge, "zz")).toBeNull();
  });
});
