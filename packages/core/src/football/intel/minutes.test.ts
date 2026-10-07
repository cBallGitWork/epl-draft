import { describe, expect, it } from "vitest";
import type { IntelProjections } from "./projections";
import { minutesAhead, minutesIntel } from "./minutes";

function file(players: unknown[]): IntelProjections {
  return {
    manifest: { season: "26-27", gameweek: 6, exportedAt: "2026-10-07T17:10:26Z", rows: players.length, sources: [] },
    players: players as IntelProjections["players"],
  };
}

const week = (gw: number, minutes: number | null) => ({ gw, points: 5, low: null, high: null, minutes, start: 0.9, fixtures: 1, parts: null });

describe("minutesIntel", () => {
  it("keeps each man's minutes by gameweek, whole and in order", () => {
    const byCode = minutesIntel(file([{ code: 223094, club: "MCI", role: "ST", gameweeks: [week(7, 85.7), week(6, 85)] }]));
    expect(byCode.get(223094)).toEqual([
      { gameweek: 6, minutes: 85 },
      { gameweek: 7, minutes: 86 },
    ]);
  });

  // A blank week is nought minutes, which is a reading; a week the model did not price is no reading at all.
  it("keeps a nought and a missing figure apart", () => {
    const byCode = minutesIntel(file([{ code: 1, club: "ARS", role: "CB", gameweeks: [week(6, 0), week(7, null)] }]));
    expect(byCode.get(1)?.map((w) => w.minutes)).toEqual([0, null]);
  });

  it("is empty with no file", () => {
    expect(minutesIntel(null).size).toBe(0);
  });
});

describe("minutesAhead", () => {
  const weeks = [
    { gameweek: 6, minutes: 85 },
    { gameweek: 7, minutes: 86 },
  ];

  it("gives a fixed run from a gameweek, null where the export stops", () => {
    expect(minutesAhead(weeks, 7, 3)).toEqual([
      { gameweek: 7, minutes: 86 },
      { gameweek: 8, minutes: null },
      { gameweek: 9, minutes: null },
    ]);
  });

  it("gives a run of nulls for a man the model does not know", () => {
    expect(minutesAhead(undefined, 6, 2).map((w) => w.minutes)).toEqual([null, null]);
  });
});
