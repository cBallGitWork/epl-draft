import { createElement, Fragment, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Club, Fixture } from "@epl/core";
import Run from "./Run";

// The app's `@/` alias is Next's, not vitest's: each is the real module by its relative path, or a stand-in.
vi.mock("@/app/desk", () => import("../../../desk"));
vi.mock("@/app/components/shell/Absent", () => import("../../../components/shell/Absent"));
vi.mock("@/app/components/shell/Link", () => ({ default: (props: object) => createElement("a", props) }));
vi.mock("@/app/components/football/ClubLabel", () => ({ default: () => null }));
vi.mock("../../../components/league/ScrollBoard", () => ({
  default: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
}));

const arsenal: Club = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" };
const villa: Club = { id: 2, code: 7, name: "Aston Villa", shortName: "AVL" };

const fixture = (over: Partial<Fixture>): Fixture => ({
  id: 9, code: 9, gameweek: 7, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-10T14:00:00Z",
  homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
  homeDifficulty: null, awayDifficulty: null, ...over,
});

/** The score cell's text, the row's last. */
function score(over: Partial<Fixture>): string {
  const html = renderToStaticMarkup(
    createElement(Run, {
      entries: [{ kind: "league", fixture: fixture(over) }],
      club: arsenal,
      clubs: new Map([[1, arsenal], [2, villa]]),
      byCode: new Map(),
    }),
  );
  const cells = [...html.matchAll(/<td[^>]*>(.*?)<\/td>/g)];
  return (cells[cells.length - 1]?.[1] ?? "").replace(/<[^>]+>/g, "");
}

describe("a club's run of fixtures", () => {
  it("prints a live score with its own goals first", () => {
    expect(score({ status: "live", homeScore: 2, awayScore: 1 })).toBe("2–1");
  });

  it("prints a dash, not a bare rule, for a live match FPL has no score for yet", () => {
    expect(score({ status: "live" })).toBe("—");
  });

  it("prints a dash for a match not yet played", () => {
    expect(score({})).toBe("—");
  });
});
