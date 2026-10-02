import { describe, expect, it } from "vitest";
import type { ClubStats, SeasonTotals, TableRow } from "@epl/core";
import { categoryFor, printed, type Club } from "./categories";

// Arsenal after GW5, 1 Oct 2026: every man's FPL xGC added up is 44.39, because each counts the side's chances against.
const squad = { expectedGoals: 8.51, expectedGoalsConceded: 44.39, expectedAssists: 6.2 } as SeasonTotals;
const arsenal: Club = {
  table: { goalsFor: 9, goalsAgainst: 3, goalDifference: 6 } as TableRow,
  stats: { squad } as ClubStats,
};

const board = (key: string) => {
  const category = categoryFor(key);
  return printed(category, category.of(arsenal));
};

describe("the club board's figures", () => {
  it("reads a side's expected goals conceded once, not once per man on the pitch", () => {
    expect(categoryFor("xgc").of(arsenal)).toBeCloseTo(4.035, 3);
  });

  it("prints it as 4.04", () => {
    expect(board("xgc")).toBe("4.04");
  });

  it("prints the expected figures to two places, as FPL publishes them", () => {
    expect(board("xg")).toBe("8.51");
    expect(board("xa")).toBe("6.20");
  });

  it("prints a count whole", () => {
    expect(board("for")).toBe("9");
  });
});
