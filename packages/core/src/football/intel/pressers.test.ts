import { describe, expect, it } from "vitest";
import { FIRM, pressers, type IntelPressers } from "./pressers";

const THURSDAY = "2026-09-17T13:00:00.000Z";
const LAST_WEEK = "2026-09-10T13:00:00.000Z";

function intel(rows: IntelPressers["rows"]): IntelPressers {
  return {
    manifest: { season: "26-27", gameweek: null, exportedAt: THURSDAY, rows: rows.length, sources: [] },
    rows,
  };
}

const row = (over: Partial<IntelPressers["rows"][number]> = {}) => ({
  code: 118748,
  club: 3,
  tag: "rotation_risk",
  confidence: 0.65,
  said: THURSDAY,
  manager: "Mikel Arteta",
  ...over,
});

describe("pressers", () => {
  it("keeps only men the league holds", () => {
    const held = new Set([118748]);
    const out = pressers(intel([row(), row({ code: 999 })]), held, LAST_WEEK);
    expect(out.map((r) => r.code)).toEqual([118748]);
  });

  it("drops last week's pressers", () => {
    const out = pressers(intel([row({ said: LAST_WEEK }), row({ said: THURSDAY })]), new Set([118748]), THURSDAY);
    expect(out.map((r) => r.said)).toEqual([THURSDAY]);
  });

  it("keeps a signal whose instant cannot be read", () => {
    // A signal that cannot say when it was said is still a signal; dropping it
    // would hide a real absence on the strength of a formatting fault.
    const out = pressers(intel([row({ said: "not a date" })]), new Set([118748]), THURSDAY);
    expect(out).toHaveLength(1);
  });

  it("sorts newest first", () => {
    const later = "2026-09-17T14:30:00.000Z";
    const out = pressers(intel([row(), row({ said: later })]), new Set([118748]), LAST_WEEK);
    expect(out.map((r) => r.said)).toEqual([later, THURSDAY]);
  });

  it("is empty when there is no file, rather than throwing", () => {
    // The export lands when the sister repo writes it; until then the column
    // must refuse quietly rather than break a firing.
    expect(pressers(null, new Set([118748]), THURSDAY)).toEqual([]);
  });

  it("puts the agent's soft patterns below FIRM", () => {
    // 0.60 is "look after him"; 0.65 is "not risked". The column may lead on
    // the second and not the first, so the boundary has to sit between them.
    expect(0.6).toBeLessThan(FIRM);
    expect(0.65).toBeGreaterThanOrEqual(FIRM);
  });
});
