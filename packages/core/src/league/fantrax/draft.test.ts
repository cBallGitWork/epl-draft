import { describe, expect, it } from "vitest";
import { mapDraftPicks } from "./draft";

// The rehearsal league's real draft: 4 teams, 60 picks, completed 6 Aug 2026.
const pick = (over: Record<string, unknown> = {}) => ({
  round: 1,
  pick: 1,
  pickInRound: 1,
  teamId: "8enbgqo5msgb375j",
  playerId: "061vq",
  time: 1786010807000,
  ...over,
});

describe("mapDraftPicks", () => {
  it("reads a completed draft as pedigree", () => {
    expect(mapDraftPicks({ draftState: "completed", draftPicks: [pick()] })).toEqual([
      { fantraxId: "061vq", teamId: "8enbgqo5msgb375j", round: 1, overall: 1 },
    ]);
  });

  it("keeps the overall number, not the one within the round", () => {
    // Only one of them means "the No.1 overall pick", and they are easy to
    // confuse: on a 16-team board, round 2 pick 1 is overall 17.
    const [second] = mapDraftPicks({
      draftState: "completed",
      draftPicks: [pick({ round: 2, pick: 17, pickInRound: 1 })],
    });
    expect(second?.overall).toBe(17);
    expect(second?.round).toBe(2);
  });

  it("reads nothing from a draft still running", () => {
    // A partial list is a WRONG pedigree, not a short one: everyone not yet
    // taken would read as undrafted. The real league is in this state until
    // 10 Oct, so it is the ordinary case rather than an edge one.
    expect(mapDraftPicks({ draftState: "IN_PROGRESS", draftPicks: [pick()] })).toEqual([]);
    expect(mapDraftPicks({ draftPicks: [pick()] })).toEqual([]);
  });

  it("drops a pick it cannot attribute rather than inventing one", () => {
    const picks = mapDraftPicks({
      draftState: "completed",
      draftPicks: [pick(), pick({ playerId: undefined }), pick({ round: "one" })],
    });
    expect(picks).toHaveLength(1);
  });

  it("survives a payload with no picks at all", () => {
    expect(mapDraftPicks({ draftState: "completed" })).toEqual([]);
    expect(mapDraftPicks({})).toEqual([]);
  });
});
