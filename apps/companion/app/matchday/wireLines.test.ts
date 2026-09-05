import { describe, expect, it } from "vitest";
import type { Club, FootballPlayer, FootballSnapshot, MatchEvent, RoundBreak } from "@epl/core";
import { isBreak, wireLines } from "./wireLines";

// The half-time score is the only derived number on this screen, and it is
// derived because the Premier League's round read does not publish one — 0 of 10
// counted 5 Sep 2026, the completed fixtures included. What it is derived FROM is
// the goals already on the wire, so these cases are the arithmetic of that.

const HOME = 1;
const AWAY = 2;
const FIXTURE = 2645221;

function club(id: number, short: string): Club {
  return { id, code: id, name: short, shortName: short } as Club;
}

function player(code: number, clubId: number): FootballPlayer {
  return { code, id: code, name: `P${code}`, clubId, optaCode: null } as FootballPlayer;
}

function snapshot(players: FootballPlayer[]): FootballSnapshot {
  return {
    clubs: [club(HOME, "HOM"), club(AWAY, "AWY")],
    players,
    fixtures: [
      {
        id: 1,
        code: FIXTURE,
        homeClubId: HOME,
        awayClubId: AWAY,
        homeScore: 3,
        awayScore: 1,
      },
    ],
  } as FootballSnapshot;
}

function goal(over: Partial<MatchEvent> & { minute: string; code: number }): MatchEvent {
  return {
    id: Number(over.minute.split("+")[0]),
    fixtureCode: FIXTURE,
    kind: "goal",
    seconds: 0,
    absolute: 0,
    text: "",
    players: [over.code, null],
    ...over,
  } as MatchEvent;
}

const HALF_TIME: RoundBreak = {
  fixtureCode: FIXTURE,
  kind: "half-time",
  seconds: 2700,
  absolute: 2_700_000,
};

const FULL_TIME: RoundBreak = {
  fixtureCode: FIXTURE,
  kind: "full-time",
  seconds: 5760,
  absolute: 5_760_000,
};

function breakRow(events: MatchEvent[], breaks: RoundBreak[], players: FootballPlayer[]) {
  const rows = wireLines(events, breaks, snapshot(players), undefined, null).lines.filter(isBreak);
  return rows.map((row) => row.sides.map((side) => `${side.short} ${side.score}`).join(" v "));
}

describe("wireLines breaks", () => {
  it("takes the full-time score from the fixture, not from the goals", () => {
    expect(breakRow([], [FULL_TIME], [])).toEqual(["HOM 3 v AWY 1"]);
  });

  it("counts the half-time score off the goals of the first half", () => {
    const players = [player(10, HOME), player(20, AWAY)];
    const events = [
      goal({ minute: "12", code: 10 }),
      goal({ minute: "40", code: 20 }),
      goal({ minute: "63", code: 10 }),
    ];
    expect(breakRow(events, [HALF_TIME], players)).toEqual(["HOM 1 v AWY 1"]);
  });

  // The label is the football clock, so a goal in first-half stoppage reads
  // "45+3" and parses to 45. The feed's own seconds cannot be used for this:
  // the second half restarts at 2,700, so a 46th-minute goal reads LOWER.
  it("counts a goal in first-half stoppage time as a first-half goal", () => {
    const players = [player(10, HOME)];
    expect(breakRow([goal({ minute: "45+3", code: 10 })], [HALF_TIME], players)).toEqual([
      "HOM 1 v AWY 0",
    ]);
  });

  it("credits an own goal to the side the scorer does not play for", () => {
    const players = [player(10, HOME)];
    const own = goal({ minute: "20", code: 10, kind: "own-goal" });
    expect(breakRow([own], [HALF_TIME], players)).toEqual(["HOM 0 v AWY 1"]);
  });

  it("does not count another match's goals", () => {
    const players = [player(10, HOME)];
    const elsewhere = goal({ minute: "20", code: 10, fixtureCode: 999 });
    expect(breakRow([elsewhere], [HALF_TIME], players)).toEqual(["HOM 0 v AWY 0"]);
  });

  it("drops a break whose fixture the snapshot does not carry", () => {
    const stray: RoundBreak = { ...FULL_TIME, fixtureCode: 999 };
    expect(breakRow([], [stray], [])).toEqual([]);
  });

  it("orders the whole wire newest first, breaks among the goals", () => {
    const players = [player(10, HOME)];
    const events = [
      goal({ minute: "12", code: 10, absolute: 720_000 }),
      goal({ minute: "80", code: 10, absolute: 4_800_000 }),
    ];
    const rows = wireLines(events, [HALF_TIME, FULL_TIME], snapshot(players), undefined, null);
    expect(rows.lines.map((row) => (isBreak(row) ? row.kind : row.minute))).toEqual([
      "full-time",
      "80",
      "half-time",
      "12",
    ]);
  });
});
