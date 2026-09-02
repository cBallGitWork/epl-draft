import { describe, expect, it } from "vitest";
import type { SquadLine } from "./lineup";
import { tactics } from "./tactics";

const line = (position: string, ids: string[]): SquadLine => ({
  position,
  players: ids.map((fantraxId) => ({
    slot: { fantraxId, position, status: "ACTIVE" },
    unresolved: "unmapped",
  })),
});

/** Who points forward, as a list of ids — the readable form of the answer. */
const forward = (lines: SquadLine[]) =>
  [...tactics(lines)].filter(([, instruction]) => instruction === "forward").map(([id]) => id);

describe("tactics", () => {
  it("sends the full-backs forward in a flat four", () => {
    // 4-4-2: the wide men on both the back and middle lines, and the two
    // strikers, which is the shape everyone pictures.
    const shape = [
      line("G", ["gk"]),
      line("D", ["lb", "cb1", "cb2", "rb"]),
      line("M", ["lm", "cm1", "cm2", "rm"]),
      line("F", ["st1", "st2"]),
    ];
    expect(forward(shape).sort()).toEqual(["lb", "lm", "rb", "rm", "st1", "st2"].sort());
  });

  it("leaves a back three alone — it is a spine, not a flat line", () => {
    const shape = [line("G", ["gk"]), line("D", ["cb1", "cb2", "cb3"]), line("F", ["st"])];
    expect(forward(shape)).toEqual([]);
  });

  it("holds a lone striker and splits a front two", () => {
    const lone = [line("G", ["gk"]), line("D", ["a", "b", "c"]), line("F", ["st"])];
    expect(forward(lone)).toEqual([]);

    const pair = [line("G", ["gk"]), line("D", ["a", "b", "c"]), line("F", ["st1", "st2"])];
    expect(forward(pair)).toEqual(["st1", "st2"]);
  });

  it("sends the wing-backs on in a five", () => {
    const shape = [
      line("G", ["gk"]),
      line("D", ["lwb", "cb1", "cb2", "cb3", "rwb"]),
      line("F", ["st"]),
    ];
    expect(forward(shape)).toEqual(["lwb", "rwb"]);
  });

  it("never sends the keeper anywhere", () => {
    const shape = [line("G", ["gk"]), line("D", ["a", "b", "c", "d"]), line("F", ["st"])];
    expect(tactics(shape).get("gk")).toBeNull();
  });
});
