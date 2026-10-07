import { describe, expect, it } from "vitest";
import type { Club, FootballPlayer, FootballSnapshot, MatchEvent, RoundBreak } from "@epl/core";
import { isBreak, wireLines } from "./wireLines";

// The break row and its ordering. Half time was here for an evening and went
// (Craig, 5 Sep 2026: "ditch the HT") — on a Saturday teatime it landed directly
// under the full time for the same match with the same scoreline, spending two of
// the rows the fold pays for on one fact. The derivation that fed it went with
// it, which is why nothing here counts goals any more.

const HOME = 1;
const AWAY = 2;
const FIXTURE = 2645221;

function club(id: number, short: string): Club {
  return { id, code: id, name: `${short} Town`, shortName: short } as Club;
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

const FULL_TIME: RoundBreak = {
  fixtureCode: FIXTURE,
  kind: "full-time",
  seconds: 5760,
  absolute: 5_760_000,
};

function breakRow(events: MatchEvent[], breaks: RoundBreak[], players: FootballPlayer[]) {
  const rows = wireLines(events, breaks, snapshot(players), undefined, null).lines.filter(isBreak);
  return rows.map((row) => row.sides.map((side) => `${side.name} ${side.score}`).join(" v "));
}

describe("wireLines breaks", () => {
  it("takes the full-time score from the fixture, not from the goals", () => {
    // The club in full, which is what a break line has the width for.
    expect(breakRow([], [FULL_TIME], [])).toEqual(["HOM Town 3 v AWY Town 1"]);
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
    const rows = wireLines(events, [FULL_TIME], snapshot(players), undefined, null);
    expect(rows.lines.map((row) => (isBreak(row) ? row.kind : row.minute))).toEqual([
      "full-time",
      "80",
      "12",
    ]);
  });
});

describe("wireLines minutes", () => {
  it("prints a minute as football does, without the clock's leading nought", () => {
    const events = [
      goal({ minute: "90", code: 10, absolute: 3 }),
      goal({ minute: "45+2", code: 10, absolute: 2 }),
      goal({ minute: "09", code: 10, absolute: 1 }),
    ];
    const rows = wireLines(events, [], snapshot([player(10, HOME)]), undefined, null).lines;
    expect(rows.map((row) => (isBreak(row) ? row.kind : row.minute))).toEqual(["90", "45+2", "9"]);
  });
});
