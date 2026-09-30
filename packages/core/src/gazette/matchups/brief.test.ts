import { describe, expect, it } from "vitest";
import { LIMITS } from "./__fixtures__/limits";
import { buildDraftBrief, leadFirst, type MatchupContext } from "./brief";
import { matchupState } from "./state";
import { draftMan } from "./__fixtures__/draftMan";
import { worthOf } from "./__fixtures__/worth";
import type { DraftMan, DraftSide } from "./types";

const man = (name: string, slot: string, points: number | null, minutes: number, left = 0, more: Partial<DraftMan> = {}): DraftMan => draftMan(name, slot, points, minutes, left, { club: "EVE", projected: 4.2, ...more });
const xi = (tag: string, over: Record<number, DraftMan> = {}) => ["G", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"].map((s, i) => over[i] ?? man(`${tag}${i}`, s, 2, 90));
const side = (name: string, total: number, eleven: DraftMan[], bench: DraftMan[] = []): DraftSide => ({ teamId: name, name, total, eleven, bench, subOrder: bench.map((m) => m.fantraxId) });
const worth = worthOf();
const state = matchupState(
  { home: side("Dons", 40, xi("h", { 1: man("Blank", "D", null, 0) }), [man("Sub", "D", 3, 90)]), away: side("Notemail", 38, xi("a", { 9: man("Isak", "F", null, 0, 1, { next: { opponent: "Bournemouth", home: false, day: "Sunday" } }) })) },
  worth,
  LIMITS,
  "saturday",
);
const context: MatchupContext = { state, places: { home: { rank: 1, won: 3, drawn: 0, lost: 1, run: "WLWW" }, away: null }, meetings: ["the last meeting: Dons won 40-31 in gameweek 2"], form: [{ teamId: "Dons", kind: "streak", text: "Dons had won 3 in a row going into the gameweek" }], oldBoys: ["Isak faced Dons, who drafted him"] };
const brief = buildDraftBrief("saturday", 5, [context]);

describe("buildDraftBrief", () => {
  it("never names a provider, a projection or an analyst's term", () => {
    for (const label of [/Fantrax/i, /\bFPL\b/, /project/i, /expected/i, /\bxG\b/, /%/, /\bbonus\b/i, /\brank\b/i]) expect(brief).not.toMatch(label);
  });

  it("gives the table, the last meeting, the score with the substitute named, and who is still to play", () => {
    expect(brief).toContain("- Dons: 1st, won 3, drawn 0, lost 1; last results W L W W");
    expect(brief).toContain("THE MEETINGS:\n- the last meeting: Dons won 40-31 in gameweek 2");
    expect(brief).toContain("FORM AND THE TABLE:\n- Dons had won 3 in a row going into the gameweek [streak]");
    expect(brief).toContain("- Isak faced Dons, who drafted him");
    expect(brief).toContain("THE SCORE after Saturday's matches: Dons lead Notemail 40-38, 43-38 once Sub comes on.");
    expect(brief).toContain("STILL TO PLAY:\n- Notemail have 1 still to play: Isak (EVE, away to Bournemouth on Sunday)\n- Notemail need 2 returns to win it");
    expect(brief).toContain("THE STORIES:\n- Dons: Sub (EVE) replaces Blank (EVE), who did not play, with 3 points");
    expect(brief).not.toMatch(/WORKED OUT|true as written|to draw and/u);
  });

  it("numbers the match-ups, the lead first", () => {
    expect(brief).toContain("MATCH-UP 1: Dons v Notemail");
  });

  it("leads with a result the substitutions flipped, then the closest", () => {
    const at = (score: string, margin: number): MatchupContext => ({ ...context, state: { ...context.state, score, margin } });
    const flipped = at("A beat B 33-28; B led 26-24 before the substitutions", 5);
    const close = at("C beat D 30-29", 1);
    const wide = at("E beat F 50-20", 30);
    expect(leadFirst([wide, close, flipped], "gameweek").map((c) => c.state.score)).toEqual([flipped.state.score, close.state.score, wide.state.score]);
    expect(leadFirst([wide, close, flipped], "saturday")[0].state.score).toBe(close.state.score);
  });
});
