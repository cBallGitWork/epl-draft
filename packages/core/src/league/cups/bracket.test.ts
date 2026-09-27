import { describe, expect, it } from "vitest";
import { seededBracket, type BracketRound } from "./bracket";
import { doubleBracket } from "./doubleBracket";

const shape = (rounds: BracketRound[]) => rounds.map((round) => `${round.id}×${round.ties.length}`);

const seedsIn = (rounds: BracketRound[]) =>
  rounds.flatMap((round) => round.ties.flatMap((tie) => [tie.home, tie.away])).flatMap((side) =>
    "seed" in side ? [side.seed] : [],
  );

describe("seededBracket", () => {
  it("gives six entrants two byes and keeps 1 and 2 apart until the final", () => {
    expect(seededBracket(6)).toEqual([
      {
        id: "W1",
        ties: [
          { id: "W1-1", home: { seed: 4 }, away: { seed: 5 } },
          { id: "W1-2", home: { seed: 3 }, away: { seed: 6 } },
        ],
      },
      {
        id: "W2",
        ties: [
          { id: "W2-1", home: { seed: 1 }, away: { winnerOf: "W1-1" } },
          { id: "W2-2", home: { seed: 2 }, away: { winnerOf: "W1-2" } },
        ],
      },
      { id: "W3", ties: [{ id: "W3-1", home: { winnerOf: "W2-1" }, away: { winnerOf: "W2-2" } }] },
    ]);
  });

  it("opens five with a play-in between 4 and 5, then 1 against its winner and 2 against 3", () => {
    const [playIn, semis] = seededBracket(5);
    expect(playIn?.ties).toEqual([{ id: "W1-1", home: { seed: 4 }, away: { seed: 5 } }]);
    expect(semis?.ties).toEqual([
      { id: "W2-1", home: { seed: 1 }, away: { winnerOf: "W1-1" } },
      { id: "W2-2", home: { seed: 2 }, away: { seed: 3 } },
    ]);
  });

  it("plays a power of two out with no byes, and has no ties for fewer than two", () => {
    expect(shape(seededBracket(8))).toEqual(["W1×4", "W2×2", "W3×1"]);
    expect(seededBracket(1)).toEqual([]);
  });
});

describe("doubleBracket", () => {
  it("puts ten entrants' top six on byes: only 7 to 10 play the first round", () => {
    const [opening] = doubleBracket(10);
    expect(opening?.ties).toEqual([
      { id: "W1-1", home: { seed: 8 }, away: { seed: 9 } },
      { id: "W1-2", home: { seed: 7 }, away: { seed: 10 } },
    ]);
  });

  it("knocks a team out only on its second defeat, and ends in one final", () => {
    const rounds = doubleBracket(10);
    const ties = rounds.flatMap((round) => round.ties);
    const lostOnce = new Set(
      ties.flatMap((tie) => [tie.home, tie.away]).flatMap((side) => ("loserOf" in side ? [side.loserOf] : [])),
    );
    // Every winners'-bracket tie hands its loser a second life; no losers'-bracket tie does.
    for (const tie of ties.filter((each) => each.id.startsWith("W"))) expect(lostOnce.has(tie.id)).toBe(true);
    for (const tie of ties.filter((each) => each.id.startsWith("L"))) expect(lostOnce.has(tie.id)).toBe(false);

    expect(rounds.at(-1)).toEqual({ id: "F", ties: [{ id: "F-1", home: { winnerOf: "W4-1" }, away: { winnerOf: "L6-1" } }] });
    // 2 × 10 − 2 with no reset: the champion ends unbeaten, or the runner-up ends beaten only once.
    expect(ties).toHaveLength(18);
  });

  it("draws every seed exactly once", () => {
    expect(seedsIn(doubleBracket(10)).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(seedsIn(seededBracket(6)).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("makes two entrants play twice, the second time as the final", () => {
    expect(shape(doubleBracket(2))).toEqual(["W1×1", "F×1"]);
    expect(doubleBracket(1)).toEqual([]);
  });
});
