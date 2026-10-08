import { describe, expect, it, vi } from "vitest";
import { sheetsFacts } from "@epl/core";
import { side } from "../../packages/core/src/gazette/sheets/__fixtures__/sides";
import type { SheetsDesk } from "./sheets";

const voices: string[] = [];
vi.mock("./newsroom", async (actual) => ({
  ...(await actual<typeof import("./newsroom")>()),
  writeColumn: async (voice: string) => {
    voices.push(voice);
    return {};
  },
}));
const { writeSheets } = await import("./sheetsWriter");

const XI = ["Raya:G:1", "Saliba:D:1", "Gabriel:D:1", "Munoz:D:2", "Rice:M:1", "Saka:M:1", "Palmer:M:3", "Mbeumo:M:4", "Isak:F:5", "Wood:F:6", "Watkins:F:7"];

describe("writeSheets", () => {
  it("tells the writer the league's sides when a side that fielded nobody leaves its tie off the page", async () => {
    const ties = sheetsFacts({
      pairings: [{ home: { teamId: "h" }, away: { teamId: "w" } }, { home: { teamId: "x" }, away: { teamId: "y" } }],
      sheets: new Map([["h", side("h", XI)], ["w", side("w", XI)], ["x", side("x", [])], ["y", side("y", XI)]]),
      history: new Map(), fixtures: [], lastWrote: new Map(), playing: new Set<number>(), news: () => null, recent: () => [], predicted: () => null,
    });
    const desk: SheetsDesk = { gameweek: 6, ties, brief: "", clubs: [], against: () => null, sides: 4 };
    await writeSheets(desk, "", () => {});
    expect(ties).toHaveLength(1);
    expect(voices[0]?.match(/\w+ paragraphs appear on one page\./u)?.[0]).toBe("Four paragraphs appear on one page.");
  });
});
