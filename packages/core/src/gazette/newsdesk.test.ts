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
  dealsInWindow: 0,
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
    // Everything a finished round earns, already filed: the ordinary outcome
    // of a cron that fires every half hour.
    const filed = newsdesk(desk({ finished: true }), () => false, NOW).map((a) => a.key);
    const covered = (key: string) => filed.includes(key);
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
    // After the last whistle the report owns every verdict: no call files,
    // whatever state the ties are in.
    const done = desk({ finished: true, ties: state.ties });
    expect(newsdesk(done, none, NOW).map((a) => a.kind)).not.toContain("tie-call");
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

  it("files the Monday set once the round is over, each on its own key", () => {
    const kinds = newsdesk(desk({ finished: true }), none, NOW).map((a) => a.kind);
    // The report leads; the considered columns follow in the order they are
    // worth reading, and the cap spreads them across firings.
    expect(kinds).toEqual([
      "round-report", "eleven", "power-ranking", "dodgers", "studio", "presser",
    ]);
    // Each spends its own key, so a second firing files only what is left.
    const after = newsdesk(desk({ finished: true }), (key) => key.startsWith("round-report") || key.startsWith("eleven"), NOW);
    expect(after.map((a) => a.kind)).toEqual(["power-ranking", "dodgers", "studio", "presser"]);
  });

  it("files the predictions column in the lock window, beside the preview", () => {
    const kinds = newsdesk(desk({ started: false }), none, NOW).map((a) => a.kind);
    expect(kinds).toEqual(["round-preview", "predictions"]);
  });

  it("files the wire only when there has been business, and once a window", () => {
    expect(newsdesk(desk({ dealsInWindow: 4 }), none, NOW).map((a) => a.kind)).toContain("wire");
    // A quiet week files nothing: the paper does not manufacture business.
    expect(newsdesk(desk({ dealsInWindow: 0 }), none, NOW).map((a) => a.kind)).not.toContain("wire");
    expect(
      newsdesk(desk({ dealsInWindow: 9 }), (key) => key === "wire:through-gw3", NOW).map((a) => a.kind),
    ).not.toContain("wire");
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
