import { describe, expect, it } from "vitest";
import palace from "../__fixtures__/plTeamStats.json";
import { plClubSeason } from "./clubSeason";
import type { RawPlTeamStats } from "./rawStats";

// Crystal Palace after five matches of 26/27, recorded 30 Sep 2026 off `/stats/team/6`.
const PALACE: RawPlTeamStats = palace;

describe("plClubSeason", () => {
  it("joins to FPL's club code through Opta's team id", () => {
    expect(plClubSeason(PALACE)?.clubCode).toBe(31);
  });

  it("reads each figure off its Opta metric, summing the pairs", () => {
    expect(plClubSeason(PALACE)).toMatchObject({
      goals: 6,
      shots: 53,
      bigChances: 16,
      shotsConceded: 84,
      errorsLeadingToGoal: 2,
      redCards: 1,
      cleanSheets: 1,
    });
  });

  it("reads a metric the payload omits as nought, which is how Opta says it", () => {
    const quiet = { ...PALACE, stats: PALACE.stats.filter((metric) => metric.name !== "total_red_card") };
    expect(plClubSeason(quiet)?.redCards).toBe(0);
  });

  it("is an absence when the read names no club or carries nothing", () => {
    expect(plClubSeason({ stats: PALACE.stats })).toBeNull();
    expect(plClubSeason({ ...PALACE, stats: [] })).toBeNull();
  });
});
