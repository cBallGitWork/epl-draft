import { describe, expect, it } from "vitest";
import { emptyBreakdownNote } from "./breakdownNote";

describe("emptyBreakdownNote", () => {
  it("says a man who never got on did not play once his match is over", () => {
    expect(emptyBreakdownNote(0, 0, true)).toBe("Did not play.");
  });

  it("drops 'yet' for a man who played and scored nothing in a finished match", () => {
    expect(emptyBreakdownNote(0, 90, true)).toBe("Nothing scored for him.");
  });

  it("keeps the live wording while his match is on", () => {
    expect(emptyBreakdownNote(0, 0, false)).toBe(
      "Nothing has scored for him yet — his minutes have not registered either.",
    );
    expect(emptyBreakdownNote(0, 30, false)).toBe("Nothing has scored for him yet.");
  });

  it("says a total with no parts is unexplained, whatever the clock", () => {
    expect(emptyBreakdownNote(3, 90, true)).toBe("Fantrax scored him, but did not say what for.");
    expect(emptyBreakdownNote(3, 90, false)).toBe("Fantrax scored him, but did not say what for.");
  });
});
