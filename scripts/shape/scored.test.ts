import { describe, expect, it } from "vitest";
import played from "../../packages/core/src/league/fantrax/__fixtures__/liveScoringPlayed.json";
import unplayed from "../../packages/core/src/league/fantrax/__fixtures__/liveScoringUnplayed.json";
import { comparableLive } from "./scored";

// Which live scoring shape-diff compares, over recorded payloads and stubbed standings: no network.

/** Every record still 0-0-0, as the real league's ten were on 8 Oct, before its first game. */
const NOBODY_PLAYED = [
  { teamId: "a", points: "0-0-0" },
  { teamId: "b", points: "0-0-0" },
];
/** One game settled: the rehearsal league's table on 8 Oct had 1-0-1 beside 0-0-0. */
const ONE_PLAYED = [
  { teamId: "a", points: "1-0-1" },
  { teamId: "b", points: "0-0-0" },
];

/** A league whose periods up to `through` have scored men, noting each read it is asked for. */
function league(through: number, standings: { teamId: string; points: string }[] = NOBODY_PLAYED) {
  const asked: (number | "standings")[] = [];
  return {
    asked,
    readLive: (period: number) => {
      asked.push(period);
      return Promise.resolve(period <= through ? played : unplayed);
    },
    readStandings: () => {
      asked.push("standings");
      return Promise.resolve(standings);
    },
  };
}

describe("comparableLive", () => {
  it("reads the open period when men have scored in it, and nothing else", async () => {
    const { asked, readLive, readStandings } = league(6);
    expect(await comparableLive(6, readLive, readStandings)).toBe(played);
    expect(asked).toEqual([6]);
  });

  it("walks back past periods nobody has played to the last one somebody has", async () => {
    // A league that went live at period 4 and is open for 6: its period 1, the old fixed read, prices nobody.
    const { asked, readLive, readStandings } = league(4);
    expect(await comparableLive(6, readLive, readStandings)).toBe(played);
    expect(asked).toEqual([6, 5, 4]);
  });

  it("is unplayed when no period has a scored man and every record is 0-0-0, as before a first kickoff", async () => {
    // `_5010` and `_5020` are in every unplayed statsMap: they are subtotals, never men.
    const { asked, readLive, readStandings } = league(0, NOBODY_PLAYED);
    expect(await comparableLive(3, readLive, readStandings)).toBe("unplayed");
    expect(asked).toEqual([3, 2, 1, "standings"]);
  });

  it("is unplayed for a league with no standings rows at all", async () => {
    const { readLive, readStandings } = league(0, []);
    expect(await comparableLive(2, readLive, readStandings)).toBe("unplayed");
  });

  it("is null when a game has been played and still no period up to the open one has a scored man", async () => {
    const { asked, readLive, readStandings } = league(0, ONE_PLAYED);
    expect(await comparableLive(3, readLive, readStandings)).toBeNull();
    expect(asked).toEqual([3, 2, 1, "standings"]);
  });
});
