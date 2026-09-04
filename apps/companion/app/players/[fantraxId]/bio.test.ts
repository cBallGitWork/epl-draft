import { describe, expect, it } from "vitest";
import { bornLine } from "./bio";

// `now` is injected, so these are dates and not a clock.
const today = new Date(2026, 8, 4); // 4 Sep 2026, local — the day this was written.

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

describe("bornLine, with where he is from", () => {
  it("puts the country after the birth date, as CM puts the nationality", () => {
    // `cm9900/11.jpg`: `Born 2.10.79 (Age 19). English.` — one line, both facts.
    expect(bornLine("1994-09-08", today, "Maia, Portugal")).toBe(
      "Born 8.9.94 (Age 31). Portugal.",
    );
  });

  it("takes the country off the end and drops the town", () => {
    expect(bornLine("1994-09-08", today, "Santo Tirso, Portugal")).toContain("Portugal.");
    expect(bornLine("1994-09-08", today, "Santo Tirso, Portugal")).not.toContain("Santo Tirso");
  });

  it("reads a bare country as the country", () => {
    expect(bornLine("1994-09-08", today, "Brazil")).toBe("Born 8.9.94 (Age 31). Brazil.");
  });

  it("says only what it has", () => {
    // Fantrax pads the personal block with empty rows, so both halves go missing
    // independently and neither absence may invent the other.
    expect(bornLine("1994-09-08", today, "")).toBe("Born 8.9.94 (Age 31).");
    expect(bornLine("1994-09-08", today, "   ")).toBe("Born 8.9.94 (Age 31).");
    expect(bornLine(null, today, "Maia, Portugal")).toBe("Portugal.");
    expect(bornLine(null, today, null)).toBeNull();
  });
});
