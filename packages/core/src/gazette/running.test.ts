import { describe, expect, it } from "vitest";
import { attempted, hasRoom } from "./running";
import type { Assignment } from "./newsdesk";

const a = (kind: Assignment["kind"], key: string): Assignment =>
  ({ kind, key, slug: key }) as Assignment;

// The running order of a finished round, in the sequence the newsdesk emits it.
const ROUND: Assignment[] = [
  a("round-report", "round-report:gw2"),
  a("eleven", "eleven:gw2"),
  a("power-ranking", "power-ranking:gw2"),
  a("dodgers", "dodgers:gw2"),
  a("studio", "studio:gw2"),
  a("presser", "presser:gw2"),
  a("match-report", "match:gw2:MUNvARS"),
  a("match-report", "match:gw2:LIVvEVE"),
];

/** The two kinds that refused every firing from 2 Sep. */
const wedged = (assignment: Assignment) =>
  assignment.kind === "eleven" || assignment.kind === "dodgers";

describe("the running order", () => {
  it("fills the cap with stories rather than with refusals", () => {
    // THE BUG, as it actually happened. The order was sliced to the cap first,
    // so a firing of two got [round-report, eleven]: one story and one refusal.
    // The next got [eleven, power-ranking], and every firing after that got
    // [eleven, dodgers] — two refusals, "nothing to file", forever.
    const got = attempted(ROUND, 2, wedged).map((assignment) => assignment.kind);
    expect(got).toEqual(["round-report", "power-ranking"]);
  });

  it("reaches the match reports queued behind six columns", () => {
    // What Craig actually asked for. At a cap of 10 the whole order is
    // attempted, and the two refusing kinds cost nothing.
    const got = attempted(ROUND, 10, wedged).map((assignment) => assignment.key);
    expect(got).toContain("match:gw2:MUNvARS");
    expect(got).toContain("match:gw2:LIVvEVE");
    expect(got).not.toContain("eleven:gw2");
    expect(got).toHaveLength(6);
  });

  it("never attempts more than the cap", () => {
    expect(attempted(ROUND, 3, () => false)).toHaveLength(3);
    expect(attempted(ROUND, 100, () => false)).toHaveLength(ROUND.length);
  });

  it("returns nothing when every desk refuses, however long the order", () => {
    // Not an error: the facts moved between the newsdesk's look and the
    // brief's. The writer exits quietly on this rather than red.
    expect(attempted(ROUND, 10, () => true)).toEqual([]);
  });

  it("counts room by what is filed, not by how far down the order it is", () => {
    expect(hasRoom(0, 2)).toBe(true);
    expect(hasRoom(1, 2)).toBe(true);
    expect(hasRoom(2, 2)).toBe(false);
    expect(hasRoom(9, 2)).toBe(false);
  });
});
