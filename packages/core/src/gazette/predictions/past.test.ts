import { describe, expect, it } from "vitest";
import { CORE_MARK, LAWRO_CORE, PAST, pastOffered } from "./past";

describe("pastOffered", () => {
  const quiet = (length: number) => Array.from({ length }, () => "Nothing about himself.");

  it("offers the fired instinct's own line, and his first column nothing more", () => {
    expect(pastOffered(["doubt"], []).map((line) => line.id)).toEqual(["achilles"]);
    // His Liverpool bias shows in his calls and never in a line about it.
    expect(pastOffered(["liverpool"], [])).toEqual([]);
  });

  it("offers a line in turn only every fourth column, because everybody knows who he is", () => {
    expect(pastOffered([], quiet(2))).toEqual([]);
    expect(pastOffered([], quiet(3)).map((line) => line.id)).toEqual(["8000"]);
    expect(pastOffered([], quiet(4))).toEqual([]);
  });

  it("offers the first instinct's line when several fired, never two of them", () => {
    expect(pastOffered(["liverpool", "doubt"], quiet(3)).map((line) => line.id)).toEqual(["achilles", "8000"]);
  });

  it("rests a line he used recently, and turns to the one least recently used", () => {
    // Newest first: he used the 159 line last week, and the 8,000 line the week before.
    const past = ["I once went 159 games without having Liverpool down to lose.", "8,000 predictions and still.", "Nothing."];
    const offered = pastOffered(["liverpool"], past);
    expect(offered.map((line) => line.id)).toEqual(["points"]);
  });

  it("brings a rotation line back once it has rested twelve columns", () => {
    // A column that used every rotation line: none is offered at the next turn.
    const everything = PAST.filter((line) => line.instinct === undefined).map((line) => line.line).join(" ");
    expect(pastOffered([], [...quiet(2), everything])).toEqual([]);
    // Twelve columns on they have all rested, and the pool reopens in its own order.
    expect(pastOffered([], [...quiet(14), everything]).map((line) => line.id)).toEqual(["8000"]);
  });

  it("finds every line by its own mark, so usage can be read back from the archive", () => {
    for (const line of PAST) expect(line.mark.test(line.line)).toBe(true);
    expect(CORE_MARK.test(LAWRO_CORE)).toBe(true);
  });
});
