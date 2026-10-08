import { describe, expect, it } from "vitest";
import { fantraxDay, fantraxInstant, fantraxTime, proposedInstant } from "./when";

// Fantrax's real stamp, as `LeagueTransaction.processedAt` carries it: US Eastern, with no offset in it.
const STAMP = "Wed Sep 2, 2026, 6:11AM";

describe("fantraxInstant", () => {
  it("reads their summer clock as EDT, four hours behind UTC", () => {
    expect(fantraxInstant(STAMP)).toBe("2026-09-02T10:11:00.000Z");
  });

  it("reads their winter clock as EST, five hours behind", () => {
    expect(fantraxInstant("Tue Nov 3, 2026, 6:11AM")).toBe("2026-11-03T11:11:00.000Z");
  });

  it("changes the offset on America's dates, not Britain's", () => {
    // America's clocks go back on 1 Nov 2026, a week after Britain's (25 Oct).
    expect(fantraxInstant("Sat Oct 31, 2026, 11:59PM")).toBe("2026-11-01T03:59:00.000Z");
    expect(fantraxInstant("Sun Nov 1, 2026, 3:00AM")).toBe("2026-11-01T08:00:00.000Z");
    // And go forward on 14 Mar 2027, a fortnight before Britain's (28 Mar).
    expect(fantraxInstant("Sat Mar 13, 2027, 6:11AM")).toBe("2027-03-13T11:11:00.000Z");
    expect(fantraxInstant("Mon Mar 15, 2027, 6:11AM")).toBe("2027-03-15T10:11:00.000Z");
  });

  it("orders against our own instants: 8PM in New York is after 23:30 UTC", () => {
    expect(Date.parse(fantraxInstant("Wed Sep 2, 2026, 8:00PM") ?? "")).toBeGreaterThan(
      Date.parse("2026-09-02T23:30:00Z"),
    );
  });

  it("says noon and midnight the way a clock does", () => {
    expect(fantraxInstant("Wed Sep 2, 2026, 12:00PM")).toBe("2026-09-02T16:00:00.000Z");
    expect(fantraxInstant("Wed Sep 2, 2026, 12:30AM")).toBe("2026-09-02T04:30:00.000Z");
  });

  it("gives null for anything that does not read", () => {
    expect(fantraxInstant("2026-09-02T06:11:00Z")).toBeNull();
    expect(fantraxInstant("Wed Sep 2")).toBeNull();
    expect(fantraxInstant("Wed Set 2, 2026, 6:11AM")).toBeNull();
    expect(fantraxInstant("")).toBeNull();
  });
});

describe("fantraxTime", () => {
  it("prints their stamp in London time, with no zone named", () => {
    // THE BUG. Fantrax's 6:11AM is New York's; the paper printed it as if it were ours.
    expect(fantraxTime(STAMP)).toBe("Wed 2 Sept 11:11");
  });

  it("is four hours on in the week Britain's clocks have gone back and America's have not", () => {
    expect(fantraxTime("Tue Oct 27, 2026, 6:11AM")).toBe("Tue 27 Oct 10:11");
    expect(fantraxTime("Mon Mar 15, 2027, 6:11AM")).toBe("Mon 15 Mar 10:11");
  });

  it("is five hours on once both have changed", () => {
    expect(fantraxTime("Tue Nov 3, 2026, 6:11AM")).toBe("Tue 3 Nov 11:11");
  });

  it("puts an American evening on London's next day", () => {
    expect(fantraxTime("Wed Sep 2, 2026, 8:00PM")).toBe("Thu 3 Sept 01:00");
  });

  it("gives null for anything that does not read", () => {
    expect(fantraxTime("2026-09-02T06:11:00Z")).toBeNull();
    expect(fantraxTime("")).toBeNull();
  });
});

describe("fantraxDay", () => {
  it("is fantraxTime's day", () => {
    expect(fantraxDay(STAMP)).toBe("Wed 2 Sept");
    expect(fantraxTime(STAMP)).toBe(`${fantraxDay(STAMP)} 11:11`);
  });

  it("files a late-night claim under London's day", () => {
    expect(fantraxDay("Wed Sep 30, 2026, 11:59PM")).toBe("Thu 1 Oct");
  });

  it("gives null for anything that does not read", () => {
    expect(fantraxDay("Wed Sep 2")).toBeNull();
  });
});

describe("proposedInstant", () => {
  // The pending page prints the session's zone and no year: "Oct 8, 11:53 AM BST" (recorded 8 Oct 2026).
  const NOW = "2026-10-08T14:00:00.000Z";

  it("reads the recorded stamp in the zone it names", () => {
    expect(proposedInstant("Oct 8, 11:53 AM BST", NOW)).toBe("2026-10-08T10:53:00.000Z");
  });

  it("reads Greenwich and Eastern stamps", () => {
    expect(proposedInstant("Dec 1, 9:05 PM GMT", "2026-12-02T00:00:00.000Z")).toBe("2026-12-01T21:05:00.000Z");
    expect(proposedInstant("Oct 8, 6:53 AM EDT", NOW)).toBe("2026-10-08T10:53:00.000Z");
  });

  it("keeps the zone a stamp names in the hour the clocks go back, when one wall time comes twice", () => {
    // Britain's clocks go back at 01:00 UTC on Sun 25 Oct, America's at 06:00 UTC on Sun 1 Nov.
    const after = "2026-11-02T12:00:00.000Z";
    expect(proposedInstant("Oct 25, 1:30 AM BST", after)).toBe("2026-10-25T00:30:00.000Z");
    expect(proposedInstant("Oct 25, 1:30 AM GMT", after)).toBe("2026-10-25T01:30:00.000Z");
    expect(proposedInstant("Nov 1, 1:30 AM EDT", after)).toBe("2026-11-01T05:30:00.000Z");
    expect(proposedInstant("Nov 1, 1:30 AM EST", after)).toBe("2026-11-01T06:30:00.000Z");
  });

  it("takes a stamp past now as last year's", () => {
    expect(proposedInstant("Dec 30, 10:00 AM GMT", "2027-01-02T12:00:00.000Z")).toBe("2026-12-30T10:00:00.000Z");
  });

  it("refuses what it cannot read, and a zone it does not know", () => {
    expect(proposedInstant("yesterday", NOW)).toBeNull();
    expect(proposedInstant("Oct 8, 11:53 AM CEST", NOW)).toBeNull();
  });
});
