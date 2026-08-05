import { describe, expect, it } from "vitest";
import { isUnmapped, mergeBridge, settledIds, type Bridge } from "./bridge";

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

  it("keeps a confirmed unmapped player unmapped", () => {
    // Fantrax's academy players have no FPL counterpart and never will. Without
    // this they would be re-proposed on every single run, forever.
    const existing: Bridge = {
      a1: { status: "unmapped", reason: "academy, not in FPL", auditedAt: "2026-08-05" },
    };
    const merged = mergeBridge(existing, {
      a1: { fplCode: 500, matchedBy: "fuzzy", confidence: 89 },
    });
    expect(isUnmapped(merged.a1!)).toBe(true);
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
  it("counts both mapped and unmapped as settled", () => {
    const bridge: Bridge = {
      a1: { fplCode: 100, matchedBy: "exact", confidence: 100 },
      a2: { status: "unmapped", reason: "academy", auditedAt: "2026-08-05" },
    };
    expect(settledIds(bridge)).toEqual(new Set(["a1", "a2"]));
  });
});
