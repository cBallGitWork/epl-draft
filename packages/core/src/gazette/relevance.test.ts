import { describe, expect, it } from "vitest";
import { NO_SEASON } from "../football/noSeason";
import { bothSides, fixtureStakes } from "./relevance";
import type { Club, Fixture, FootballPlayer } from "../football/types";
import type { RosteredTeam } from "../join/roster";
import type { PeriodPairing } from "../league/selectors";

const player = (clubId: number, code: number): FootballPlayer => ({
  id: code,
  code,
  name: `P${code}`,
  fullName: `Player ${code}`,
  clubId,
  status: "a",
  news: "",
  chanceOfPlaying: null,
  optaCode: null, season: NO_SEASON,
});

const rostered = (teamId: string, men: { clubId: number; code: number; status?: string }[]): RosteredTeam => ({
  teamId,
  teamName: teamId,
  players: men.map((man) => ({
    slot: { fantraxId: `fx${man.code}`, position: "M", status: man.status ?? "ACTIVE" },
    player: player(man.clubId, man.code),
    stats: [],
  })),
});

const fixture = (id: number, homeClubId: number, awayClubId: number, over: Partial<Fixture> = {}): Fixture => ({
  id,
  gameweek: 3,
  homeClubId,
  awayClubId,
  kickoff: "2026-08-29T14:00:00.000Z",
  homeScore: null,
  awayScore: null,
  status: "upcoming",
  settled: false,
  minutes: 0,
  homeDifficulty: null,
  awayDifficulty: null,
  ...over,
});

const club = (id: number, code: number, shortName: string): Club => ({
  id,
  code,
  name: shortName,
  shortName,
});

const pairing = (home: string, away: string): PeriodPairing => ({
  home: { teamId: home, name: home },
  away: { teamId: away, name: away },
});

const CLUBS = new Map([
  [1, club(1, 3, "ARS")],
  [2, club(2, 7, "AVL")],
  [3, club(3, 8, "CHE")],
]);

describe("fixtureStakes", () => {
  it("keys a fixture by club codes, never by its per-season id", () => {
    const [stake] = fixtureStakes([fixture(999, 1, 2)], [], [], CLUBS);
    expect(stake.key).toBe("3v7");
    expect(stake.fixtureId).toBe(999);
  });

  it("counts only ACTIVE resolved men, per pairing side", () => {
    const teams = [
      rostered("a", [{ clubId: 1, code: 10 }, { clubId: 1, code: 11, status: "RESERVE" }]),
      rostered("b", [{ clubId: 2, code: 12 }]),
      rostered("c", [{ clubId: 3, code: 13 }]),
    ];
    const [stake] = fixtureStakes([fixture(1, 1, 2)], teams, [pairing("a", "b"), pairing("c", "d")], CLUBS);
    // The reserve does not count: he cannot score, so he carries no stake.
    expect(stake.men).toBe(2);
    expect(stake.ties).toEqual([{ homeTeamId: "a", awayTeamId: "b", homeMen: 1, awayMen: 1 }]);
    expect(bothSides(stake.ties[0])).toBe(true);
  });

  it("ranks a tie-critical fixture over raw headcount", () => {
    const teams = [
      rostered("a", [{ clubId: 1, code: 10 }]),
      rostered("b", [{ clubId: 2, code: 12 }]),
      // Five men in the other fixture, all one manager's: a rooting interest.
      rostered("c", [3, 4, 5, 6, 7].map((code) => ({ clubId: 3, code }))),
    ];
    const stakes = fixtureStakes(
      [fixture(1, 3, 4), fixture(2, 1, 2)],
      teams,
      [pairing("a", "b")],
      CLUBS,
    );
    // Two men against five — but they stand either side of a live tie, and
    // the fixture that can decide a head-to-head on its own leads.
    expect(stakes[0].fixtureId).toBe(2);
  });
});
