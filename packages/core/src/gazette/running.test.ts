import { describe, expect, it } from "vitest";
import { hasRoom } from "./running";

/** The writer's loop as `write-edition.ts` runs it: skip what refuses, stop when the cap is filled. */
function filed(order: readonly string[], cap: number, refuses: (kind: string) => boolean): string[] {
  const out: string[] = [];
  for (const kind of order) {
    if (!hasRoom(out.length, cap)) break;
    if (refuses(kind)) continue;
    out.push(kind);
  }
  return out;
}

/** A finished gameweek, in the order the newsdesk emits it. */
const ROUND = [
  "draft-report:gw5",
  "bin-xi",
  "predictions",
  "sheets",
  "match-report:MUNvARS",
  "match-report:LIVvEVE",
];

/** Two kinds that refuse every firing. */
const wedged = (kind: string) => kind === "bin-xi" || kind === "sheets";

describe("the running order", () => {
  it("fills the cap with stories rather than with refusals", () => {
    // Slicing the order to the cap first would give [report, bin-xi], then [bin-xi, sheets] for ever.
    expect(filed(ROUND, 2, wedged)).toEqual(["draft-report:gw5", "predictions"]);
  });

  it("reaches the match reports queued behind the columns", () => {
    const got = filed(ROUND, 10, wedged);
    expect(got).toContain("match-report:MUNvARS");
    expect(got).toContain("match-report:LIVvEVE");
    expect(got).not.toContain("bin-xi");
    // Everything in the order except the two wedged kinds.
    expect(got).toHaveLength(ROUND.length - 2);
  });

  it("never files more than the cap", () => {
    expect(filed(ROUND, 3, () => false)).toHaveLength(3);
    expect(filed(ROUND, 100, () => false)).toHaveLength(ROUND.length);
  });

  it("files nothing when every desk refuses, however long the order", () => {
    // Not an error: the facts moved between the newsdesk's look and the brief's.
    expect(filed(ROUND, 10, () => true)).toEqual([]);
  });

  it("counts room by what is filed, not by how far down the order it is", () => {
    expect(hasRoom(0, 2)).toBe(true);
    expect(hasRoom(1, 2)).toBe(true);
    expect(hasRoom(2, 2)).toBe(false);
    expect(hasRoom(9, 2)).toBe(false);
  });
});
