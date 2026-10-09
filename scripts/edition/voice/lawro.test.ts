import { describe, expect, it } from "vitest";
import { MOST_THREADS } from "@epl/core";
import { predictionsVoice } from "./lawro";

// His prompt's storyline line, word for word as filed: a line in a prompt is a line in the paper.
const THREADS = "THREADS: report 0 to 3 running storylines, only where the facts open or advance one. An empty array is the ordinary answer.";

describe("Lawro's storylines", () => {
  it("asks for as many as the newsroom keeps, in the words his column has always used", () => {
    expect(predictionsVoice(5)).toContain(THREADS);
    expect(THREADS).toContain(`0 to ${MOST_THREADS} running storylines`);
  });
});
