import { describe, expect, it } from "vitest";
import { buildDraftBrief } from "./brief";
import { matchupState } from "./state";
import type { DraftMan, DraftSide } from "./types";

const man = (name: string, slot: string, points: number | null, minutes: number, left = 0, more: Partial<DraftMan> = {}): DraftMan => ({
  fantraxId: name, name, club: "EVE", slot, points, minutes, played: left === 0 ? 1 : 0, left, debut: false, projected: 4.2, next: null, fitness: null, ...more,
});
const xi = (tag: string, over: Record<number, DraftMan> = {}) => ["G", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"].map((s, i) => over[i] ?? man(`${tag}${i}`, s, 2, 90));
const side = (name: string, total: number, eleven: DraftMan[], bench: DraftMan[] = []): DraftSide => ({ teamId: name, name, total, eleven, bench, subOrder: bench.map((m) => m.fantraxId) });
const limits = { min: { G: 1, D: 3, M: 2, F: 1 }, max: { G: 1, D: 5, M: 5, F: 3 } };
const worth = {
  appearance: 0,
  returns: {
    G: [{ kind: "clean sheet" as const, worth: 4 }],
    D: [{ kind: "goal" as const, worth: 6 }, { kind: "assist" as const, worth: 3 }, { kind: "clean sheet" as const, worth: 4 }],
    M: [{ kind: "goal" as const, worth: 5 }, { kind: "assist" as const, worth: 3 }, { kind: "clean sheet" as const, worth: 1 }],
    F: [{ kind: "goal" as const, worth: 4 }, { kind: "assist" as const, worth: 3 }],
  },
};
const state = matchupState(
  { home: side("Dons", 40, xi("h", { 1: man("Blank", "D", null, 0) }), [man("Sub", "D", 3, 90)]), away: side("Notemail", 38, xi("a", { 9: man("Isak", "F", null, 0, 1, { next: "Bournemouth (A)" }) })) },
  worth,
  limits,
);
const brief = buildDraftBrief("saturday", 5, [{ state, places: { home: { rank: 1, won: 3, drawn: 0, lost: 1, run: "WLWW" }, away: null }, lastMeeting: "Dons won 40-31 in round two" }]);

describe("buildDraftBrief", () => {
  it("never names a provider, a projection or an analyst's term", () => {
    for (const label of [/Fantrax/i, /\bFPL\b/, /project/i, /expected/i, /\bxG\b/, /%/, /\bbonus\b/i, /\brank\b/i]) expect(brief).not.toMatch(label);
  });

  it("gives the table, the last meeting, the score with the substitutions, and who is left against whom", () => {
    expect(brief).toContain("- Dons: 1st, won 3, drawn 0, lost 1; last results W L W W");
    expect(brief).toContain("LAST TIME: Dons won 40-31 in round two.");
    expect(brief).toContain("THE SCORE after Saturday's matches: Dons 40-38 Notemail; 43-38 with the automatic substitutions: Dons lead by 5 points.");
    expect(brief).toContain("Notemail have 1 to play: Isak (EVE, F, against Bournemouth (A))");
    expect(brief).not.toMatch(/to draw and|behind, and need/u);
    expect(brief).toContain("Notemail need at least 2 returns between them");
  });
});
