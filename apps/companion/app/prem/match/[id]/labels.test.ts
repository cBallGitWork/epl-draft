import { describe, expect, it } from "vitest";
import type { Placed } from "./labels";
import { placeLabels } from "./labels";

const man = (code: number, name: string, x: number, y: number): Placed => ({ code, name, x, y });

/** Whether any two labels in a placed set overlap, by the same rule the module
 *  places them with — written out here rather than imported so a change to the
 *  arithmetic has to satisfy a second reader. */
function overlapping(placed: ReturnType<typeof placeLabels>): number {
  let count = 0;
  for (let a = 0; a < placed.length; a += 1) {
    for (let b = a + 1; b < placed.length; b += 1) {
      const room = ((placed[a].name.length + placed[b].name.length) / 2) * 1.4;
      if (
        Math.abs(placed[a].labelY - placed[b].labelY) < 5 &&
        Math.abs(placed[a].labelX - placed[b].labelX) < room
      ) {
        count += 1;
      }
    }
  }
  return count;
}

describe("placeLabels", () => {
  it("hangs a name under its own man when nothing is in the way", () => {
    const [only] = placeLabels([man(1, "Isak", 50, 50)]);
    expect(only.labelY).toBeGreaterThan(50);
    expect(only.labelX).toBe(50);
  });

  it("puts the second of two bunched men on the other side of his disc", () => {
    // The case Craig sent: two men four units apart, whose names were set on one
    // line on top of each other.
    const placed = placeLabels([man(1, "Isak", 50, 48), man(2, "Wirtz", 52, 52)]);
    expect(overlapping(placed)).toBe(0);
  });

  it("resolves a whole line standing on one spot", () => {
    // A back four squeezed onto one y is the real bunching this exists for, and
    // the eight slots either side of a disc take it comfortably.
    const line = Array.from({ length: 4 }, (_, at) => man(at, `Defender${at}`, 40 + at * 0.5, 50));
    expect(overlapping(placeLabels(line))).toBe(0);
  });

  it("gives up near its own man rather than flying across the pitch", () => {
    // Eleven men on one spot cannot all be separated and never happens; what
    // matters is what the arithmetic does when it runs out of room. A name
    // further from its own disc than from everyone else's would be a wrong
    // answer, where an overlap is only an unreadable one.
    const heap = Array.from({ length: 11 }, (_, at) => man(at, `Player${at}`, 50 + at * 0.2, 50));
    for (const each of placeLabels(heap)) {
      expect(Math.abs(each.labelY - each.y)).toBeLessThanOrEqual(20);
    }
  });

  it("never moves the man himself", () => {
    const men = [man(1, "Isak", 50, 48), man(2, "Wirtz", 52, 52)];
    const placed = placeLabels(men);
    // The disc is a measurement; only the word is free to move.
    expect(placed.map((each) => [each.x, each.y])).toEqual(
      expect.arrayContaining([
        [50, 48],
        [52, 52],
      ]),
    );
  });

  it("pulls a name off the touchline rather than letting the pitch clip it", () => {
    const [wide] = placeLabels([man(1, "Lewis-Skelly", 2, 50)]);
    expect(wide.labelX).toBeGreaterThan(2);
    expect(wide.labelX).toBeLessThan(12);
  });

  it("keeps a name inside the pitch at the goal line end", () => {
    const [keeper] = placeLabels([man(1, "Alisson", 9, 99)]);
    expect(keeper.labelY).toBeLessThanOrEqual(97.5);
  });

  it("is the same picture every time, whatever order the eleven arrive in", () => {
    const eleven = [man(1, "Isak", 50, 48), man(2, "Wirtz", 52, 52), man(3, "Gakpo", 51, 50)];
    const one = placeLabels(eleven);
    const other = placeLabels([...eleven].reverse());
    expect(one).toEqual(other);
  });

  it("answers nothing for nobody", () => {
    expect(placeLabels([])).toEqual([]);
  });
});
