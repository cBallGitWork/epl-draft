import { describe, expect, it } from "vitest";
import { newsdesk, type DeskState } from "./newsdesk";

const NOW = "2026-08-31T12:00:00.000Z";

const desk = (over: Partial<DeskState> = {}): DeskState => ({
  gameweek: 3,
  period: 3,
  finished: false,
  locked: false,
  // An ordinary round has fixtures; an open tie files nothing of its own.
  ties: [{ homeTeamId: "x", awayTeamId: "y", state: "open" }],
  pressers: [],
  lineups: null,
  ahead: null,
  next: null,
  season: null,
  reportDays: [],
  draftReports: [],
  ...over,
});

const none = () => false;

describe("newsdesk", () => {
  it("files only the seven weekly kinds, whatever the desk holds", () => {
    // Craig, 1 Oct 2026: match and draft reports, Bin XI, the Team Sheet, the elevens, the sheets and Lawro; nothing else.
    const ahead = { period: 4, gameweek: 4 };
    const full = desk({
      finished: true,
      ties: [{ homeTeamId: "a", awayTeamId: "b", state: "settled" }],
      reportDays: [{ key: "match-report:gw3:2026-09-26", slug: "gw3-prem-report-2026-09-26", day: "2026-09-26" }],
      draftReports: [{ key: "draft-report:gw3:gameweek", slug: "gw3-draft-report-gameweek", cutoff: "gameweek", day: "2026-09-28" }],
      pressers: [{ key: "presser:gw3:2026-10-01", slug: "gw3-presser-2026-10-01", day: "2026-10-01" }],
      lineups: { key: "predicted-xi:gw4", slug: "gw4-predicted-xi" },
      ahead,
      next: { ...ahead, locksAt: "2026-10-03T11:15:00.000Z" },
    });
    const kinds = new Set([
      ...newsdesk(full, none, "2026-09-29T08:15:00.000Z").map((a) => a.kind),
      ...newsdesk(full, none, "2026-10-01T17:00:00.000Z").map((a) => a.kind),
    ]);
    for (const a of newsdesk({ ...full, finished: false, locked: true }, none, NOW)) kinds.add(a.kind);
    expect([...kinds].sort()).toEqual(["bin-xi", "draft-report", "match-report", "predicted-xi", "predictions", "presser", "sheets"]);
  });

  it("files the Bin XI on a Tuesday in London once the round is over, and on no other day", () => {
    const kinds = (now: string, finished = true) => newsdesk(desk({ finished }), none, now).map((a) => a.kind);
    // 23:30 UTC on a Monday in September is already Tuesday in London.
    expect(kinds("2026-09-28T23:30:00.000Z")).toContain("bin-xi");
    expect(kinds("2026-09-29T08:15:00.000Z")).toContain("bin-xi");
    expect(kinds("2026-09-28T08:15:00.000Z")).not.toContain("bin-xi");
    expect(kinds("2026-09-30T08:15:00.000Z")).not.toContain("bin-xi");
    // A midweek round still being played on a Tuesday has no week to pick from yet.
    expect(kinds("2026-09-29T08:15:00.000Z", false)).not.toContain("bin-xi");
    expect(newsdesk(desk({ finished: true }), none, "2026-09-29T08:15:00.000Z").find((a) => a.kind === "bin-xi")?.key).toBe("bin-xi:gw3");
  });

  it("never lists one assignment twice, whatever the desk is holding", () => {
    // The running order is spent top-down against a cap, so a duplicate does
    // not merely repeat itself: it displaces the story underneath it.
    const state = desk({
      finished: true,
      reportDays: [{ key: "match-report:gw3:2026-08-29", slug: "gw3-prem-report-2026-08-29", day: "2026-08-29" }],
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

  it("reports each settled Premier League day, first", () => {
    // Revived 28 Sep 2026 as one woven report per London match-day (GAZETTA); a stake alone still earns nothing.
    const sat = { key: "match-report:gw3:2026-08-29", slug: "gw3-prem-report-2026-08-29", day: "2026-08-29" };
    expect(newsdesk(desk(), none, NOW).map((a) => a.kind)).not.toContain("match-report");
    const filed = newsdesk(desk({ finished: true, reportDays: [sat] }), none, NOW);
    expect(filed[0]).toEqual({ kind: "match-report", ...sat });
  });

  it("never files a day's report twice", () => {
    const sat = { key: "match-report:gw3:2026-08-29", slug: "gw3-prem-report-2026-08-29", day: "2026-08-29" };
    expect(newsdesk(desk({ reportDays: [sat] }), (key) => key === sat.key, NOW).some((a) => a.kind === "match-report")).toBe(false);
  });

  it("commissions the draft report once the gameweek ends, never after Saturday, and once", () => {
    // Craig, 1 Oct 2026: one draft report a week, at the end of the gameweek.
    const saturday = { key: "draft-report:gw3:saturday", slug: "gw3-draft-report-saturday", cutoff: "saturday" as const, day: "2026-08-29" };
    const gameweek = { key: "draft-report:gw3:gameweek", slug: "gw3-draft-report", cutoff: "gameweek" as const, day: "2026-08-31" };
    const filed = newsdesk(desk({ draftReports: [saturday, gameweek] }), none, NOW).filter((a) => a.kind === "draft-report");
    expect(filed).toEqual([{ kind: "draft-report", key: gameweek.key, slug: gameweek.slug, cutoff: "gameweek", day: "2026-08-31" }]);
    expect(newsdesk(desk({ draftReports: [gameweek] }), (key) => key === gameweek.key, NOW).some((a) => a.kind === "draft-report")).toBe(false);
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
    const filed = newsdesk(desk({ finished: true, pressers: [thu] }), none, NOW);
    expect(filed.map((a) => a.kind)).toContain("presser");
  });

  it("files no team sheet on a day with no pressers", () => {
    // The WINDOW is the gate, not a flag: the caller offers only days whose
    // signals were said after the last lock. The current period's lock has long
    // passed by Thursday — gating on it meant the column never fired at all.
    expect(newsdesk(desk({ pressers: [] }), none, NOW).map((a) => a.kind)).not.toContain("presser");
  });

  it("files Lawro on the Thursday evening before the round, about the round ahead", () => {
    // GW6 locks Sat 10 Oct at 12:15 London; the column is due from Thu 8 Oct, 18:00 London.
    const next = { period: 6, gameweek: 6, locksAt: "2026-10-10T11:15:00.000Z" };
    const lawro = newsdesk(desk({ gameweek: 5, period: 5, finished: true, next }), none, "2026-10-08T17:00:00.000Z");
    expect(lawro.find((a) => a.kind === "predictions")).toEqual({
      kind: "predictions",
      key: "predictions:gw6",
      slug: "gw6-predictions",
      round: { period: 6, gameweek: 6 },
    });
    // Not before six, not while the last round is still being played, not twice.
    expect(newsdesk(desk({ finished: true, next }), none, "2026-10-08T16:30:00.000Z").map((a) => a.kind)).not.toContain("predictions");
    expect(newsdesk(desk({ finished: false, next }), none, "2026-10-08T17:00:00.000Z").map((a) => a.kind)).not.toContain("predictions");
    expect(newsdesk(desk({ finished: true, next }), (key) => key === "predictions:gw6", "2026-10-08T17:00:00.000Z").map((a) => a.kind)).not.toContain("predictions");
    // Nothing in a break week, and nothing without a next round.
    expect(newsdesk(desk({ finished: true, next }), none, "2026-10-01T17:00:00.000Z").map((a) => a.kind)).not.toContain("predictions");
    expect(newsdesk(desk({ finished: true, next: null }), none, "2026-10-08T17:00:00.000Z").map((a) => a.kind)).not.toContain("predictions");
  });

  it("files the sheets once the deadline passes, until the last whistle, and never twice", () => {
    const sheets = (over: Partial<DeskState>) => newsdesk(desk(over), none, NOW).filter((a) => a.kind === "sheets");
    expect(sheets({ locked: false })).toEqual([]);
    expect(sheets({ locked: true }).map((a) => a.key)).toEqual(["sheets:gw3"]);
    expect(sheets({ locked: true, finished: true })).toEqual([]);
    expect(sheets({ locked: true, ties: [] })).toEqual([]);
    expect(newsdesk(desk({ locked: true }), (key) => key === "sheets:gw3", NOW).some((a) => a.kind === "sheets")).toBe(false);
  });

  it("files the elevens when the export holds the round ahead, and never twice", () => {
    const lineups = { key: "predicted-xi:gw4", slug: "gw4-predicted-xi" };
    const filed = newsdesk(desk({ lineups }), none, NOW);
    expect(filed.filter((a) => a.kind === "predicted-xi").map((a) => a.slug)).toEqual([lineups.slug]);
    expect(newsdesk(desk({ lineups }), (key) => key === lineups.key, NOW).map((a) => a.kind)).not.toContain(
      "predicted-xi",
    );
  });

  it("files no elevens when the export is not the round ahead's", () => {
    expect(newsdesk(desk({ lineups: null }), none, NOW).map((a) => a.kind)).not.toContain("predicted-xi");
  });

  it("writes up no round the served league has no fixtures in, and still looks ahead", () => {
    // The real league from the 7 Oct switch: FPL's gameweek 5 is over, and the league's period 5 has no pairings.
    const ahead = { period: 6, gameweek: 6 };
    const unplayed = desk({
      gameweek: 5,
      period: 5,
      finished: true,
      ties: [],
      reportDays: [{ key: "match-report:gw5:2026-10-03", slug: "gw5-prem-report-2026-10-03", day: "2026-10-03" }],
      draftReports: [{ key: "draft-report:gw5:gameweek", slug: "gw5-draft-report-gameweek", cutoff: "gameweek", day: "2026-10-05" }],
      pressers: [{ key: "presser:gw5:2026-10-08", slug: "gw5-presser-2026-10-08", day: "2026-10-08" }],
      lineups: { key: "predicted-xi:gw6", slug: "gw6-predicted-xi" },
      ahead,
      next: { ...ahead, locksAt: "2026-10-10T11:15:00.000Z" },
    });
    expect(newsdesk(unplayed, none, "2026-10-08T17:00:00.000Z").map((a) => a.key)).toEqual([
      "presser:gw5:2026-10-08",
      "predicted-xi:gw6",
      "predictions:gw6",
    ]);
    // No Bin XI on the Tuesday for a round nobody played.
    expect(newsdesk(unplayed, none, "2026-10-06T08:15:00.000Z").map((a) => a.kind)).not.toContain("bin-xi");
  });

  it("stamps the Team Sheet and the elevens with the round they preview", () => {
    // Between rounds FPL's current gameweek is the one just played: gw6's
    // elevens filed as period 5 and sorted under last week's reports.
    const thu = { key: "presser:gw5:2026-10-08", slug: "gw5-presser-2026-10-08", day: "2026-10-08" };
    const lineups = { key: "predicted-xi:gw6", slug: "gw6-predicted-xi" };
    const ahead = { period: 6, gameweek: 6 };
    const filed = newsdesk(desk({ gameweek: 5, period: 5, pressers: [thu], lineups, ahead }), none, NOW);
    expect(filed.filter((a) => a.kind === "presser" || a.kind === "predicted-xi").map((a) => a.round)).toEqual([
      ahead,
      ahead,
    ]);
    // A round the calendar cannot place stamps nothing, and the story keeps today's.
    const unplaced = newsdesk(desk({ pressers: [thu], lineups }), none, NOW);
    expect(unplaced.some((a) => a.round !== undefined)).toBe(false);
  });
});

describe("Lawro's season predictions", () => {
  const season = { period: 6, gameweek: 6, locksAt: "2026-10-10T11:15:00.000Z" };

  it("is due once the draft is done, on any day before the season's first lock, beside the week's own columns", () => {
    const week = desk({ gameweek: 5, period: 5, finished: true, ties: [], next: { ...season }, season });
    expect(newsdesk(week, none, "2026-10-07T17:00:00.000Z").find((a) => a.kind === "season-predictions")).toEqual({
      kind: "season-predictions",
      key: "season-predictions:gw6",
      slug: "gw6-season-predictions",
      round: { period: 6, gameweek: 6 },
    });
    // The weekly column keeps its own evening: Thursday's firing has both.
    expect(newsdesk(week, none, "2026-10-08T17:30:00.000Z").map((a) => a.kind)).toEqual(["predictions", "season-predictions"]);
  });

  it("is not due before the draft is done, once filed, or from the first lock", () => {
    const week = desk({ gameweek: 5, period: 5, ties: [] });
    expect(newsdesk(week, none, "2026-10-07T17:00:00.000Z").map((a) => a.kind)).not.toContain("season-predictions");
    expect(newsdesk({ ...week, season }, (key) => key === "season-predictions:gw6", "2026-10-07T17:00:00.000Z")).toEqual([]);
    expect(newsdesk({ ...week, season }, none, "2026-10-10T11:15:00.000Z")).toEqual([]);
  });
});
