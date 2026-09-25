import { describe, expect, it } from "vitest";
import { NO_SEASON } from "../football/noSeason";
import type { Fixture, FootballPlayer } from "../football/types";
import type { RosteredPlayer, RosteredTeam } from "./roster";
import { fixtureInvolvement, owners } from "./involvement";

const player = (id: number, name: string, clubId: number): FootballPlayer => ({
  id, code: 900 + id, name, fullName: name, clubId,
  status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null, season: NO_SEASON,
});

const holds = (...players: FootballPlayer[]): RosteredPlayer[] =>
  players.map((p) => ({
    slot: { fantraxId: `f${p.id}`, position: "M", status: "ACTIVE" },
    player: p,
    stats: [],
  }));

const team = (players: RosteredPlayer[]): RosteredTeam => ({
  teamId: "t1",
  teamName: "test1",
  players,
});

const match = (id: number, homeClubId: number, awayClubId: number): Fixture => ({
  id, code: id, gameweek: 6, homeClubId, awayClubId, kickoff: "2026-10-10T14:00:00Z",
  homeScore: null, awayScore: null, status: "upcoming", settled: false, minutes: 0,
  homeDifficulty: null, awayDifficulty: null,
});

const saka = player(1, "Saka", 1);
const gabriel = player(2, "Gabriel", 1);
const isak = player(3, "Isak", 2);

describe("fixtureInvolvement", () => {
  it("finds a manager's players at both ends of the same match", () => {
    const involved = fixtureInvolvement(team(holds(saka, isak)), [match(10, 1, 2)]);
    expect(involved.get(10)?.map((p) => p.name)).toEqual(["Isak", "Saka"]);
  });

  it("leaves a fixture with none of his players out of the map entirely", () => {
    // Absent rather than present-and-empty: the caller asks "is this one mine",
    // and an empty array is a yes-shaped answer that means no.
    const involved = fixtureInvolvement(team(holds(saka)), [match(10, 3, 4)]);
    expect(involved.has(10)).toBe(false);
    expect(involved.size).toBe(0);
  });

  it("skips a slot the bridge could not resolve", () => {
    // No footballer, so no club, so nothing to match a fixture on. The squad
    // screen is where an unresolved slot is explained; a fixture row is not.
    const squad = team([
      ...holds(saka),
      { slot: { fantraxId: "x", position: "M", status: "ACTIVE" }, unresolved: "unmapped" },
    ]);
    expect(fixtureInvolvement(squad, [match(10, 1, 2)]).get(10)?.map((p) => p.name)).toEqual([
      "Saka",
    ]);
  });

  it("marks both halves of a double gameweek", () => {
    const involved = fixtureInvolvement(team(holds(saka)), [match(10, 1, 2), match(11, 3, 1)]);
    expect([...involved.keys()]).toEqual([10, 11]);
    expect(involved.get(11)?.map((p) => p.name)).toEqual(["Saka"]);
  });

  it("orders names alphabetically, not by the order Fantrax listed them", () => {
    const involved = fixtureInvolvement(team(holds(saka, gabriel)), [match(10, 1, 2)]);
    expect(involved.get(10)?.map((p) => p.name)).toEqual(["Gabriel", "Saka"]);
  });

  it("has nothing to say about an empty squad or an empty round", () => {
    expect(fixtureInvolvement(team([]), [match(10, 1, 2)]).size).toBe(0);
    expect(fixtureInvolvement(team(holds(saka)), []).size).toBe(0);
  });
});

describe("owners", () => {
  it("names the squad holding each footballer, by his stable code", () => {
    const owned = owners([
      { ...team(holds(saka)), teamId: "t1", teamName: "test1" },
      { ...team(holds(isak)), teamId: "t2", teamName: "test2" },
    ]);
    expect(owned.get(saka.code)).toEqual({ teamId: "t1", teamName: "test1" });
    expect(owned.get(isak.code)).toEqual({ teamId: "t2", teamName: "test2" });
  });

  it("leaves an unowned footballer out, rather than owned by nobody", () => {
    // Most of the 697 are on no roster in this league, and a tag reading "—" on
    // every other scorer is noise where the honest answer is silence.
    expect(owners([team(holds(saka))]).has(gabriel.code)).toBe(false);
  });

  it("has nothing to say about a slot the bridge could not resolve", () => {
    const squad = team([
      { slot: { fantraxId: "x", position: "M", status: "ACTIVE" }, unresolved: "unbridged" },
    ]);
    expect(owners([squad]).size).toBe(0);
  });

  it("keeps the first team listed when a player somehow appears on two", () => {
    // Not a state Fantrax's rosters can hold; a half-completed trade could show
    // it for a moment. One answer either way, and an arbitrary one said out loud
    // beats a silent last-write-wins.
    const owned = owners([
      { teamId: "t1", teamName: "test1", players: holds(saka) },
      { teamId: "t2", teamName: "test2", players: holds(saka) },
    ]);
    expect(owned.get(saka.code)?.teamId).toBe("t1");
  });
});
