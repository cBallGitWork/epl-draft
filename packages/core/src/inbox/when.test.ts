import { describe, expect, it } from "vitest";
import { fantraxDay, fantraxMoment, fantraxTime, whenKey } from "./when";

// Fantrax's real stamp, as `LeagueTransaction.processedAt` carries it.
const STAMP = "Wed Sep 2, 2026, 6:11AM";

describe("fantraxDay", () => {
  it("re-spells their date in British order, with no year and no clock", () => {
    // THE BUG. The transfers chip read "Wed Sep 2", American, beside Mail's "Wed 2 Sept".
    expect(fantraxDay(STAMP)).toBe("Wed 2 Sept");
    expect(fantraxDay("Wed Sep 30, 2026, 11:59PM")).toBe("Wed 30 Sept");
  });

  it("gives null for anything that does not read", () => {
    expect(fantraxDay("Wed Sep 2")).toBeNull();
    expect(fantraxDay("")).toBeNull();
  });
});

describe("fantraxTime", () => {
  // What the blue index block draws. It carries its own 12-hour conversion rather
  // than sharing `fantraxMoment`'s, which is why noon and midnight are asserted
  // twice in this file: the copy is the one nothing else exercises.
  it("re-spells their date in British order and adds the clock", () => {
    expect(fantraxTime(STAMP)).toBe("Wed 2 Sept 6:11am");
  });

  it("uses the British short month the rest of the desk uses", () => {
    expect(fantraxTime("Thu Aug 13, 2026, 9:00AM")).toBe("Thu 13 Aug 9:00am");
    expect(fantraxTime("Thu Sep 3, 2026, 9:00AM")).toBe("Thu 3 Sept 9:00am");
  });

  it("says noon and midnight the way a clock does", () => {
    expect(fantraxTime("Wed Sep 2, 2026, 12:00PM")).toBe("Wed 2 Sept 12:00pm");
    expect(fantraxTime("Wed Sep 2, 2026, 12:30AM")).toBe("Wed 2 Sept 12:30am");
  });

  // The difference from `fantraxMoment`, which is the reason both exist: the
  // block is 64px of three-extra-small type and has no room to name the zone.
  it("names no zone, where the read pane does", () => {
    expect(fantraxTime(STAMP)).not.toContain("ET");
    expect(fantraxMoment(STAMP)).toContain("ET");
  });

  it("keeps the day THEY filed it under, whatever the hour", () => {
    expect(fantraxTime("Wed Sep 2, 2026, 11:59PM")).toBe("Wed 2 Sept 11:59pm");
  });

  it("gives null for anything that does not read", () => {
    expect(fantraxTime("2026-09-02T06:11:00Z")).toBeNull();
    expect(fantraxTime("")).toBeNull();
    expect(fantraxTime("Wed Set 2, 2026, 6:11AM")).toBeNull();
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
