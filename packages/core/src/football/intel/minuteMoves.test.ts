import { describe, expect, it } from "vitest";
import type { IntelProjections } from "./projections";
import { minuteMovesIntel, minutesUpdate } from "./minuteMoves";

const week = (gw: number, minutes: number | null) => ({ gw, points: 5, low: null, high: null, minutes, start: 0.9, fixtures: 1, parts: null });

function file(exportedAt: string, gameweek: number, minutes: Record<number, [number, number]>): IntelProjections {
  return {
    manifest: { season: "26-27", gameweek, exportedAt, rows: 0, sources: [] },
    players: Object.entries(minutes).map(([code, [first, second]]) => ({
      code: Number(code),
      club: "ARS",
      role: "W",
      gameweeks: [week(6, first), week(7, second)],
    })),
  };
}

// Friday's export (coming gameweek 6) and Tuesday's after it (coming gameweek 7): the update reads the NEW export's week.
const FRIDAY = file("2026-10-09T16:45:00.123456+00:00", 6, { 1: [85, 85], 2: [45, 45], 3: [80, 80] });
const TUESDAY = file("2026-10-13T07:10:00+00:00", 7, { 1: [85, 30], 2: [45, 56], 3: [80, 69.6] });

describe("minutesUpdate", () => {
  it("records each man moved by more than the bar for the new export's coming gameweek, biggest first", () => {
    expect(minutesUpdate(FRIDAY, TUESDAY, 10)).toEqual({
      at: "2026-10-13T07:10:00.000Z",
      since: "2026-10-09T16:45:00.123Z",
      gameweek: 7,
      moves: [
        { code: 1, before: 85, after: 30 },
        { code: 2, before: 45, after: 56 },
      ],
    });
  });

  // 80 → 69.6 reads 80 → 70, a move of ten, which the bar ("more than ten") keeps out; 10.4 would have let it in.
  it("measures whole minutes against the bar", () => {
    const codes = minutesUpdate(FRIDAY, TUESDAY, 10)?.moves.map((move) => move.code);
    expect(codes).not.toContain(3);
  });

  it("records nothing for the same export, or one that moved nobody", () => {
    expect(minutesUpdate(TUESDAY, TUESDAY, 10)).toBeNull();
    expect(minutesUpdate(FRIDAY, file("2026-10-09T17:50:00Z", 6, { 1: [85, 85] }), 10)).toBeNull();
  });
});

describe("minuteMovesIntel", () => {
  it("drops an update with no stamps", () => {
    const update = { at: "2026-10-13T07:10:00.000Z", since: "2026-10-09T16:45:00.000Z", gameweek: 7, moves: [] };
    const broken = { ...update, at: undefined } as unknown as typeof update;
    const manifest = { season: "26-27", gameweek: 7, exportedAt: update.at, rows: 1, sources: [] };
    expect(minuteMovesIntel({ manifest, updates: [update, broken] })).toEqual([update]);
    expect(minuteMovesIntel(null)).toEqual([]);
  });
});
