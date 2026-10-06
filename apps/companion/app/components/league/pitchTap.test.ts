import { describe, expect, it } from "vitest";
import { pitchTap } from "./pitchTap";

const neither = { swap: false, reorder: false };

describe("pitchTap", () => {
  it("picks a man when nobody is picked", () => {
    expect(pitchTap(null, "saka", { swap: true, reorder: true })).toBe("pick");
  });

  it("opens the picked man's moves on a second tap", () => {
    expect(pitchTap("saka", "saka", neither)).toBe("open");
  });

  it("swaps with a man the picked one can change places with, before reordering the bench", () => {
    expect(pitchTap("saka", "rice", { swap: true, reorder: true })).toBe("swap");
  });

  it("reorders two subs who cannot swap", () => {
    expect(pitchTap("kerkez", "kudus", { swap: false, reorder: true })).toBe("reorder");
  });

  it("does nothing on a man who can neither swap nor reorder", () => {
    expect(pitchTap("saka", "pickford", neither)).toBe("none");
  });
});
