import { describe, expect, it, vi } from "vitest";
import type { fetchDraftResults } from "@epl/core";
import { playerPedigree } from "./draft";

let board: Awaited<ReturnType<typeof fetchDraftResults>> = { draftState: "running", draftPicks: [] };

vi.mock("@epl/core", async (actual) => ({
  ...(await actual<typeof import("@epl/core")>()),
  fetchDraftResults: async () => board,
}));
vi.mock("../pool", () => ({ getLeaguePool: async () => ({ rows: [], teamNames: new Map() }) }));

// A read given a lifetime keeps its first answer for this whole test; one on the page window is
// asked afresh each time, as it would be thirty seconds later.
vi.mock("../../leagueCache", () => ({
  leagueCache: <R,>(_key: string, read: () => Promise<R>, ...rest: unknown[]) => {
    if (!rest.some((arg) => typeof arg === "number")) return read;
    let held: Promise<R> | null = null;
    return () => (held ??= read());
  },
}));

describe("playerPedigree", () => {
  it("does not hold a draft still running for a day", async () => {
    expect((await playerPedigree("p1")).pedigree.origin).toBe("unknown");

    board = { draftState: "completed", draftPicks: [{ playerId: "p1", teamId: "t1", round: 1, pick: 1 }] };
    expect((await playerPedigree("p1")).pedigree).toMatchObject({ origin: "draft", overall: 1 });
  });
});
