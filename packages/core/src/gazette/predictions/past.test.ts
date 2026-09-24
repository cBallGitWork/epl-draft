import { describe, expect, it } from "vitest";
import { CORE_MARK, LAWRO_CORE, PAST, pastOffered } from "./past";

describe("pastOffered", () => {
  it("offers the fired instinct's own line and one line in turn", () => {
    const offered = pastOffered(["liverpool"], []);
    expect(offered.map((line) => line.id)).toEqual(["159", "8000"]);
  });

  it("offers the first instinct's line when several fired, never two of them", () => {
    expect(pastOffered(["liverpool", "doubt"], []).map((line) => line.id)).toEqual(["achilles", "8000"]);
  });

  it("rests a line he used recently, and turns to the one least recently used", () => {
    // Newest first: he used the 159 line last week, and the 8,000 line the week before.
    const past = ["I once went 159 games without having Liverpool down to lose.", "8,000 predictions and still."];
    const offered = pastOffered(["liverpool"], past);
    expect(offered.map((line) => line.id)).toEqual(["points"]);
  });

  it("brings a rotation line back once it has rested twelve columns", () => {
    // One column that used every rotation line: none is offered the week after.
    const everything = PAST.filter((line) => line.instinct === undefined).map((line) => line.line).join(" ");
    expect(pastOffered([], [everything])).toEqual([]);
    // Twelve quiet columns later they have all rested, and the pool reopens in its own order.
    const quiet = Array.from({ length: 12 }, () => "Nothing about himself.");
    expect(pastOffered([], [...quiet, everything]).map((line) => line.id)).toEqual(["8000"]);
  });

  it("finds every line by its own mark, so usage can be read back from the archive", () => {
    for (const line of PAST) expect(line.mark.test(line.line)).toBe(true);
    expect(CORE_MARK.test(LAWRO_CORE)).toBe(true);
  });
});
