import { describe, expect, it } from "vitest";
import type { StatsRow } from "../football/intel/stats";
import type { FootballPlayer } from "../football/types";
import type { RosteredPlayer, RosteredTeam } from "./roster";
import { squadLines } from "./squadStats";

const man = (code: number): RosteredPlayer =>
  ({ slot: { fantraxId: `f${code}` }, player: { code } as FootballPlayer, stats: [] }) as unknown as RosteredPlayer;
const unresolved = { slot: { fantraxId: "fx" }, unresolved: "unbridged" } as unknown as RosteredPlayer;
const team = (teamId: string, players: RosteredPlayer[]): RosteredTeam => ({ teamId, teamName: teamId, players });

const stats = new Map<number, StatsRow>([
  [1, { shots: 10, yellowCards: 0 }],
  [2, { shots: 4, yellowCards: 2 }],
  [3, { shots: null }],
]);

describe("squadLines", () => {
  it("adds up the counts of every man a team holds", () => {
    const lines = squadLines([team("a", [man(1), man(2)])], stats, ["shots", "yellowCards"]);
    expect(lines.get("shots")).toEqual([{ teamId: "a", points: null, value: 14 }]);
    expect(lines.get("yellowCards")).toEqual([{ teamId: "a", points: null, value: 2 }]);
  });

  it("prints a team's nought when its men played and did none of it", () => {
    expect(squadLines([team("a", [man(1)])], stats, ["yellowCards"]).get("yellowCards")).toEqual([{ teamId: "a", points: null, value: 0 }]);
  });

  it("leaves a team absent when none of its men has a reading, and skips a man with none", () => {
    const lines = squadLines([team("a", [man(3), man(9), unresolved]), team("b", [man(2), man(9)])], stats, ["shots"]);
    expect(lines.get("shots")).toEqual([
      { teamId: "a", points: null, value: null },
      { teamId: "b", points: null, value: 4 },
    ]);
  });
});
