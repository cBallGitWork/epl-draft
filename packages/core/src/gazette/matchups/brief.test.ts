import { describe, expect, it } from "vitest";
import { buildDraftBrief } from "./brief";
import { matchupState } from "./state";
import { draftMan } from "./__fixtures__/draftMan";
import { worthOf } from "./__fixtures__/worth";
import type { DraftMan, DraftSide } from "./types";

const man = (name: string, slot: string, points: number | null, minutes: number, left = 0, more: Partial<DraftMan> = {}): DraftMan => draftMan(name, slot, points, minutes, left, { club: "EVE", projected: 4.2, ...more });
const xi = (tag: string, over: Record<number, DraftMan> = {}) => ["G", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"].map((s, i) => over[i] ?? man(`${tag}${i}`, s, 2, 90));
const side = (name: string, total: number, eleven: DraftMan[], bench: DraftMan[] = []): DraftSide => ({ teamId: name, name, total, eleven, bench, subOrder: bench.map((m) => m.fantraxId) });
const limits = { min: { G: 1, D: 3, M: 2, F: 1 }, max: { G: 1, D: 5, M: 5, F: 3 } };
const worth = worthOf();
const state = matchupState(
  { home: side("Dons", 40, xi("h", { 1: man("Blank", "D", null, 0) }), [man("Sub", "D", 3, 90)]), away: side("Notemail", 38, xi("a", { 9: man("Isak", "F", null, 0, 1, { next: "away to Bournemouth" }) })) },
  worth,
  limits,
  "saturday",
);
const brief = buildDraftBrief("saturday", 5, [{ state, places: { home: { rank: 1, won: 3, drawn: 0, lost: 1, run: "WLWW" }, away: null }, lastMeeting: "Dons won 40-31 in round two" }]);

describe("buildDraftBrief", () => {
  it("never names a provider, a projection or an analyst's term", () => {
    for (const label of [/Fantrax/i, /\bFPL\b/, /project/i, /expected/i, /\bxG\b/, /%/, /\bbonus\b/i, /\brank\b/i]) expect(brief).not.toMatch(label);
  });

  it("gives the table, the last meeting, the score with the substitute named, and who is still to play", () => {
    expect(brief).toContain("- Dons: 1st, won 3, drawn 0, lost 1; last results W L W W");
    expect(brief).toContain("LAST TIME: Dons won 40-31 in round two.");
    expect(brief).toContain("THE SCORE after Saturday's matches: Dons 40-38 Notemail, 43-38 once Sub comes on.");
    expect(brief).toContain("STILL TO PLAY:\n- Notemail have 1 still to play: Isak (EVE, away to Bournemouth)\n- Notemail need 2 returns to win it");
    expect(brief).toContain("THE STORIES:\n- Dons: Sub (EVE) comes on for Blank (EVE), who did not play, with 3 points");
    expect(brief).not.toMatch(/WORKED OUT|true as written|to draw and/u);
  });
});
