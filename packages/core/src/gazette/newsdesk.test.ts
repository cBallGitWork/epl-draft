import { describe, expect, it } from "vitest";
import { newsdesk, type DeskState } from "./newsdesk";
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
  news: [],
  pressers: [],
  ...over,
});

const none = () => false;

describe("newsdesk", () => {
  it("files a report per tie once the round finishes, and the preview only in the lock window", () => {
    const ties = [
      { homeTeamId: "a", awayTeamId: "b", state: "settled" as const },
      { homeTeamId: "c", awayTeamId: "d", state: "settled" as const },
    ];
    const finished = newsdesk(desk({ finished: true, ties }), none, NOW);
    // **One story per tie and never one about the league.** Two ties, two
    // reports, each keyed on its own pair.
    expect(finished.filter((a) => a.kind === "tie-report").map((a) => a.key)).toEqual([
      "tie-report:p3:avb",
      "tie-report:p3:cvd",
    ]);
    expect(newsdesk(desk({ started: false }), none, NOW)[0]?.kind).toBe("round-preview");
    // Mid-round is neither: a preview is too late and a report is too early —
    // the writer's own window rule, kept.
    const midRound = newsdesk(desk({ ties }), none, NOW);
    expect(midRound.find((a) => a.kind === "round-preview" || a.kind === "tie-report")).toBeUndefined();
  });

  it("reports a tie whatever state it was left in, unlike a mid-round call", () => {
    // A call fires only on a tie that is decided, because an open one has
    // nothing to call. A REPORT fires on every tie: the round is over, so the
    // one that went to the wire is the one most worth reading about.
    const ties = [{ homeTeamId: "a", awayTeamId: "b", state: "open" as const }];
    expect(newsdesk(desk({ ties }), none, NOW).map((a) => a.kind)).not.toContain("tie-report");
    expect(newsdesk(desk({ finished: true, ties }), none, NOW).map((a) => a.kind)).toContain(
      "tie-report",
    );
  });

  it("files each wire item once, and no more than the cap", () => {
    // The loop over the news list was written out TWICE, so a news day queued
    // every item two deep. `want` guards the LEDGER, not the running order, so
    // nothing caught it: with a story cap of two, one BBC item could buy both
    // of a firing's model calls and file the same slug twice.
    const news = [
      { key: "a", slug: "news-a" },
      { key: "b", slug: "news-b" },
      { key: "c", slug: "news-c" },
    ];
    const keys = newsdesk(desk({ news }), none, NOW)
      .filter((a) => a.kind === "news")
      .map((a) => a.key);
    expect(keys).toEqual(["news:a", "news:b"]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never lists one assignment twice, whatever the desk is holding", () => {
    // The running order is spent top-down against a cap, so a duplicate does
    // not merely repeat itself: it displaces the story underneath it.
    const state = desk({
      finished: true,
      news: [
        { key: "a", slug: "news-a" },
        { key: "b", slug: "news-b" },
      ],
      dealsInWindow: 3,
      stakes: [stake(), stake({ key: "1v2", fixtureId: 12 })],
      ties: [{ homeTeamId: "a", awayTeamId: "b", state: "probable" }],
    });
    const keys = newsdesk(state, none, NOW).map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
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

  it("never reports a Premier League match, however consequential", () => {
    // This is a DRAFT paper: `/prem/match/[id]` carries the football's own
    // coverage, and six finished fixtures full of rostered men earn no column.
    const stakes = Array.from({ length: 6 }, (_, n) =>
      stake({ key: `f${n}`, fixtureId: n, finished: n < 5 }),
    );
    const filed = newsdesk(desk({ stakes }), none, NOW);
    expect(filed.map((a) => a.kind)).not.toContain("match-report");
  });

  it("files the team sheet on a day with pressers", () => {
    const thu = { key: "presser:gw3:2026-09-17", slug: "gw3-presser-2026-09-17", day: "2026-09-17" };
    const fri = { key: "presser:gw3:2026-09-18", slug: "gw3-presser-2026-09-18", day: "2026-09-18" };
    // Both days are their own column — Craig's week runs pressers Thursday AND
    // Friday, and one key for the week would suppress the second.
    const filed = newsdesk(desk({ pressers: [thu, fri] }), none, NOW);
    expect(filed.filter((a) => a.kind === "presser").map((a) => a.key)).toEqual([thu.key, fri.key]);
    // The DAY travels with the assignment: one kind, two editions, and every
    // consumer narrows to it rather than parsing the key.
    expect(filed.filter((a) => a.kind === "presser").map((a) => a.day)).toEqual([thu.day, fri.day]);
  });

  it("files the team sheet even while the last round is still 'finished'", () => {
    // `desk.finished` stays true for four or five days of seven, so a Thursday
    // column gated on the round being unfinished would never fire at all.
    const thu = { key: "presser:gw3:2026-09-17", slug: "gw3-presser-2026-09-17", day: "2026-09-17" };
    const filed = newsdesk(desk({ finished: true, locked: true, pressers: [thu] }), none, NOW);
    expect(filed.map((a) => a.kind)).toContain("presser");
  });

  it("files no team sheet on a day with no pressers", () => {
    // The WINDOW is the gate, not a flag: the caller offers only days whose
    // signals were said after the last lock. `desk.locked` is the current
    // period's lock and has long passed by Thursday — gating on it meant the
    // column never fired at all.
    expect(newsdesk(desk({ pressers: [] }), none, NOW).map((a) => a.kind)).not.toContain("presser");
  });

  it("files nothing for a finished fixture nobody in the league had a man in", () => {
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
    const ties = [{ homeTeamId: "a", awayTeamId: "b", state: "settled" as const }];
    const kinds = newsdesk(desk({ finished: true, ties }), none, NOW).map((a) => a.kind);
    // The reporting leads; the considered columns follow in the order they are
    // worth reading, and the cap spreads them across firings.
    expect(kinds).toEqual(["tie-report", "eleven", "power-ranking", "dodgers"]);
    // Each spends its own key, so a second firing files only what is left.
    const after = newsdesk(
      desk({ finished: true, ties }),
      (key) => key.startsWith("tie-report") || key.startsWith("eleven"),
      NOW,
    );
    expect(after.map((a) => a.kind)).toEqual(["power-ranking", "dodgers"]);
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

  it("puts the perishable before the keepable", () => {
    // A tie that has just gone settled goes stale within hours — the next
    // score can moot the call and the report will own it. A waiver trend and
    // a BBC item keep. With a cap of two, the order IS the decision.
    const state = desk({
      dealsInWindow: 4,
      news: [{ key: "k1", slug: "news-k1" }],
      ties: [{ homeTeamId: "a", awayTeamId: "b", state: "settled" }],
      stakes: [stake()],
    });
    const kinds = newsdesk(state, none, NOW).map((a) => a.kind);
    expect(kinds.indexOf("tie-call")).toBeLessThan(kinds.indexOf("wire"));
    expect(kinds.indexOf("tie-call")).toBeLessThan(kinds.indexOf("news"));
  });

  it("puts the round's own reporting first and the look-ahead last", () => {
    const state = desk({
      finished: true,
      stakes: [stake()],
      ties: [{ homeTeamId: "a", awayTeamId: "b", state: "settled" }],
    });
    const kinds = newsdesk(state, none, NOW).map((a) => a.kind);
    expect(kinds[0]).toBe("tie-report");
    // The Monday set follows the round's own reporting.
    expect(kinds).toContain("eleven");
  });
});
