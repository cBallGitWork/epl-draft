import { describe, expect, it } from "vitest";
import { pageAt, pageOf } from "./paperPages";

// The turn-line's decision: a teaser standing on the page it points at says
// "read on" rather than "turn to page 3". `Dateline` compares these two.
describe("a teaser on the page it points at", () => {
  it("resolves both sides of the comparison to the same href", () => {
    for (const kind of ["power-ranking", "dodgers", "wire", "eleven"]) {
      expect(pageOf(kind)?.href).toBe(pageAt("/paper/columns").href);
    }
    for (const kind of ["tie-report", "news", "presser"]) {
      expect(pageOf(kind)?.href).toBe(pageAt("/paper/reports").href);
    }
  });

  it("still points a reader elsewhere when the page differs", () => {
    expect(pageOf("presser")?.href).not.toBe(pageAt("/paper/columns").href);
  });
});
