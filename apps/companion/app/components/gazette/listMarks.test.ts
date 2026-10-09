import { describe, expect, it } from "vitest";
import { listMarks } from "./listMarks";

/** The selector of each rule, without its declarations. */
const selectors = (css: string) => css.split("}").filter((rule) => rule !== "").map((rule) => rule.slice(0, rule.indexOf("{")));

describe("listMarks", () => {
  it("marks the lead's row by its own anchor when no match is chosen, since the list opens on its heading", () => {
    // `a:first-child` matched nothing: the list's first child is its `<h3>`, so the lead's row never lit.
    expect(selectors(listMarks("rpt", ["m-1", "m-2"]))[0]).toBe('.rpt:not(:has(section:target)) .rpt-list a[href="#m-1"]');
  });

  it("marks a chosen match's row by its anchor", () => {
    expect(selectors(listMarks("dft", ["d-1", "d-2"])).slice(1)).toEqual([
      '.dft:has(#d-1:target) .dft-list a[href="#d-1"]',
      '.dft:has(#d-2:target) .dft-list a[href="#d-2"]',
    ]);
  });

  it("writes nothing for a report with no matches", () => {
    expect(listMarks("dft", [])).toBe("");
  });
});
