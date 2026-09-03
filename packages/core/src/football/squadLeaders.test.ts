import { describe, expect, it } from "vitest";
import { squadLeader } from "./squadLeaders";
import type { FootballPlayer, SeasonTotals } from "./types";

const NOTHING: SeasonTotals = {
  goals: 0, assists: 0, cleanSheets: 0, minutes: 0, starts: 0,
  expectedGoals: 0, expectedAssists: 0, expectedGoalsConceded: 0,
  tackles: 0, clearancesBlocksInterceptions: 0, recoveries: 0,
  saves: 0, goalsConceded: 0, bonus: 0, bps: 0,
};

function player(name: string, season: Partial<SeasonTotals>): FootballPlayer {
  return {
    id: name.length, code: name.length, name, fullName: name, clubId: 1,
    status: "a", news: "", chanceOfPlaying: null, optaCode: null,
    season: { ...NOTHING, ...season },
  };
}

describe("squadLeader", () => {
  it("names the man with the most of it", () => {
    const squad = [player("Rice", { goals: 1 }), player("Saka", { goals: 4 })];
    expect(squadLeader(squad, "goals")?.player.name).toBe("Saka");
    expect(squadLeader(squad, "goals")?.value).toBe(4);
  });

  it("names nobody when nobody has any", () => {
    // The whole point: before a ball is kicked every man has nought goals, and
    // one of them must not be introduced as the top scorer.
    expect(squadLeader([player("Rice", {}), player("Saka", {})], "goals")).toBeNull();
  });

  it("names nobody in an empty squad", () => {
    expect(squadLeader([], "goals")).toBeNull();
  });

  it("breaks a tie on the fewer minutes", () => {
    const squad = [
      player("Rice", { goals: 2, minutes: 900 }),
      player("Saka", { goals: 2, minutes: 300 }),
    ];
    expect(squadLeader(squad, "goals")?.player.name).toBe("Saka");
  });

  it("breaks a tie on the name when the minutes are equal, so it is stable", () => {
    const squad = [
      player("Saka", { goals: 2, minutes: 300 }),
      player("Rice", { goals: 2, minutes: 300 }),
    ];
    expect(squadLeader(squad, "goals")?.player.name).toBe("Rice");
    expect(squadLeader([...squad].reverse(), "goals")?.player.name).toBe("Rice");
  });

  it("reads any counted measure, not just goals", () => {
    const squad = [player("Raya", { saves: 12 }), player("Rice", { recoveries: 40 })];
    expect(squadLeader(squad, "saves")?.player.name).toBe("Raya");
    expect(squadLeader(squad, "recoveries")?.player.name).toBe("Rice");
  });

  it("ignores a negative, which a count should never be", () => {
    expect(squadLeader([player("Rice", { bps: -3 })], "bps")).toBeNull();
  });
});
