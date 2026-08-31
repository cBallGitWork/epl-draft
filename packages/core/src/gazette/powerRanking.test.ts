import { describe, expect, it } from "vitest";
import { powerRows } from "./powerRanking";
import type { StandingsRow } from "../league/types";
import type { StoryResult } from "./types";

const row = (over: Partial<StandingsRow> = {}): StandingsRow => ({
  teamId: "t1",
  teamName: "test2",
  rank: 1,
  won: 2,
  drawn: 0,
  lost: 1,
  points: 6,
  pointsFor: 123.5,
  ...over,
} as StandingsRow);

const result = (winner: string, loser: string, margin: number): StoryResult => ({
  winner: { teamId: winner, name: winner, points: 45 },
  loser: { teamId: loser, name: loser, points: 45 - margin },
  margin,
});

describe("powerRows", () => {
  it("carries the table's own placing — the thing the column argues with", () => {
    const [only] = powerRows([row({ rank: 4 })], []);
    expect(only.rank).toBe(4);
    expect(only.record).toBe("2-0-1");
    expect(only.scored).toBe(123.5);
  });

  it("says what the round did to them, from either side of it", () => {
    const rows = powerRows(
      [row({ teamId: "a", teamName: "a" }), row({ teamId: "b", teamName: "b" })],
      [result("a", "b", 26.4)],
    );
    expect(rows[0].round).toBe("beat b by 26.4");
    expect(rows[1].round).toBe("lost to a by 26.4");
  });

  it("says nothing about a tie that has not been decided", () => {
    expect(powerRows([row()], [])[0].round).toBeNull();
  });
});
