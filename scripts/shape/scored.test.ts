import { describe, expect, it } from "vitest";
import played from "../../packages/core/src/league/fantrax/__fixtures__/liveScoringPlayed.json";
import unplayed from "../../packages/core/src/league/fantrax/__fixtures__/liveScoringUnplayed.json";
import { lastScored } from "./scored";

// The walk back to a period somebody has played, over recorded payloads: no network.

/** A league whose periods up to `through` have been played, and which notes each period it is asked for. */
function league(through: number) {
  const asked: number[] = [];
  const read = (period: number) => {
    asked.push(period);
    return Promise.resolve(period <= through ? played : unplayed);
  };
  return { asked, read };
}

describe("lastScored", () => {
  it("reads the open period when men have scored in it", async () => {
    const { asked, read } = league(6);
    expect(await lastScored(6, read)).toBe(played);
    expect(asked).toEqual([6]);
  });

  it("walks back past periods nobody has played to the last one somebody has", async () => {
    // A league that went live at period 4 and is open for 6: its period 1, the old fixed read, prices nobody.
    const { asked, read } = league(4);
    expect(await lastScored(6, read)).toBe(played);
    expect(asked).toEqual([6, 5, 4]);
  });

  it("answers null when no period has a scored man, group subtotals included", async () => {
    // `_5010` and `_5020` are in every unplayed statsMap: they are subtotals, never men.
    const { asked, read } = league(0);
    expect(await lastScored(3, read)).toBeNull();
    expect(asked).toEqual([3, 2, 1]);
  });
});
