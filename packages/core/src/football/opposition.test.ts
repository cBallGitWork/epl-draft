import { describe, expect, it } from "vitest";
import type { Fixture, FootballSnapshot } from "./types";
import { kickedOff, oppositionByClub } from "./opposition";

const club = (id: number, shortName: string) => ({ id, code: id * 10, name: shortName, shortName });

const fixture = (over: Partial<Fixture> & { id: number }): Fixture => ({
  gameweek: 6, homeClubId: 1, awayClubId: 2, kickoff: "2026-10-10T14:00:00Z",
  homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
  homeDifficulty: 2, awayDifficulty: 4, ...over,
});

const snap = (fixtures: Fixture[]): FootballSnapshot => ({
  clubs: [club(1, "ARS"), club(2, "NEW"), club(3, "BRE"), club(4, "COV")],
  players: [],
  fixtures,
  stats: [],
  gameweek: 6,
  deadline: null,
  gameweeks: [6],
  fetchedAt: "2026-10-10T12:00:00Z",
  dataChecked: false,
  statsUnavailable: false,
});

describe("oppositionByClub", () => {
  it("gives each side the other, and says which of them is at home", () => {
    const by = oppositionByClub(snap([fixture({ id: 1, homeClubId: 1, awayClubId: 2 })]));

    expect(by.get(1)).toEqual([expect.objectContaining({ home: true })]);
    expect(by.get(1)?.[0]?.club.shortName).toBe("NEW");
    expect(by.get(2)).toEqual([expect.objectContaining({ home: false })]);
    expect(by.get(2)?.[0]?.club.shortName).toBe("ARS");
  });

  it("leaves a club with no match out entirely, rather than inventing an opponent", () => {
    const by = oppositionByClub(snap([fixture({ id: 1, homeClubId: 1, awayClubId: 2 })]));
    expect(by.get(3)).toBeUndefined();
  });

  it("carries both halves of a double, in the order they will be played", () => {
    const by = oppositionByClub(
      snap([
        fixture({ id: 1, homeClubId: 3, awayClubId: 1, kickoff: "2026-10-14T18:45:00Z" }),
        fixture({ id: 2, homeClubId: 1, awayClubId: 4, kickoff: "2026-10-10T14:00:00Z" }),
      ]),
    );

    expect(by.get(1)?.map((o) => `${o.club.shortName}${o.home ? "H" : "A"}`)).toEqual([
      "COVH",
      "BREA",
    ]);
  });

  it("puts an undated TV pick after the dated matches", () => {
    const by = oppositionByClub(
      snap([
        fixture({ id: 1, homeClubId: 1, awayClubId: 3, kickoff: null }),
        fixture({ id: 2, homeClubId: 1, awayClubId: 4, kickoff: "2026-10-10T14:00:00Z" }),
      ]),
    );

    expect(by.get(1)?.map((o) => o.club.shortName)).toEqual(["COV", "BRE"]);
  });

  it("skips a fixture naming a club the snapshot does not list", () => {
    const by = oppositionByClub(snap([fixture({ id: 1, homeClubId: 1, awayClubId: 99 })]));
    expect(by.get(1)).toBeUndefined();
    expect(by.get(99)?.[0]?.club.shortName).toBe("ARS");
  });
});

describe("difficulty", () => {
  it("carries FPL's rating for the club asked about, not the opponent's", () => {
    // The probe fixture is 2 at home, 4 away — both sides of one match, and a
    // view that took the wrong one would tell a manager an easy game is hard.
    const by = oppositionByClub(snap([fixture({ id: 1, homeClubId: 1, awayClubId: 2 })]));
    expect(by.get(1)?.[0]?.difficulty).toBe(2);
    expect(by.get(2)?.[0]?.difficulty).toBe(4);
  });

  it("is null when FPL published none, rather than an average nobody rated", () => {
    const by = oppositionByClub(
      snap([fixture({ id: 1, homeClubId: 1, awayClubId: 2, homeDifficulty: null, awayDifficulty: null })]),
    );
    expect(by.get(1)?.[0]?.difficulty).toBeNull();
  });
});

describe("kickedOff", () => {
  const against = (status: Fixture["status"]) =>
    oppositionByClub(snap([fixture({ id: 1, homeClubId: 1, awayClubId: 2, status })])).get(1);

  it("is false while his match is still to come", () => {
    expect(kickedOff(against("upcoming"))).toBe(false);
  });

  it("is true once his match is in play, and stays true once it is over", () => {
    expect(kickedOff(against("live"))).toBe(true);
    expect(kickedOff(against("finished"))).toBe(true);
  });

  it("is true for a substitute who never came on, because his match still went ahead", () => {
    // The distinction the stat line cannot make: FPL carries a zero row for him
    // and a zero row for a man whose fixture is on Monday, and only one of those
    // noughts is final. Offering this one a fixture chip would promise football
    // that has already been played.
    expect(kickedOff(against("finished"))).toBe(true);
  });

  it("is true on a double as soon as either match has started", () => {
    const both = oppositionByClub(
      snap([
        fixture({ id: 1, homeClubId: 1, awayClubId: 2, status: "finished" }),
        fixture({ id: 2, homeClubId: 3, awayClubId: 1, status: "upcoming" }),
      ]),
    ).get(1);
    expect(both).toHaveLength(2);
    expect(kickedOff(both)).toBe(true);
  });

  it("is false for a club with no match, and for a slot with no club", () => {
    // A blank gameweek and an unresolved roster slot arrive here the same way.
    expect(kickedOff(oppositionByClub(snap([])).get(1))).toBe(false);
    expect(kickedOff(undefined)).toBe(false);
  });
});
