import { describe, expect, it } from "vitest";
import { draftMan } from "./__fixtures__/draftMan";
import { LIMITS } from "./__fixtures__/limits";
import { worthOf } from "./__fixtures__/worth";
import { draftBlocks, type MatchupContext } from "./brief";
import { draftCargo } from "./cargo";
import { normalizeDraftReport } from "./cargoRead";
import { checkDraft } from "./checks";
import { matchupState } from "./state";
import type { DraftMan, DraftSide } from "./types";

const xi = (tag: string, over: Record<number, DraftMan> = {}) => ["G", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"].map((s, i) => over[i] ?? draftMan(`${tag}${i}`, s, 2, 90));
const side = (name: string, total: number, eleven: DraftMan[]): DraftSide => ({ teamId: name, name, total, eleven, bench: [], subOrder: [] });
const context = (home: DraftSide, away: DraftSide): MatchupContext => ({ state: matchupState({ home, away }, worthOf(), LIMITS, "gameweek"), places: { home: { rank: 2, won: 1, drawn: 0, lost: 0, run: "W" }, away: null }, meetings: [], form: [], oldBoys: [] });
const contexts = [
  context(side("123", 38, xi("h", { 9: draftMan("Haaland", "F", 6, 90, 0, { code: 223094, clubCode: 43, goals: 1 }) })), side("test2", 37, xi("a"))),
  context(side("test3", 33, xi("c", { 1: draftMan("Vuskovic", "D", 6, 90) })), side("test4", 28, xi("d"))),
];
const blocks = draftBlocks("gameweek", contexts);
const clean = "Haaland got 6 with a goal, and 123 beat test2 by the one point that separated the sides at the end of the gameweek. The rest of the eleven blanked. It left 123 above test2 and two points clear of their nearest rival in the table. Nobody on either bench came into it, and neither side lost a man before the hour.";
const writing = (one: string, two = clean.replace(/Haaland/gu, "Vuskovic").replace(/123/gu, "test3").replace(/test2/gu, "test4")) => ({
  headlines: [], meanings: {}, headlineStory: "",
  matchups: new Map([[1, { standfirst: "123 beat test2 38-37.", paragraphs: [one] }], [2, { standfirst: "test3 beat test4 33-28.", paragraphs: [two] }]]),
});
const checks = (one: string) => checkDraft(writing(one), contexts, blocks).filter((f) => f.section.startsWith("1:")).map((f) => `${f.severity}: ${f.check} (${f.evidence})`);

describe("checkDraft", () => {
  it("passes writing drawn from its own block", () => {
    expect(checks(clean)).toEqual([]);
  });

  it("refuses another match-up's man, a figure or a score the brief does not give, and a quotation", () => {
    expect(checks(clean.replace("Haaland", "Vuskovic"))).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a man from another match-up \(Vuskovic\)/)]));
    expect(checks(`${clean} It was 41-30 at one stage, after 17 minutes.`)).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a score the brief does not give \(41-30\)/), expect.stringMatching(/^hard: a figure the brief does not give \(17\)/)]));
    expect(checks(`${clean} "We won," said nobody.`)).toEqual(expect.arrayContaining([expect.stringMatching(/^hard: a quotation mark/), expect.stringMatching(/send-back: a phrase this paper does not print \(said\)/)]));
  });

  it("sends back a manager's feeling, a held man and American spelling, but lets an FM frame through", () => {
    expect(checks(`${clean} The manager felt furious.`)).toEqual(expect.arrayContaining([expect.stringMatching(/a named person's feeling/)]));
    expect(checks(`${clean} test2 held him.`)).toEqual(expect.arrayContaining([expect.stringMatching(/held him/)]));
    expect(checks(`${clean} The pressure is on test2 in the boardroom.`)).toEqual([]);
  });
});

describe("the draft cargo", () => {
  it("carries each match-up's verdict, writing, form strip and the men it names, and reads back whole", () => {
    const cargo = draftCargo("gameweek", 5, contexts, writing(clean).matchups, new Map([["123", 1]]));
    expect(cargo.matchups[0]).toMatchObject({ verdict: contexts[0].state.score, home: { name: "123", rankBefore: 2, rankAfter: 1, run: "W" }, men: [{ name: "Haaland", code: 223094, clubCode: 43 }] });
    expect(normalizeDraftReport(JSON.parse(JSON.stringify(cargo)))).toEqual(cargo);
    expect(normalizeDraftReport({ cutoff: "week", gameweek: 5, matchups: [] })).toBeUndefined();
  });
});
