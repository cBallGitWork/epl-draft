import { describe, expect, it } from "vitest";
import { startedOf } from "./draftReads";

describe("startedOf", () => {
  const sheets = new Map([[48, new Set([10, 11])]]);
  it("reads a man as a starter or not from his match's team sheet", () => {
    expect(startedOf(10, [48], sheets)).toBe(true);
    expect(startedOf(12, [48], sheets)).toBe(false);
  });

  it("says nothing when a match he played has no sheet, rather than benching him", () => {
    expect(startedOf(12, [49], sheets)).toBeNull();
    expect(startedOf(12, [], sheets)).toBeNull();
  });
});
