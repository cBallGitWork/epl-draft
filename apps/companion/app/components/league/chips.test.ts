import { describe, expect, it } from "vitest";
import { chipsFor } from "./Chips";

const quiet = { goals: 0, assists: 0, saves: 0, yellowCards: 0, redCards: 0 };

describe("chipsFor", () => {
  it("ranks a sending-off, then goals, then an assist, and drops the booking the red replaced", () => {
    const done = { ...quiet, goals: 2, assists: 1, redCards: 1, yellowCards: 1 };
    expect(chipsFor(done).map((chip) => chip.label)).toEqual(["RC", "G×2", "A"]);
  });
});
