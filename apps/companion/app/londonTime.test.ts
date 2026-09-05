import { describe, expect, it } from "vitest";
import { londonDate, londonDay, londonDayAndTime, londonDayKey, londonTime } from "./londonTime";

// The first test under `apps/`, written the day the vitest glob widened to
// reach it. `londonTime.ts` was chosen because it is pure, it is read by nine
// screens, and its four formatters disagreed with each other about a bad date.

// A real kickoff: 14:00Z in October is 15:00 in London, which is the whole
// reason this module exists rather than a call to `toLocaleString`.
const KICKOFF = "2026-10-10T14:00:00Z";

// July, when Britain is an hour ahead of UTC — the case a fixed offset gets
// wrong and a timezone gets right.
const SUMMER = "2026-07-04T14:00:00Z";

describe("London time", () => {
  it("shows a kickoff in British time, not the reader's", () => {
    expect(londonTime(KICKOFF)).toBe("15:00");
    expect(londonDayAndTime(KICKOFF)).toBe("Sat 15:00");
    expect(londonDay(KICKOFF)).toBe("Sat");
    expect(londonDate(KICKOFF)).toBe("Saturday 10 October");
  });

  it("follows British Summer Time rather than a fixed offset", () => {
    expect(londonTime(SUMMER)).toBe("15:00");
  });

  it("hands back an unreadable date rather than throwing", () => {
    // Every one of these takes an ISO string from a provider we do not control.
    // `Intl.format` throws on an invalid date, and these are called during
    // render — so a malformed string is a page that fails to render over a date
    // it only mentions in passing. `londonDate` guarded this and its three
    // siblings did not, which is the asymmetry this test exists to hold.
    for (const bad of ["", "not a date", "2026-13-45T99:99:99Z"]) {
      expect(londonDate(bad)).toBe(bad);
      expect(londonTime(bad)).toBe(bad);
      expect(londonDayAndTime(bad)).toBe(bad);
      expect(londonDay(bad)).toBe(bad);
      expect(londonDayKey(bad)).toBe(bad);
    }
  });

  // The Live tab shows the day being played rather than the whole round, and
  // "is this match today" is a question about the LEAGUE's calendar day, not
  // about UTC's. These are the two instants where the two disagree.
  it("puts an instant on the London day it is played on", () => {
    expect(londonDayKey(KICKOFF)).toBe("2026-10-10");

    // 23:30 UTC on a July Saturday is 00:30 on Sunday in London. A UTC-based
    // comparison files this under Saturday, and a reader watching it at half
    // past midnight is told there is no football on.
    expect(londonDayKey("2026-07-04T23:30:00Z")).toBe("2026-07-05");

    // And the other way: 00:30 UTC in January is still the small hours of the
    // same day in London, because Britain is on UTC in winter.
    expect(londonDayKey("2027-01-05T00:30:00Z")).toBe("2027-01-05");
  });
});
