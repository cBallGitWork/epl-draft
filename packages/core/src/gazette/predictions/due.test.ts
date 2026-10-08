import { describe, expect, it } from "vitest";
import { dueFrom, filingDay, predictionsDue } from "./due";

// GW6 locks Sat 10 Oct 2026 at 12:15 London (BST), 11:15 UTC.
const GW6_LOCK = "2026-10-10T11:15:00.000Z";

describe("filingDay", () => {
  it("files on the Thursday before a lock from Friday to Monday", () => {
    expect(filingDay(GW6_LOCK)).toBe("2026-10-08");
    // A Friday-night round: GW8's opens Fri 23 Oct at 20:00.
    expect(filingDay("2026-10-23T18:45:00.000Z")).toBe("2026-10-22");
    expect(filingDay("2026-11-02T19:45:00.000Z")).toBe("2026-10-29");
  });

  it("files the evening before a lock earlier in the week", () => {
    // GW13 locks on Tuesday 1 Dec: Monday is the evening before, not last Thursday.
    expect(filingDay("2026-12-01T19:15:00.000Z")).toBe("2026-11-30");
    expect(filingDay("2026-12-03T19:15:00.000Z")).toBe("2026-12-02");
  });

  it("names nothing for a lock it cannot read", () => {
    expect(filingDay("soon")).toBeNull();
  });
});

describe("predictionsDue", () => {
  it("opens at 20:00 London on the filing day, in summer time and in winter", () => {
    expect(predictionsDue(GW6_LOCK, "2026-10-08T18:59:00.000Z")).toBe(false);
    expect(predictionsDue(GW6_LOCK, "2026-10-08T19:00:00.000Z")).toBe(true);
    // After the clocks go back, 20:00 London is 20:00 UTC.
    const november = "2026-11-07T12:15:00.000Z";
    expect(predictionsDue(november, "2026-11-05T19:59:00.000Z")).toBe(false);
    expect(predictionsDue(november, "2026-11-05T20:00:00.000Z")).toBe(true);
  });

  it("catches up after a skipped evening and closes at the lock", () => {
    expect(predictionsDue(GW6_LOCK, "2026-10-09T08:15:00.000Z")).toBe(true);
    expect(predictionsDue(GW6_LOCK, "2026-10-10T11:14:00.000Z")).toBe(true);
    expect(predictionsDue(GW6_LOCK, GW6_LOCK)).toBe(false);
    expect(predictionsDue(GW6_LOCK, "2026-10-10T13:00:00.000Z")).toBe(false);
  });

  it("is not due in a break week, when the next lock is a fortnight off", () => {
    expect(predictionsDue(GW6_LOCK, "2026-09-24T17:30:00.000Z")).toBe(false);
    expect(predictionsDue(GW6_LOCK, "2026-10-01T17:30:00.000Z")).toBe(false);
  });

  it("files a midweek round the evening before", () => {
    const tuesday = "2026-12-01T19:15:00.000Z";
    expect(predictionsDue(tuesday, "2026-11-26T18:30:00.000Z")).toBe(false);
    expect(predictionsDue(tuesday, "2026-11-30T19:59:00.000Z")).toBe(false);
    expect(predictionsDue(tuesday, "2026-11-30T20:00:00.000Z")).toBe(true);
  });

  it("refuses an instant it cannot read", () => {
    expect(predictionsDue("soon", "2026-10-08T17:00:00.000Z")).toBe(false);
    expect(predictionsDue(GW6_LOCK, "tonight")).toBe(false);
  });
});

describe("dueFrom", () => {
  it("reads the minute as well as the hour, in London", () => {
    // 16:30 London on Thursday 8 Oct is 15:30 UTC.
    expect(dueFrom("2026-10-08", { hour: 16, minute: 30 }, GW6_LOCK, "2026-10-08T15:29:00.000Z")).toBe(false);
    expect(dueFrom("2026-10-08", { hour: 16, minute: 30 }, GW6_LOCK, "2026-10-08T15:30:00.000Z")).toBe(true);
    expect(dueFrom("2026-10-08", { hour: 16 }, GW6_LOCK, "2026-10-08T15:00:00.000Z")).toBe(true);
  });
});
