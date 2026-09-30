import { describe, expect, it } from "vitest";
import { draftMan, goalAt } from "./__fixtures__/draftMan";
import { contextOf } from "./__fixtures__/context";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { draftCargo } from "./cargo";
import { normalizeDraftReport } from "./cargoRead";
import { lateDecider } from "./__fixtures__/gw5";

const home = draftSide("123", 38, eleven("h", { 9: draftMan("Haaland", "F", 6, 90, 0, { goals: 1, scoredAt: [goalAt(81)] }) }));
const context = contextOf(home, draftSide("test2", 37, eleven("a")), { places: { home: { rank: 2, won: 1, drawn: 0, lost: 0, run: "W" }, away: null } });
const cargo = draftCargo("gameweek", 5, [context], new Map([[1, { paragraphs: ["Haaland's goal settled it."] }]]), new Map([["123", 1]]));

describe("the draft cargo", () => {
  it("opens each match-up on the desk's verdict, with each side's returns and eleven and the running score", () => {
    expect(cargo.matchups[0]).toMatchObject({
      verdict: context.state.score,
      standfirst: `${context.state.score}.`,
      home: { name: "123", rankBefore: 2, rankAfter: 1, run: "W", returns: { goals: [{ name: "Haaland", count: 1, minutes: ["81"] }] } },
      byDay: [{ day: "2026-09-26", home: 38, away: 37 }],
    });
    expect(cargo.matchups[0].home.eleven).toHaveLength(11);
  });

  it("keeps the story the desk chose, for the next report, and drops one it cannot read", () => {
    const filed = draftCargo("gameweek", 5, [lateDecider()], new Map(), new Map());
    expect(filed.matchups[0].story).toMatchObject({ kind: "late-decider", family: "decider", teamIds: ["test2", "123"], cast: expect.arrayContaining(["Haaland"]) });
    const read = JSON.parse(JSON.stringify(filed));
    expect(normalizeDraftReport(read)).toEqual(filed);
    read.matchups[0].story.kind = "a feeling";
    expect(normalizeDraftReport(read)?.matchups[0].story).toBeNull();
  });

  it("reads back whole, and refuses a cut-off it does not know", () => {
    expect(normalizeDraftReport(JSON.parse(JSON.stringify(cargo)))).toEqual(cargo);
    expect(normalizeDraftReport({ cutoff: "week", gameweek: 5, matchups: [] })).toBeUndefined();
  });

  it("reads a report filed before the page's data with none of it, and drops a part-timed scorer's minutes", () => {
    const filed = JSON.parse(JSON.stringify(cargo));
    for (const side of [filed.matchups[0].home, filed.matchups[0].away]) {
      delete side.returns;
      delete side.eleven;
    }
    delete filed.matchups[0].byDay;
    const read = normalizeDraftReport(filed)!.matchups[0];
    expect([read.home.returns, read.home.eleven, read.byDay]).toEqual([{ goals: [], assists: [], cleanSheets: [] }, [], []]);
    filed.matchups[0].home.returns = { goals: [{ name: "Haaland", count: 2, minutes: ["81"] }] };
    expect(normalizeDraftReport(filed)!.matchups[0].home.returns.goals).toEqual([{ name: "Haaland", count: 2, minutes: [] }]);
  });
});
