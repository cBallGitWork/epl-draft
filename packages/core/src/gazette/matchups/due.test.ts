import { describe, expect, it } from "vitest";
import type { Fixture } from "../../football/types";
import { draftReportsDue } from "./due";

const fixture = (kickoff: string, settled: boolean): Fixture => ({
  id: 1, code: 1, gameweek: 5, homeClubId: 1, awayClubId: 2, kickoff, homeScore: null, awayScore: null, status: "finished", settled, minutes: 90, homeDifficulty: null, awayDifficulty: null,
});

describe("draftReportsDue", () => {
  it("files Saturday's once Saturday is settled with Sunday to come, and the round's once all of it is", () => {
    const fri = fixture("2026-09-18T19:00:00Z", true);
    const sat = [fixture("2026-09-19T11:30:00Z", true), fixture("2026-09-19T16:30:00Z", true)];
    const sun = fixture("2026-09-20T15:30:00Z", false);
    expect(draftReportsDue([fri, ...sat, sun], 5).map((d) => d.key)).toEqual(["draft-report:gw5:saturday"]);
    expect(draftReportsDue([fri, ...sat, { ...sun, settled: true }], 5).map((d) => `${d.slug} ${d.day}`)).toEqual(["gw5-draft-report-saturday 2026-09-19", "gw5-draft-report 2026-09-20"]);
  });

  it("waits while a Saturday match is unsettled, and files no Saturday report when Saturday ends the round", () => {
    expect(draftReportsDue([fixture("2026-09-19T11:30:00Z", false), fixture("2026-09-20T15:30:00Z", false)], 5)).toEqual([]);
    expect(draftReportsDue([fixture("2026-09-19T11:30:00Z", true)], 5).map((d) => d.cutoff)).toEqual(["gameweek"]);
  });
});
