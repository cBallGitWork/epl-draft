import { describe, expect, it } from "vitest";
import type { Fixture } from "../../football/types";
import { reportDays } from "./due";

const game = (id: number, kickoff: string | null, settled = true, gameweek = 5): Fixture => ({
  id, code: id, gameweek, homeClubId: 1, awayClubId: 2, kickoff, homeScore: 1, awayScore: 0,
  status: settled ? "finished" : "live", settled, minutes: 90, homeDifficulty: null, awayDifficulty: null,
});

describe("reportDays", () => {
  it("files one report per London day once every match that day has settled", () => {
    const days = reportDays([game(1, "2026-09-18T19:00:00Z"), game(2, "2026-09-19T11:30:00Z"), game(3, "2026-09-19T14:00:00Z")], 5);
    expect(days).toEqual([
      { key: "match-report:gw5:2026-09-18", slug: "gw5-prem-report-2026-09-18", day: "2026-09-18" },
      { key: "match-report:gw5:2026-09-19", slug: "gw5-prem-report-2026-09-19", day: "2026-09-19" },
    ]);
  });

  it("waits while one match that day is still unsettled", () => {
    expect(reportDays([game(2, "2026-09-19T11:30:00Z"), game(3, "2026-09-19T16:30:00Z", false)], 5)).toEqual([]);
  });

  it("reads the day in London: a 23:30 UTC kick-off in summer is the next day's", () => {
    expect(reportDays([game(1, "2026-09-19T23:30:00Z")], 5)[0].day).toBe("2026-09-20");
  });

  it("leaves out an undated match and another gameweek's", () => {
    expect(reportDays([game(1, null), game(2, "2026-09-19T11:30:00Z", true, 6)], 5)).toEqual([]);
  });
});
