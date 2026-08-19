import { describe, expect, it } from "vitest";
import type { Proposal } from "./match";
import { assumeUnmapped } from "./unmapped";

function proposal(fantraxId: string, reason: Proposal["reason"], scores: number[] = []): Proposal {
  return {
    fantraxId,
    fantraxName: "Salmon, Marli",
    clubCode: "ARS",
    positionHint: "M",
    candidates: scores.map((score, index) => ({ fplCode: index + 1, name: "Someone", score })),
    reason,
  };
}

describe("assumeUnmapped", () => {
  it("records a player nothing in FPL came close to", () => {
    const { assumed } = assumeUnmapped([proposal("a1", "below-threshold", [36, 30])]);
    expect(assumed.a1).toEqual({ status: "unmapped", unmappedBy: "no-fpl-match", bestScore: 36 });
  });

  it("records an empty pool without inventing a score", () => {
    // No candidates is not a score of zero: nobody was compared to him at all,
    // and a zero would read as a comparison that happened.
    const { assumed } = assumeUnmapped([proposal("a1", "no-candidates")]);
    expect(assumed.a1).toEqual({ status: "unmapped", unmappedBy: "no-fpl-match" });
  });

  it("records an exhausted pool and a bad score the same way", () => {
    // Which of the two a player gets depends on whether his club's pool happened
    // to be empty that day — a fact about the pool, not about him. Sixteen of our
    // first sixty-three swapped labels within a week with no player changing.
    const { assumed } = assumeUnmapped([
      proposal("a1", "no-candidates"),
      proposal("a2", "below-threshold", [36]),
    ]);
    expect(assumed.a1?.unmappedBy).toBe("no-fpl-match");
    expect(assumed.a2?.unmappedBy).toBe("no-fpl-match");
  });

  it("never writes an audit stamp", () => {
    // A score threshold must not be able to claim a person looked.
    const { assumed } = assumeUnmapped([proposal("a1", "below-threshold", [36])]);
    expect(assumed.a1).not.toHaveProperty("auditedAt");
    expect(assumed.a1).not.toHaveProperty("note");
  });

  it("sends a near miss to a person rather than filing him as absent", () => {
    // Fantrax's "Ehor Yarmolyuk" scores 72 against FPL's "Yehor Yarmoliuk" — the
    // same Brentford midfielder, a transliteration the metric cannot bridge.
    // Recorded as an absence he is a first-team starter nobody ever looks at
    // again; the alias that fixes him only gets written if somebody is asked.
    const split = assumeUnmapped([proposal("a1", "below-threshold", [72])]);
    expect(Object.keys(split.assumed)).toEqual([]);
    expect(split.forReview.map((entry) => entry.fantraxId)).toEqual(["a1"]);
  });

  it("leaves a plausible answer it cannot pick for a person", () => {
    // Guessing here writes a whole season onto the wrong footballer.
    const split = assumeUnmapped([
      proposal("a1", "ambiguous", [91, 90]),
      proposal("a2", "identity-taken", [100]),
    ]);
    expect(Object.keys(split.assumed)).toEqual([]);
    expect(split.forReview.map((entry) => entry.fantraxId)).toEqual(["a1", "a2"]);
  });

  it("takes a proposal it answered out of the review file", () => {
    // The whole point: without this the same academy players are re-offered for
    // review on every run, forever, and the file is never empty enough to read.
    const split = assumeUnmapped([
      proposal("a1", "no-candidates"),
      proposal("a2", "below-threshold", [36]),
      proposal("a3", "ambiguous", [91, 90]),
    ]);
    expect(split.forReview.map((entry) => entry.fantraxId)).toEqual(["a3"]);
  });
});
