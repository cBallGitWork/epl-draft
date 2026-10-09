import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { FormGame, StandingsRow } from "@epl/core";
import { repeatedKeys } from "../repeatedKeys";
import TableRow from "./TableRow";

// The app's `@/` alias is Next's, not vitest's: each is the real module by its relative path, or a stand-in.
vi.mock("@/app/desk", () => import("../desk"));
vi.mock("@/app/components/shell/Absent", () => import("../components/shell/Absent"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/components/league/TeamName", () => ({ default: () => null }));
vi.mock("@/app/squad/routes", () => import("../squad/routes"));

const row = { teamId: "t1", teamName: "test1", rank: 1, won: 2, drawn: 0, lost: 0, played: 2, points: 6, pointsFor: 90, pointsAgainst: 70 } as StandingsRow;
const game = (period: number, result: FormGame["result"]): FormGame => ({ period, result, pointsFor: 40, pointsAgainst: 30 });

describe("a league table row", () => {
  it("keys both results of a double header apart in its form", () => {
    // The real league's gameweek 34 pairs every team twice in period 34 (PLATFORM_NOTES, 2 Oct 2026).
    const form = [game(33, "W"), game(34, "W"), game(34, "L")];
    const tableRow = TableRow({ row, place: "1st", mine: false, form, sort: "rank", calendar: [] });
    expect(repeatedKeys(tableRow)).toEqual([]);
  });
});
