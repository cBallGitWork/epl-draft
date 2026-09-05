import { describe, expect, it } from "vitest";
import { fantraxDay, fantraxMoment, whenKey } from "./when";

// Fantrax's real stamp, as `LeagueTransaction.processedAt` carries it.
const STAMP = "Wed Sep 2, 2026, 6:11AM";

describe("fantraxDay", () => {
  it("uses the British short month the rest of the desk uses", () => {
    // Every other month agrees between the two; September does not, and it is
    // the month the league starts in.
    expect(fantraxDay("Thu Aug 13, 2026, 9:00AM")).toBe("Thu 13 Aug");
    expect(fantraxDay("Thu Sep 3, 2026, 9:00AM")).toBe("Thu 3 Sept");
  });

  it("re-spells their date in British order and invents nothing", () => {
    // "Sept", not their "Sep": the block prints the round's deadline through
    // `en-GB` directly above this, and one column cannot spell one month twice.
    expect(fantraxDay(STAMP)).toBe("Wed 2 Sept");
  });

  it("keeps the day THEY filed it under, whatever the hour", () => {
    // The point of re-spelling rather than converting: 11PM Eastern is the next
    // morning in London, and a transaction that moves a day is worse than a US
    // date order.
    expect(fantraxDay("Wed Sep 2, 2026, 11:59PM")).toBe("Wed 2 Sept");
  });

  it("gives null for anything that does not read", () => {
    expect(fantraxDay("2026-09-02T06:11:00Z")).toBeNull();
    expect(fantraxDay("")).toBeNull();
    // A translated month is unrecognised rather than guessed at.
    expect(fantraxDay("Mer Sep 2, 2026, 6:11AM")).toBe("Mer 2 Sept");
    expect(fantraxDay("Wed Set 2, 2026, 6:11AM")).toBeNull();
  });
});

describe("fantraxMoment", () => {
  it("names the zone, because we did not convert it", () => {
    expect(fantraxMoment(STAMP)).toBe("Wed 2 Sept, 6:11 AM ET");
  });

  it("says noon and midnight the way a clock does", () => {
    expect(fantraxMoment("Wed Sep 2, 2026, 12:00PM")).toBe("Wed 2 Sept, 12:00 PM ET");
    expect(fantraxMoment("Wed Sep 2, 2026, 12:30AM")).toBe("Wed 2 Sept, 12:30 AM ET");
  });
});

describe("whenKey", () => {
  it("orders the two shapes against each other", () => {
    // The bug: sorted as text, "2026-09-12T…" fell under "Wed Sep 2…" by first
    // character, so the round's deadline appeared beneath ten days of older
    // deals.
    const deal = whenKey({ fantrax: STAMP });
    const deadline = whenKey({ iso: "2026-09-12T11:45:00Z" });
    expect(deal).not.toBeNull();
    expect(deadline).not.toBeNull();
    expect(deadline!).toBeGreaterThan(deal!);
  });

  it("reads an instant in Fantrax's calendar, not ours", () => {
    // 00:30 London on 3 Sep is 19:30 Eastern on the 2nd, so it is BEFORE a stamp
    // Fantrax filed at 8PM on the 2nd. Comparing London days would invert it.
    const late = whenKey({ iso: "2026-09-02T23:30:00Z" });
    const stamp = whenKey({ fantrax: "Wed Sep 2, 2026, 8:00PM" });
    expect(late!).toBeLessThan(stamp!);
  });

  it("orders two of Fantrax's own by their clock", () => {
    expect(whenKey({ fantrax: "Wed Sep 2, 2026, 6:11AM" })!).toBeLessThan(
      whenKey({ fantrax: "Wed Sep 2, 2026, 6:12AM" })!,
    );
    expect(whenKey({ fantrax: "Wed Sep 2, 2026, 11:59PM" })!).toBeLessThan(
      whenKey({ fantrax: "Thu Sep 3, 2026, 12:01AM" })!,
    );
  });

  it("does not let a long month run into the next", () => {
    expect(whenKey({ fantrax: "Thu Dec 31, 2026, 11:00PM" })!).toBeLessThan(
      whenKey({ fantrax: "Fri Jan 1, 2027, 1:00AM" })!,
    );
  });

  it("is null for no date and for a stamp that does not read", () => {
    expect(whenKey(null)).toBeNull();
    expect(whenKey({ fantrax: "yesterday" })).toBeNull();
    expect(whenKey({ iso: "not a date" })).toBeNull();
  });
});
