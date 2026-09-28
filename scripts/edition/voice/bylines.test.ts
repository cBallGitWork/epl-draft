import { describe, expect, it } from "vitest";
import { editionName } from "./bylines";

describe("editionName", () => {
  it("files every match-day report as the Prem Report, whatever the day", () => {
    for (const day of ["2026-09-18T21:00:00Z", "2026-09-19T20:00:00Z", "2026-09-20T19:00:00Z", "2026-09-22T21:30:00Z"]) {
      expect(editionName("match-report", day)).toBe("Prem Report");
    }
  });
});
