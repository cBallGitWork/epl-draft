import { describe, expect, it } from "vitest";
import { bornLine } from "./bio";

// `now` is injected, so these are dates and not a clock.
const today = new Date("2026-09-04T11:00:00Z"); // Noon in London on 4 Sep 2026, the day this was written.

describe("bornLine", () => {
  it("writes Championship Manager's own line", () => {
    expect(bornLine("1993-03-05", today)).toBe("Born 5.3.93 (Age 33).");
  });

  it("does not pad the day or the month, as CM does not", () => {
    // `cm9900/11.jpg` reads `Born 2.10.79 (Age 19).` — two, not oh-two.
    expect(bornLine("1979-10-02", today)).toContain("Born 2.10.79");
  });

  it("pads a two-digit year that needs it", () => {
    expect(bornLine("2005-01-09", today)).toBe("Born 9.1.05 (Age 21).");
  });

  it("counts the birthday as the day he turns", () => {
    expect(bornLine("2000-09-04", today)).toBe("Born 4.9.00 (Age 26).");
    expect(bornLine("2000-09-05", today)).toBe("Born 5.9.00 (Age 25).");
  });

  it("turns him a year older at midnight in London, whatever the server's own zone", () => {
    // 23:30 UTC on 3 Sep is 00:30 BST on the 4th, his birthday; Vercel's clock reads UTC.
    expect(bornLine("2000-09-04", new Date("2026-09-03T23:30:00Z"))).toBe("Born 4.9.00 (Age 26).");
    expect(bornLine("2000-09-04", new Date("2026-09-03T22:30:00Z"))).toBe("Born 4.9.00 (Age 25).");
  });

  it("does not shift the date for a reader west of Greenwich", () => {
    // A bare ISO date read by `new Date` is midnight UTC, which is the previous
    // day in New York. A birthday is a calendar fact and has no timezone.
    expect(bornLine("1995-09-01", today)).toContain("Born 1.9.95");
  });

  it("says nothing when FPL has not filled the date in", () => {
    // 19 of 652 on 4 Sep 2026. The caller draws the view's name instead.
    expect(bornLine(null, today)).toBeNull();
    expect(bornLine("", today)).toBeNull();
  });

  it("refuses a shape it does not recognise rather than guessing", () => {
    expect(bornLine("05/03/1993", today)).toBeNull();
    expect(bornLine("1993-03", today)).toBeNull();
    expect(bornLine("1993-13-05", today)).toBeNull();
  });

  it("drops the age rather than printing a negative one", () => {
    // A confident wrong number in its purest form.
    expect(bornLine("2030-01-01", today)).toBe("Born 1.1.30.");
  });
});

describe("bornLine, with his country", () => {
  it("puts the country after the birth date, as CM puts the nationality", () => {
    // `cm9900/11.jpg`: `Born 2.10.79 (Age 19). English.` — one line, both facts.
    expect(bornLine("2000-07-21", today, "Norway")).toBe("Born 21.7.00 (Age 26). Norway.");
  });

  it("says only what it has", () => {
    expect(bornLine("1994-09-08", today, "")).toBe("Born 8.9.94 (Age 31).");
    expect(bornLine("1994-09-08", today, "   ")).toBe("Born 8.9.94 (Age 31).");
    expect(bornLine(null, today, "Portugal")).toBe("Portugal.");
    expect(bornLine(null, today, null)).toBeNull();
  });
});
