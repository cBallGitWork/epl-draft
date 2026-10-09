import { describe, expect, it, vi } from "vitest";
import type { Assignment } from "@epl/core";
import { deskContext } from "./context";

const refused = () => Promise.reject(new Error("Fantrax refused"));
vi.mock("./binXi", () => ({ binXiDesk: () => refused() }));
vi.mock("./reports", () => ({ reportsDesk: () => refused() }));
vi.mock("./predictions", () => ({ predictionsDesk: async () => ({ lawro: true }) }));
vi.mock("./season", () => ({ seasonDesk: async () => null }));
vi.mock("./sheets", () => ({ sheetsDesk: async () => null }));
vi.mock("./drafts", () => ({ draftsDesk: async () => new Map() }));

const assignments: Assignment[] = [
  { kind: "bin-xi", key: "bin", slug: "bin" },
  { kind: "match-report", key: "report", slug: "report", day: "2026-10-10" },
  { kind: "predictions", key: "lawro", slug: "lawro" },
];

function input(said: string[]) {
  return {
    snapshot: { gameweek: 6, players: [], fixtures: [] },
    facts: { table: [], business: [], pedigree: new Map(), teams: [] },
    clubs: new Map(),
    byCode: new Map(),
    info: { scoringPeriods: [], teams: [] },
    period: 6,
    gameweeks: [6],
    ledger: {},
    sheet: { lines: [], quotes: [], ties: new Map(), gameweek: 6, spoke: [] },
    xi: null,
    season: [],
    kickoffs: [],
    assignments,
    now: "2026-10-10T12:00:00.000Z",
    say: (line: string) => said.push(line),
  } as unknown as Parameters<typeof deskContext>[0];
}

describe("a firing's desks", () => {
  it("one desk's failed read empties only that desk and is named", async () => {
    const said: string[] = [];
    const { ctx, lost } = await deskContext(input(said));
    expect(ctx.bin).toBeNull();
    expect(ctx.reports.size).toBe(0);
    expect(ctx.predictions).toEqual({ lawro: true });
    expect(lost).toEqual(["match-report", "bin-xi"]);
    expect(said.filter((line) => line.includes("Fantrax refused"))).toHaveLength(2);
  });
});
