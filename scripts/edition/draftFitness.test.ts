import { describe, expect, it, vi } from "vitest";
import type { DraftMan, DraftSide, Fixture, PlayerStory } from "@epl/core";

const stories: PlayerStory[] = [
  { id: "1", headline: "forced off with a groin injury", content: "", analysis: null, at: Date.parse("2026-09-26T17:00:00Z") },
  { id: "2", headline: "set for a scan", content: "", analysis: null, at: Date.parse("2026-09-27T20:00:00Z") },
];
const asked = vi.fn(async (_id: string) => stories);
vi.mock("./matchdayLeague", async (actual) => ({ ...(await actual<typeof import("./matchdayLeague")>()), storiesOn: (id: string) => asked(id) }));
const { withFitness } = await import("./draftFitness");

const fixtures = [{ code: 7, kickoff: "2026-09-26T14:00:00Z" }] as Fixture[];
const man = (name: string, minutes: number, over: Partial<DraftMan> = {}) => ({ fantraxId: name, name, minutes, left: 0, started: true, matches: [{ code: 7, label: "" }], fitness: null, ...over }) as DraftMan;
const side = (eleven: DraftMan[]) => ({ eleven }) as DraftSide;

describe("withFitness", () => {
  it("asks only for a man who did not play or went off before the hour, once, and never past the cut-off", async () => {
    const cache = new Map();
    const men = [man("Isak", 34), man("Millar", 0, { started: null }), man("Saka", 90), man("Hemmings", 18, { started: false }), man("Doku", 0, { left: 1 })];
    const first = await withFitness(side(men), fixtures, cache, Date.parse("2026-09-27T12:00:00Z"));
    expect(first.eleven.map((m) => m.fitness)).toEqual(["forced off with a groin injury", "forced off with a groin injury", null, null, null]);
    await withFitness(side(men), fixtures, cache, Infinity);
    expect(asked.mock.calls.map(([id]) => id)).toEqual(["Isak", "Millar"]);
    expect((await withFitness(side([man("Isak", 34)]), fixtures, cache, Date.parse("2026-09-26T16:00:00Z"))).eleven[0].fitness).toBeNull();
  });
});
