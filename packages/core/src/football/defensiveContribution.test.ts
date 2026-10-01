import { describe, expect, it } from "vitest";
import { fplDefConAt } from "./defensiveContribution";

describe("fplDefConAt", () => {
  it("is close at half FPL's threshold: 5 of 10 for a defender, 6 of 12 further up", () => {
    expect(["D", "M", "F"].map(fplDefConAt)).toEqual([
      { mark: 10, close: 5 },
      { mark: 12, close: 6 },
      { mark: 12, close: 6 },
    ]);
  });

  it("is nothing for a keeper, whom FPL never pays, or a man named in no position", () => {
    expect(fplDefConAt("G")).toBeNull();
    expect(fplDefConAt(null)).toBeNull();
  });
});
