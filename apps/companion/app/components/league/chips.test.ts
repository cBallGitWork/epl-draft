import { describe, expect, it } from "vitest";
import { chipsFor } from "./Chips";

const quiet = { goals: 0, assists: 0, saves: 0, yellowCards: 0, redCards: 0 };

describe("chipsFor", () => {
  it("draws no chip for FPL's bonus, which belongs on the FPL tab alone", () => {
    // A match line still carries `bonus`; the chip must not read it.
    expect(chipsFor({ ...quiet, bonus: 3 } as typeof quiet).map((chip) => chip.label)).toEqual([]);
  });

  it("ranks a sending-off, then goals, then an assist, and drops the booking the red replaced", () => {
    const done = { ...quiet, goals: 2, assists: 1, redCards: 1, yellowCards: 1 };
    expect(chipsFor(done).map((chip) => chip.label)).toEqual(["RC", "G×2", "A"]);
  });
});
