import { describe, expect, it } from "vitest";
import { THREAD_MAX_BEATS, type StoryThread } from "../ledger";
import { storylinesBlock } from "./storylines";

const thread = (over: Partial<StoryThread> = {}): StoryThread => ({
  subject: "The No.2 overall",
  beat: "Blanked again.",
  status: "open",
  beats: 2,
  lastUsedAt: "2026-08-31T09:00:00.000Z",
  ...over,
});

describe("storylinesBlock", () => {
  it("says nothing when there is no memory", () => {
    expect(storylinesBlock([])).toBeNull();
  });

  it("hands a live thread its beat, and a worn one only its subject", () => {
    // Withhold, don't just forbid: the worn list must not carry the material
    // to repeat the joke with.
    const block = storylinesBlock([
      thread(),
      thread({ subject: "Is Salah finished", beat: "He is not.", status: "retired" }),
    ]);
    expect(block).toContain("The No.2 overall: Blanked again.");
    expect(block).toContain("Is Salah finished");
    expect(block).not.toContain("He is not.");
  });

  it("wears a thread out by beat count whatever its status says", () => {
    const block = storylinesBlock([thread({ beats: THREAD_MAX_BEATS })]);
    expect(block).toContain("WORN ANGLES");
    expect(block).not.toContain("Blanked again.");
  });
});
