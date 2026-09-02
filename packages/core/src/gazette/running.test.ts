import { describe, expect, it } from "vitest";
import { hasRoom } from "./running";

/** The writer's loop, exactly as `write-edition.ts` runs it: walk the running
 *  order, skip what refuses, stop when the cap is FILLED. Written out here
 *  rather than exported from core, because the loop belongs to the script and
 *  a helper existing only to be tested is a helper with no consumer. */
function filed(order: readonly string[], cap: number, refuses: (kind: string) => boolean): string[] {
  const out: string[] = [];
  for (const kind of order) {
    if (!hasRoom(out.length, cap)) break;
    if (refuses(kind)) continue;
    out.push(kind);
  }
  return out;
}

/** A finished round, in the order the newsdesk emits it. */
const ROUND = [
  "round-report",
  "eleven",
  "power-ranking",
  "dodgers",
  "studio",
  "presser",
  "match-report:MUNvARS",
  "match-report:LIVvEVE",
];

/** The two kinds that refused every firing from 2 Sep. */
const wedged = (kind: string) => kind === "eleven" || kind === "dodgers";

describe("the running order", () => {
  it("fills the cap with stories rather than with refusals", () => {
    // THE BUG. The order was sliced to the cap before any desk was asked for a
    // brief, so a firing of two got [round-report, eleven]: one story and one
    // refusal. The next got [eleven, power-ranking], and every firing after
    // that got [eleven, dodgers] — two refusals, "nothing to file", forever.
    expect(filed(ROUND, 2, wedged)).toEqual(["round-report", "power-ranking"]);
  });

  it("reaches the match reports queued behind six columns", () => {
    const got = filed(ROUND, 10, wedged);
    expect(got).toContain("match-report:MUNvARS");
    expect(got).toContain("match-report:LIVvEVE");
    expect(got).not.toContain("eleven");
    expect(got).toHaveLength(6);
  });

  it("never files more than the cap", () => {
    expect(filed(ROUND, 3, () => false)).toHaveLength(3);
    expect(filed(ROUND, 100, () => false)).toHaveLength(ROUND.length);
  });

  it("files nothing when every desk refuses, however long the order", () => {
    // Not an error: the facts moved between the newsdesk's look and the
    // brief's. The writer exits quietly on this rather than red.
    expect(filed(ROUND, 10, () => true)).toEqual([]);
  });

  it("counts room by what is filed, not by how far down the order it is", () => {
    expect(hasRoom(0, 2)).toBe(true);
    expect(hasRoom(1, 2)).toBe(true);
    expect(hasRoom(2, 2)).toBe(false);
    expect(hasRoom(9, 2)).toBe(false);
  });
});
