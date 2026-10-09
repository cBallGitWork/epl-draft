import { describe, expect, it } from "vitest";
import { strangers, type Assignment } from "@epl/core";
import { contextOf } from "../../packages/core/src/gazette/matchups/__fixtures__/context";
import { draftSide, eleven } from "../../packages/core/src/gazette/matchups/__fixtures__/draftSide";
import { prepare } from "./commission";
import type { DeskContext } from "./dispatch";
import type { DraftJob } from "./draftWriter";

const job: DraftJob = {
  cutoff: "gameweek",
  gameweek: 5,
  contexts: [contextOf(draftSide("Hartlepool Rovers", 50, eleven("H")), draftSide("Crawley Town", 40, eleven("C")))],
  rankAfter: new Map(),
  pastHeadlines: [],
  pastProse: [],
};
const ctx = { drafts: new Map([["gameweek", job]]) } as unknown as DeskContext;
const assignment: Assignment = { kind: "draft-report", key: "draft-report:gw5:gameweek", slug: "gw5-draft-report-gameweek", cutoff: "gameweek" };

describe("prepare", () => {
  // The filed report's names are checked against this brief; an empty one reported every side and man as a stranger.
  it("briefs a draft report with the match-ups its names are checked against", () => {
    const desk = prepare(assignment, ctx);
    const brief = desk !== null && "brief" in desk ? desk.brief : "";
    expect(strangers("Hartlepool Rovers beat Crawley Town by ten points.", brief)).toEqual([]);
  });
});
