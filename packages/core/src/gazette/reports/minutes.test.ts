import { describe, expect, it } from "vitest";
import { ordinal } from "../../league/ordinal";
import { clock, minutePhrases, minutesLeft, numeral } from "./minutes";

describe("numeral and ordinal", () => {
  it("writes one to nine in words and 10 up in figures", () => {
    expect([numeral(1), numeral(9), numeral(10), numeral(23)]).toEqual(["one", "nine", "10", "23"]);
  });

  it("gets the teens right", () => {
    expect([ordinal(1), ordinal(2), ordinal(3), ordinal(11), ordinal(12), ordinal(13), ordinal(21), ordinal(67)]).toEqual([
      "1st", "2nd", "3rd", "11th", "12th", "13th", "21st", "67th",
    ]);
  });
});

describe("minutePhrases", () => {
  it("counts first-half added time from the label, never from 49", () => {
    expect(minutePhrases("45+4")).toContain("four minutes into first-half added time");
    expect(minutePhrases("45+4").join(" ")).not.toContain("49");
  });

  it("counts second-half added time without the half", () => {
    expect(minutePhrases("90+8")[0]).toBe("eight minutes into added time");
    expect(minutePhrases("90+1")[0]).toBe("one minute into added time");
  });

  it("offers minutes from time late on, in the house's numerals", () => {
    expect(minutePhrases("79")).toEqual(expect.arrayContaining(["11 minutes from time", "with 11 minutes left", "in the 79th minute"]));
    expect(minutePhrases("86")).toContain("four minutes from time");
  });

  it("calls a change at 46 a half-time change, and a goal at 46 early in the half", () => {
    expect(minutePhrases("46", true)[0]).toBe("at half-time");
    expect(minutePhrases("46")).toContain("just after half-time");
  });

  it("offers the plain forms early on", () => {
    expect(minutePhrases("19")).toEqual(["in the 19th minute", "after 19 minutes"]);
  });

  it("has nothing for a label with no clock", () => {
    expect(minutePhrases("")).toEqual([]);
    expect(clock("x")).toBeNull();
  });
});

describe("minutesLeft", () => {
  it("is 90 less the minute in the second half, and null otherwise", () => {
    expect([minutesLeft("79"), minutesLeft("30"), minutesLeft("90+3")]).toEqual([11, null, null]);
  });
});
