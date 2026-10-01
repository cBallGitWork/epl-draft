import { describe, expect, it } from "vitest";
import type { Club, FootballPlayer, FootballSnapshot, PlayerMatchStats, PlayerOwner } from "@epl/core";
import { gameweekLeaders } from "./leaders";

const CLUB = { id: 1, code: 3, name: "Arsenal", shortName: "ARS" } as Club;

function player(code: number, name: string): FootballPlayer {
  return { code, id: code * 10, name, clubId: CLUB.id } as FootballPlayer;
}

const SAKA = player(1, "Saka");
const RICE = player(2, "Rice");
const WHITE = player(3, "White");
const SNAPSHOT = { clubs: [CLUB], players: [SAKA, RICE, WHITE] } as FootballSnapshot;

function row(man: FootballPlayer, over: Partial<PlayerMatchStats>): PlayerMatchStats {
  return {
    playerId: man.id,
    fixtureId: 1,
    minutes: 90,
    expectedGoals: 0,
    expectedAssists: 0,
    defensiveContribution: 0,
    ...over,
  } as PlayerMatchStats;
}

const OWNERS = new Map<number, PlayerOwner>([
  [SAKA.code, { teamId: "t1", teamName: "Dave FC" }],
  [RICE.code, { teamId: "t2", teamName: "Mine United" }],
]);

function leaders(over: Partial<Parameters<typeof gameweekLeaders>[0]> = {}) {
  return gameweekLeaders({
    snapshot: SNAPSHOT,
    stats: [],
    priced: [],
    codeOf: (fantraxId) => Number(fantraxId.slice(1)),
    owners: OWNERS,
    mine: "t2",
    shown: 5,
    ...over,
  });
}

describe("gameweekLeaders", () => {
  it("reads a double gameweek's round figure once: FPL writes it on each of his rows", () => {
    const { xg } = leaders({
      stats: [row(SAKA, { expectedGoals: 0.75 }), row(SAKA, { fixtureId: 2, expectedGoals: 0.75 })],
    });
    expect(xg.map((l) => [l.player.name, l.value])).toEqual([["Saka", 0.75]]);
  });

  it("ranks high to low, names break a tie, and stops at the count shown", () => {
    const { xa } = leaders({
      stats: [row(WHITE, { expectedAssists: 0.2 }), row(SAKA, { expectedAssists: 0.5 }), row(RICE, { expectedAssists: 0.2 })],
      shown: 2,
    });
    expect(xa.map((l) => l.player.name)).toEqual(["Saka", "Rice"]);
  });

  it("leads on nobody who did not play or did not register", () => {
    const { defcon } = leaders({
      stats: [row(SAKA, { minutes: 0, defensiveContribution: 3 }), row(RICE, { defensiveContribution: 0 })],
    });
    expect(defcon).toEqual([]);
  });

  it("joins Fantrax's priced men through the bridge and drops one it cannot place", () => {
    const { points } = leaders({
      priced: [
        { fantraxId: "f1", points: 9 },
        { fantraxId: "f2", points: 14 },
        { fantraxId: "f99", points: 20 },
      ],
    });
    expect(points.map((l) => [l.player.name, l.value])).toEqual([
      ["Rice", 14],
      ["Saka", 9],
    ]);
  });

  it("says whose each man is, and which are the reader's", () => {
    const { points } = leaders({ priced: [{ fantraxId: "f2", points: 6 }, { fantraxId: "f3", points: 4 }] });
    expect(points.map((l) => [l.owner?.teamName ?? null, l.mine])).toEqual([
      ["Mine United", true],
      [null, false],
    ]);
  });

  it("carries the crest of his club", () => {
    const { xg } = leaders({ stats: [row(SAKA, { expectedGoals: 0.1 })] });
    expect(xg[0]?.crest).toContain("t3");
  });
});
