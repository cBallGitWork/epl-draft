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
    // Match and draft reports, Bin XI, the Team Sheet, the elevens, the sheets and Lawro; nothing else.
    const ahead = { period: 4, gameweek: 4 };
    const full = desk({
      finished: true,
      ties: [{ homeTeamId: "a", awayTeamId: "b", state: "settled" }],
      reportDays: [{ key: "match-report:gw3:2026-09-26", slug: "gw3-prem-report-2026-09-26", day: "2026-09-26" }],
      draftReports: [{ key: "draft-report:gw3:gameweek", slug: "gw3-draft-report-gameweek", cutoff: "gameweek", day: "2026-09-28" }],
      pressers: ["2026-10-01"],
      lineups: { key: "predicted-xi:gw4", slug: "gw4-predicted-xi" },
      ahead,
      next: { ...ahead, locksAt: "2026-10-03T11:15:00.000Z" },
    });
    const kinds = new Set([
      ...newsdesk(full, none, "2026-09-29T08:15:00.000Z").map((a) => a.kind),
      ...newsdesk(full, none, "2026-10-01T17:00:00.000Z").map((a) => a.kind),
      ...newsdesk(full, none, "2026-10-02T15:00:00.000Z").map((a) => a.kind),
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
    // One woven report per London match-day; a stake alone earns nothing.
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
    // One draft report a week, at the end of the gameweek.
    const saturday = { key: "draft-report:gw3:saturday", slug: "gw3-draft-report-saturday", cutoff: "saturday" as const, day: "2026-08-29" };
    const gameweek = { key: "draft-report:gw3:gameweek", slug: "gw3-draft-report", cutoff: "gameweek" as const, day: "2026-08-31" };
    const filed = newsdesk(desk({ draftReports: [saturday, gameweek] }), none, NOW).filter((a) => a.kind === "draft-report");
    expect(filed).toEqual([{ kind: "draft-report", key: gameweek.key, slug: gameweek.slug, cutoff: "gameweek", day: "2026-08-31" }]);
    expect(newsdesk(desk({ draftReports: [gameweek] }), (key) => key === gameweek.key, NOW).some((a) => a.kind === "draft-report")).toBe(false);
  });

  describe("the Team Sheet", () => {
    // GW6 locks Sat 10 Oct at 12:15 London. Each conference day is its own column: Thursday's from 18:00 London, any
    // other day's from 16:30, once the Mac's 16:00 import has merged (Craig, 8 Oct 2026).
    const next = { period: 6, gameweek: 6, locksAt: "2026-10-10T11:15:00.000Z" };
    const thursday = (key: string) => key === "presser:gw6:2026-10-08";
    const sheet = (over: Partial<DeskState>, now: string, covered: (key: string) => boolean = none) =>
      newsdesk(desk({ pressers: ["2026-10-08", "2026-10-09"], next, ...over }), covered, now).filter((a) => a.kind === "presser");

    it("files Thursday's conferences on Thursday from 18:00 London, and Friday's on Friday from 16:30", () => {
      expect(sheet({}, "2026-10-08T15:30:00.000Z")).toEqual([]);
      expect(sheet({}, "2026-10-08T16:59:00.000Z")).toEqual([]);
      expect(sheet({}, "2026-10-08T17:00:00.000Z").map((a) => [a.key, a.slug, a.day])).toEqual([
        ["presser:gw6:2026-10-08", "gw6-presser-2026-10-08", "2026-10-08"],
      ]);
      // Friday's waits for the 16:00 import, not the 12:30 one.
      expect(sheet({}, "2026-10-09T15:29:00.000Z", thursday)).toEqual([]);
      expect(sheet({}, "2026-10-09T15:30:00.000Z", thursday).map((a) => a.key)).toEqual(["presser:gw6:2026-10-09"]);
    });

    it("catches up a missed day, and closes at the lock", () => {
      expect(sheet({}, "2026-10-10T08:15:00.000Z").map((a) => a.key)).toEqual(["presser:gw6:2026-10-08", "presser:gw6:2026-10-09"]);
      expect(sheet({}, next.locksAt)).toEqual([]);
    });

    it("files a midweek round's conferences the day they are held", () => {
      // GW13 locks Tue 1 Dec; Monday's conferences file from 16:30, which in winter is 16:30 UTC.
      const midweek = { period: 13, gameweek: 13, locksAt: "2026-12-01T19:15:00.000Z" };
      expect(sheet({ next: midweek, pressers: ["2026-11-30"] }, "2026-11-30T16:29:00.000Z")).toEqual([]);
      expect(sheet({ next: midweek, pressers: ["2026-11-30"] }, "2026-11-30T16:30:00.000Z").map((a) => a.key)).toEqual(["presser:gw13:2026-11-30"]);
    });

    it("files even while the last round is still 'finished'", () => {
      // `desk.finished` stays true for four or five days of seven, so a column gated on it would never fire.
      expect(sheet({ finished: true }, "2026-10-08T17:00:00.000Z")).toHaveLength(1);
    });

    it("files nothing without the round's press conferences or its lock", () => {
      expect(sheet({ pressers: [] }, "2026-10-09T16:00:00.000Z")).toEqual([]);
      expect(sheet({ next: null }, "2026-10-09T16:00:00.000Z")).toEqual([]);
    });
  });

  it("files Lawro on the Thursday evening before the round, about the round ahead", () => {
    // GW6 locks Sat 10 Oct at 12:15 London; the column is due from Thu 8 Oct, 20:00 London.
    const next = { period: 6, gameweek: 6, locksAt: "2026-10-10T11:15:00.000Z" };
    const lawro = newsdesk(desk({ gameweek: 5, period: 5, finished: true, next }), none, "2026-10-08T19:00:00.000Z");
    expect(lawro.find((a) => a.kind === "predictions")).toEqual({
      kind: "predictions",
      key: "predictions:gw6",
      slug: "gw6-predictions",
      round: { period: 6, gameweek: 6 },
    });
    // Not before eight, not while the last round is still being played, not twice.
    expect(newsdesk(desk({ finished: true, next }), none, "2026-10-08T18:59:00.000Z").map((a) => a.kind)).not.toContain("predictions");
    expect(newsdesk(desk({ finished: false, next }), none, "2026-10-08T19:00:00.000Z").map((a) => a.kind)).not.toContain("predictions");
    expect(newsdesk(desk({ finished: true, next }), (key) => key === "predictions:gw6", "2026-10-08T19:00:00.000Z").map((a) => a.kind)).not.toContain("predictions");
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

  describe("the elevens", () => {
    // GW6 locks Sat 10 Oct at 12:15 London; Friday's pressers end at 15:00, and the elevens follow at 16:00.
    const lineups = { key: "predicted-xi:gw6", slug: "gw6-predicted-xi" };
    const next = { period: 6, gameweek: 6, locksAt: "2026-10-10T11:15:00.000Z" };
    const elevens = (over: Partial<DeskState>, now: string, covered: (key: string) => boolean = none) =>
      newsdesk(desk({ lineups, next, ...over }), covered, now).filter((a) => a.kind === "predicted-xi");

    it("wait for Friday 16:00 London, after the press conferences, even when the export lands on Monday", () => {
      expect(elevens({}, "2026-10-05T21:30:00.000Z")).toEqual([]);
      expect(elevens({}, "2026-10-08T17:00:00.000Z")).toEqual([]);
      expect(elevens({}, "2026-10-09T14:59:00.000Z")).toEqual([]);
      expect(elevens({}, "2026-10-09T15:00:00.000Z").map((a) => a.slug)).toEqual([lineups.slug]);
    });

    it("catch up after a missed Friday, close at the lock, and never file twice", () => {
      expect(elevens({}, "2026-10-10T08:15:00.000Z").map((a) => a.slug)).toEqual([lineups.slug]);
      expect(elevens({}, next.locksAt)).toEqual([]);
      expect(elevens({}, "2026-10-09T16:00:00.000Z", (key) => key === lineups.key)).toEqual([]);
    });

    it("file the day before a midweek lock", () => {
      // GW13 locks Tue 1 Dec: Monday at 16:00, which in winter is 16:00 UTC.
      const midweek = { period: 13, gameweek: 13, locksAt: "2026-12-01T19:15:00.000Z" };
      expect(elevens({ next: midweek }, "2026-11-27T16:00:00.000Z")).toEqual([]);
      expect(elevens({ next: midweek }, "2026-11-30T16:00:00.000Z")).toHaveLength(1);
    });

    it("file nothing without the round ahead's export or its lock", () => {
      expect(elevens({ lineups: null }, "2026-10-09T16:00:00.000Z")).toEqual([]);
      expect(elevens({ next: null }, "2026-10-09T16:00:00.000Z")).toEqual([]);
    });
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
      pressers: ["2026-10-08"],
      lineups: { key: "predicted-xi:gw6", slug: "gw6-predicted-xi" },
      ahead,
      next: { ...ahead, locksAt: "2026-10-10T11:15:00.000Z" },
    });
    expect(newsdesk(unplayed, none, "2026-10-08T19:00:00.000Z").map((a) => a.key)).toEqual([
      "presser:gw6:2026-10-08",
      "predictions:gw6",
    ]);
    expect(newsdesk(unplayed, none, "2026-10-09T15:00:00.000Z").map((a) => a.key)).toContain("predicted-xi:gw6");
    // No Bin XI on the Tuesday for a round nobody played.
    expect(newsdesk(unplayed, none, "2026-10-06T08:15:00.000Z").map((a) => a.kind)).not.toContain("bin-xi");
  });

  it("stamps the Team Sheet and the elevens with the round they preview", () => {
    // Between gameweeks FPL's current one is the one just played, not the one previewed.
    const thu = ["2026-10-08"];
    const lineups = { key: "predicted-xi:gw6", slug: "gw6-predicted-xi" };
    const ahead = { period: 6, gameweek: 6 };
    const next = { ...ahead, locksAt: "2026-10-10T11:15:00.000Z" };
    const friday = "2026-10-09T15:00:00.000Z";
    const filed = newsdesk(desk({ gameweek: 5, period: 5, pressers: thu, lineups, ahead, next }), none, friday);
    expect(filed.filter((a) => a.kind === "presser" || a.kind === "predicted-xi").map((a) => a.round)).toEqual([
      ahead,
      ahead,
    ]);
    // A round the calendar cannot place stamps nothing, and the story keeps today's.
    const unplaced = newsdesk(desk({ pressers: thu, lineups, next }), none, friday);
    expect(unplaced.some((a) => a.round !== undefined)).toBe(false);
  });
});

describe("Lawro's season predictions", () => {
  const season = { period: 6, gameweek: 6, locksAt: "2026-10-10T11:15:00.000Z" };

  it("is due once the draft is done, on any day before the season's first lock, beside the week's own columns", () => {
    const week = desk({ gameweek: 5, period: 5, finished: true, ties: [], next: { ...season }, season });
    expect(newsdesk(week, none, "2026-10-07T17:00:00.000Z").find((a) => a.kind === "season-rankings")).toEqual({
      kind: "season-rankings",
      key: "season-rankings:gw6",
      slug: "gw6-season-rankings",
      round: { period: 6, gameweek: 6 },
    });
    // The weekly column keeps its own evening: Thursday's firing has both.
    expect(newsdesk(week, none, "2026-10-08T19:30:00.000Z").map((a) => a.kind)).toEqual(["predictions", "season-rankings"]);
  });

  it("is not due before the draft is done, once filed, or from the first lock", () => {
    const week = desk({ gameweek: 5, period: 5, ties: [] });
    expect(newsdesk(week, none, "2026-10-07T17:00:00.000Z").map((a) => a.kind)).not.toContain("season-rankings");
    expect(newsdesk({ ...week, season }, (key) => key === "season-rankings:gw6", "2026-10-07T17:00:00.000Z")).toEqual([]);
    expect(newsdesk({ ...week, season }, none, "2026-10-10T11:15:00.000Z")).toEqual([]);
  });
});
