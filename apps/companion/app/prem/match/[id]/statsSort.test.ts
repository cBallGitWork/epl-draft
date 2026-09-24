import { describe, expect, it } from "vitest";
import type { PlayerMatchStats } from "@epl/core";
import { isStatSort, sorted, type StatLine } from "./statColumns";
import { statsHref, statsView, viewHref } from "./statsSort";

const man = (name: string, points: number | null): StatLine & { name: string } => ({
  name,
  line: undefined,
  stats: points === null ? undefined : ({ fplPoints: points, minutes: 90 } as PlayerMatchStats),
  logged: undefined,
});

describe("the Stats tab's foot row", () => {
  it("opens on the match board, and reads only the clubs and the Fantasy Report as anything else", () => {
    expect(statsView(undefined)).toBe("match");
    expect(statsView("home")).toBe("home");
    expect(statsView("away")).toBe("away");
    expect(statsView("fantasy")).toBe("fantasy");
    expect(statsView("HOME")).toBe("match");
  });

  it("gives the match board the bare tab URL and every other view its own", () => {
    expect(viewHref(41, "match")).toBe("/prem/match/41/stats");
    expect(viewHref(41, "away")).toBe("/prem/match/41/stats?view=away");
    expect(viewHref(41, "fantasy")).toBe("/prem/match/41/stats?view=fantasy");
  });
});

describe("a club board's column heads", () => {
  it("keep the club they sort, open descending, and flip on a second tap", () => {
    expect(statsHref(41, "home", "G", "Pts", true)).toBe("/prem/match/41/stats?view=home&sort=G");
    expect(statsHref(41, "home", "Pts", "Pts", true)).toBe("/prem/match/41/stats?view=home&sort=Pts&dir=asc");
    expect(statsHref(41, "away", "xG", "Pts", false)).toBe("/prem/match/41/stats?view=away&sort=xG");
  });

  it("spell the default — points, high first — as the bare board", () => {
    expect(statsHref(41, "away", "Pts", "G", true)).toBe("/prem/match/41/stats?view=away");
  });

  it("refuse a column the board does not have", () => {
    expect(isStatSort("Pts")).toBe(true);
    expect(isStatSort("FPts")).toBe(false);
    expect(isStatSort(undefined)).toBe(false);
  });
});

describe("sorted", () => {
  const rows = [man("sat", null), man("a", 2), man("b", 6), man("c", 2)];

  it("keeps the team sheet's order between men level on the column", () => {
    expect(sorted(rows, "Pts", true).map((row) => row.name)).toEqual(["b", "a", "c", "sat"]);
  });

  it("sinks a man with no figure in both directions", () => {
    expect(sorted(rows, "Pts", false).map((row) => row.name)).toEqual(["a", "c", "b", "sat"]);
  });
});
