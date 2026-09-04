import { describe, expect, it } from "vitest";
import type { PlayerMatchStats } from "../../football/types";
import { buildMatchReportBrief, statLine } from "./matchReport";

const stats = (over: Partial<PlayerMatchStats> = {}): PlayerMatchStats => ({
  playerId: 1,
  fixtureId: 1,
  minutes: 90,
  goals: 0,
  assists: 0,
  cleanSheet: false,
  goalsConceded: 0,
  ownGoals: 0,
  penaltiesSaved: 0,
  penaltiesMissed: 0,
  yellowCards: 0,
  redCards: 0,
  saves: 0,
  bonus: 0,
  bps: 0,
  defensiveContribution: 0,
  expectedGoals: 0,
  expectedAssists: 0, fplPoints: 0, ...over,
});

describe("statLine", () => {
  it("puts minutes first so a cameo reads as one, and a blank reads as one", () => {
    expect(statLine(stats({ minutes: 7 }))).toBe("7 min");
    expect(statLine(stats({ goals: 2, assists: 1 }))).toBe("90 min, 2G, 1A");
  });

  it("never hands the writer FPL's bonus or BPS", () => {
    // This league plays under Fantrax's scoring and no other. "3 bonus" in a
    // brief is an invitation to write about points nobody here is paid.
    const line = statLine(stats({ goals: 1, bonus: 3, bps: 42 }));
    expect(line).not.toContain("bonus");
    expect(line).not.toContain("42");
  });

  it("prints a sending-off instead of the booking that came with it", () => {
    expect(statLine(stats({ yellowCards: 1, redCards: 1 }))).toContain("sent off");
    expect(statLine(stats({ yellowCards: 1, redCards: 1 }))).not.toContain("booked");
  });
});

describe("buildMatchReportBrief", () => {
  const brief = buildMatchReportBrief({
    gameweek: 3,
    home: "Arsenal",
    away: "Aston Villa",
    homeScore: 2,
    awayScore: 1,
    owners: [
      { owner: "test2", players: [{ name: "Saka", position: "M", stats: stats({ goals: 1 }), points: 8 }] },
    ],
    ties: [
      { homeName: "test2", awayName: "test3", homePoints: 41, awayPoints: 39, state: "open" },
    ],
    events: [],
    sides: null,
    threads: [],
  });

  it("hands the writer the score, the men by owner with Fantrax's points, and the ties as they stand", () => {
    expect(brief).toContain("Arsenal 2–1 Aston Villa");
    // The points are the ones his OWNER got, priced at the slot he was filed
    // in — the only points this league has.
    expect(brief).toContain("test2:\n- Saka (M): 90 min, 1G — 8 points");
    expect(brief).toContain("test2 41 v 39 test3, still open");
  });

  it("states the two rules at the point of temptation", () => {
    // You do not know how the football happened, and an open tie gets
    // consequence, never a verdict.
    // This used to pin the sentence "you do not know the order anything
    // happened", which the brief stated unconditionally. That WAS the defect: a
    // writer with no sequence can only enumerate, and the filed GW2 column duly
    // came out as a ledger. The rule is now conditional on the timeline, so the
    // test asserts the branch rather than the sentence.
    expect(brief).toContain("YOU DO NOT HAVE THE ORDER");
    expect(brief).toContain("never verdicts");
  });
});

describe("naming the match", () => {
  it("tells the writer the fixture and score belong in the deck", () => {
    // Craig, on the first run of these: "match reports, its hard to even tell
    // what match is being talked about." The brief has always carried the
    // fixture and the score; the voice forbade using them.
    const brief = buildMatchReportBrief({
      gameweek: 2,
      home: "Sunderland",
      away: "Everton",
      homeScore: 2,
      awayScore: 1,
      owners: [],
      ties: [],
      events: [],
      sides: null,
      threads: [],
    });
    expect(brief).toContain("Sunderland 2–1 Everton");
    expect(brief).toContain("GO IN THE DECK");
  });

  it("says the score may not be accounted for, because we cannot see every scorer", () => {
    // We have stat lines for ROSTERED men only. A goal in the score can belong
    // to a man nobody in the league owns, so "state it, never explain it" is the
    // honest instruction until `data/intel/matches/` exists.
    const brief = buildMatchReportBrief({
      gameweek: 2,
      home: "Sunderland",
      away: "Everton",
      homeScore: 2,
      awayScore: 1,
      owners: [{ owner: "Craig", players: [] }],
      ties: [],
      events: [],
      sides: null,
      threads: [],
    });
    expect(brief).toContain("never account for it");
  });
});

describe("buildMatchReportBrief — the football, in the order it happened", () => {
  const withTimeline = (over: Partial<Parameters<typeof buildMatchReportBrief>[0]> = {}) =>
    buildMatchReportBrief({
      gameweek: 2,
      home: "Sunderland",
      away: "Fulham",
      homeScore: 1,
      awayScore: 0,
      owners: [],
      ties: [],
      threads: [],
      events: [
        { minute: "26", kind: "goal", player: "Isidor", other: "Le Fée" },
        { minute: "67", kind: "substitution", player: "Reinildo", other: "Castagne" },
        { minute: "81", kind: "yellow-card", player: "Xhaka", other: null },
      ],
      sides: [
        { club: "Sunderland", possession: 42, shots: 8, onTarget: 3, corners: 4, fouls: 11 },
        { club: "Fulham", possession: 58, shots: 14, onTarget: 5, corners: 7, fouls: 9 },
      ],
      ...over,
    });

  it("gives the writer the minute, which is the whole fix", () => {
    // The filed GW2 column read "Isidor Twenty-Six, Fulham Nil" — a MINUTE set
    // in a scoreline's grammar, because the only figures beside the man were his
    // minutes and his points and nothing said which was which.
    const out = withTimeline();
    expect(out).toContain("26' GOAL Isidor, assisted by Le Fée");
    expect(out).toContain("A minute is a minute and never a score");
  });

  it("names the second man by what he did, which differs by event", () => {
    const out = withTimeline();
    expect(out).toContain("assisted by Le Fée");
    expect(out).toContain("Reinildo on, Castagne off");
    expect(out).toContain("Xhaka booked");
  });

  it("tells the writer it has NO order when the commentary could not be read", () => {
    // The instruction inverts with the data. A writer told it has a timeline it
    // has not got will invent one, which is the failure this replaced.
    const out = withTimeline({ events: [] });
    expect(out).toContain("YOU DO NOT HAVE THE ORDER");
    expect(out).not.toContain("HOW THE MATCH WENT");
  });

  it("carries a handful of figures and not a spreadsheet", () => {
    const out = withTimeline();
    expect(out).toContain("42% of the ball");
    expect(out).toContain("14 shots (5 on target)");
    // The provider publishes ~170 metrics a side. A writer handed all of them
    // writes the spreadsheet this is fixing, at higher resolution.
    expect(out).not.toContain("progressive_carries");
  });

  it("says nothing about the figures rather than printing noughts", () => {
    const out = withTimeline({ sides: null });
    expect(out).not.toContain("THE TWO SIDES");
    expect(out).not.toContain("0% of the ball");
  });
});
