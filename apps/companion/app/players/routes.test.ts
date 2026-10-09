import { describe, expect, it } from "vitest";
import { compareHref } from "./routes";

describe("compareHref", () => {
  it("carries the board's pair as the board always linked it", () => {
    expect(compareHref({ a: "03gu4", b: "04ab1" })).toBe("/players/analysis?a=03gu4&b=04ab1");
  });

  it("keeps the fields in the order given and drops the empty ones", () => {
    expect(compareHref({ b: "04ab1", a: undefined, qa: "" })).toBe("/players/analysis?b=04ab1");
    expect(compareHref({ b: "04ab1", a: "03gu4", qa: "sal" })).toBe("/players/analysis?b=04ab1&a=03gu4&qa=sal");
  });

  it("is the bare screen with nothing to carry", () => {
    expect(compareHref({})).toBe("/players/analysis");
  });
});
