import { describe, expect, it } from "vitest";
import { SPURS, VILLA, codeOf, fixture, spursVilla } from "./__fixtures__/spursVilla";
import { buildReportsBrief } from "./brief";
import { deskDay } from "./desk";
import type { ReportDayInput } from "./types";

const places = new Map([[6, 18], [7, 9]]);
const input = (over: Partial<ReportDayInput> = {}): ReportDayInput => ({
  day: "2026-09-19",
  gameweek: 5,
  matches: [spursVilla({ holders: new Map([[codeOf("Porro"), { team: "Dave's Dons", fielded: true }]]), points: new Map([[codeOf("Porro"), 2]]) })],
  season: [fixture],
  clubs: [SPURS, VILLA],
  standing: { attack: places, defence: places },
  ...over,
});
const brief = buildReportsBrief("2026-09-19", 5, deskDay(input()));

describe("buildReportsBrief on Tottenham 2-3 Aston Villa", () => {
  it("never names a source, a percentage or an analyst's term", () => {
    for (const label of [/%/, /\bFPL\b/, /Fantrax/, /Opta/, /\bxG\b/, /\bxA\b/, /expected/i, /big chance/i, /possession/i, /\bbps\b/i, /\bbonus\b/i, /projected/i, /predicted/i, /\brating\b/i, /\bstrength\b/i, /\brank\b/i, /\bmodel\b/i]) {
      expect(brief).not.toMatch(label);
    }
  });

  it("gives every man his club, including the two the writer would place at their old clubs", () => {
    expect(brief).toContain("Jan Paul van Hecke (Tottenham Hotspur)");
    expect(brief).toContain("Andy Robertson (Tottenham Hotspur)");
  });

  it("carries the worked-out facts and the minute phrases", () => {
    expect(brief).toContain("Aston Villa were 3-0 up with 11 minutes left");
    expect(brief).toContain("four minutes into first-half added time");
  });

  it("says who holds a man and what he scored them", () => {
    expect(brief).toMatch(/Pedro Porro \(Tottenham Hotspur\): .*held by Dave's Dons, in their eleven; 2 points for Dave's Dons/);
  });

  it("never pairs an injured man with the man who came on", () => {
    expect(brief).toContain("INJURY: Pedro Porro (Tottenham Hotspur) went off injured.");
    expect(brief).not.toMatch(/Gray[^\n]*(for|replac|in place of)[^\n]*Porro/);
  });

  it("says what VAR decided", () => {
    expect(brief).toContain("GOAL RULED OUT after a video review: Mohammed Kudus (Tottenham Hotspur) had scored");
  });
});
