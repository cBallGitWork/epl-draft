import { describe, expect, it } from "vitest";
import { MATCH_REPORTS_PER_ROUND, newsdesk, type DeskState } from "./newsdesk";
import type { FixtureStake } from "./relevance";

const NOW = "2026-08-31T12:00:00.000Z";

const stake = (over: Partial<FixtureStake> = {}): FixtureStake => ({
  key: "3v7",
  fixtureId: 31,
  kickoff: "2026-08-29T14:00:00.000Z",
  finished: true,
  men: 8,
  ties: [],
  ...over,
});

const desk = (over: Partial<DeskState> = {}): DeskState => ({
  gameweek: 3,
  period: 3,
  finished: false,
  locked: true,
  started: true,
  stakes: [],
  ties: [],
  ...over,
});

const none = () => false;

describe("newsdesk", () => {
  it("files the report once the round finishes, and the preview only in the lock window", () => {
    expect(newsdesk(desk({ finished: true }), none, NOW)[0]?.kind).toBe("round-report");
    expect(newsdesk(desk({ started: false }), none, NOW)[0]?.kind).toBe("round-preview");
    // Mid-round is neither: a preview is too late and a report is too early —
    // the writer's own window rule, kept.
    const midRound = newsdesk(desk(), none, NOW);
    expect(midRound.find((a) => a.kind === "round-preview" || a.kind === "round-report")).toBeUndefined();
  });

  it("spends nothing already covered", () => {
    const covered = (key: string) => key === "round-report:gw3";
    expect(newsdesk(desk({ finished: true }), covered, NOW)).toEqual([]);
  });

  it("calls a tie the moment it stops being open, once", () => {
    const state = desk({ ties: [{ homeTeamId: "a", awayTeamId: "b", state: "probable" }] });
    const [call] = newsdesk(state, none, NOW);
    expect(call.kind).toBe("tie-call");
    expect(call.key).toBe("tie-call:p3:avb");
    // The settled tier spends the same key: one call per tie per period,
    // however the state moved after the paper spoke.
    expect(newsdesk(state, (key) => key === "tie-call:p3:avb", NOW)).toEqual([]);
    // After the last whistle the report owns every verdict.
    expect(
      newsdesk(desk({ finished: true, ties: state.ties }), (key) => key.startsWith("round"), NOW),
    ).toEqual([]);
  });

  it("reports only the round's most consequential fixtures, as they finish", () => {
    const stakes = Array.from({ length: 6 }, (_, n) =>
      stake({ key: `f${n}`, fixtureId: n, finished: n < 5 }),
    );
    const filed = newsdesk(desk({ stakes }), none, NOW).filter((a) => a.kind === "match-report");
    // The slice is the ROUND's four, not the firing's: the fifth-ranked
    // fixture never files however quiet the day.
    expect(filed).toHaveLength(MATCH_REPORTS_PER_ROUND);
    expect(filed.map((a) => a.key)).toEqual(["match:gw3:f0", "match:gw3:f1", "match:gw3:f2", "match:gw3:f3"]);
  });

  it("skips a finished fixture with no rostered men in it", () => {
    const filed = newsdesk(desk({ stakes: [stake({ men: 0 })] }), none, NOW);
    expect(filed).toEqual([]);
  });

  it("previews tonight's fixture only when an OPEN tie has men on both sides", () => {
    const tonight = stake({
      key: "1v2",
      finished: false,
      kickoff: "2026-08-31T19:00:00.000Z",
      ties: [{ homeTeamId: "a", awayTeamId: "b", homeMen: 1, awayMen: 2 }],
    });
    const open = desk({ stakes: [tonight], ties: [{ homeTeamId: "a", awayTeamId: "b", state: "open" }] });
    expect(newsdesk(open, none, NOW)[0]?.kind).toBe("fixture-preview");

    // A decided tie has nothing left to swing; a one-sided presence is a
    // rooting interest, not a duel; a kickoff past the window can wait.
    const decided = desk({ stakes: [tonight], ties: [{ homeTeamId: "a", awayTeamId: "b", state: "probable" }] });
    expect(newsdesk(decided, none, NOW).find((a) => a.kind === "fixture-preview")).toBeUndefined();
    const oneSided = desk({
      stakes: [stake({ ...tonight, ties: [{ homeTeamId: "a", awayTeamId: "b", homeMen: 3, awayMen: 0 }] })],
      ties: open.ties,
    });
    expect(newsdesk(oneSided, none, NOW).find((a) => a.kind === "fixture-preview")).toBeUndefined();
    const distant = desk({
      stakes: [stake({ ...tonight, kickoff: "2026-09-02T19:00:00.000Z" })],
      ties: open.ties,
    });
    expect(newsdesk(distant, none, NOW).find((a) => a.kind === "fixture-preview")).toBeUndefined();
  });

  it("puts the round's own word first and the look-ahead last", () => {
    const state = desk({
      finished: true,
      stakes: [stake()],
      ties: [{ homeTeamId: "a", awayTeamId: "b", state: "settled" }],
    });
    const kinds = newsdesk(state, none, NOW).map((a) => a.kind);
    expect(kinds[0]).toBe("round-report");
    expect(kinds).toContain("match-report");
  });
});
