import { describe, expect, it } from "vitest";
import type { ProjectedPlayer } from "../../football/intel/projections";
import type { PlannerRow } from "../../football/intel/strength";
import { NO_SEASON } from "../../football/noSeason";
import type { Club, FootballPlayer } from "../../football/types";
import type { RosteredTeam } from "../../join/roster";
import { predictionSide } from "./sides";
import { squadMen, type SquadJoin } from "./squad";

const club = (id: number, code: number, name: string): Club => ({ id, code, name, shortName: name.slice(0, 3).toUpperCase() }) as Club;
const ARSENAL = club(1, 3, "Arsenal");
const LIVERPOOL = club(12, 14, "Liverpool");
const HULL = club(20, 99, "Hull");

const footballer = (code: number, name: string, clubId: number, over: Partial<FootballPlayer> = {}): FootballPlayer => ({
  id: code, code, name, fullName: name, clubId, status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null, season: NO_SEASON, ...over,
});

const MEN = [
  footballer(1, "Saka", 1),
  footballer(2, "Salah", 12, { status: "d", chanceOfPlaying: 50, news: "Knock" }),
  footballer(3, "Gabriel", 1),
  footballer(4, "Nobody", 20),
];

const team = (statuses: string[], positions: string[]): RosteredTeam => ({
  teamId: "cp",
  teamName: "Cold Palmer",
  players: MEN.map((player, at) => ({ slot: { fantraxId: `f${at}`, position: positions[at], status: statuses[at] }, player, stats: [] })),
});

const projection = (code: number, points: number): ProjectedPlayer => ({
  code, club: "", role: "", gameweeks: [7, 8].map((gw) => ({ gw, points, low: null, high: null, minutes: null, start: null, fixtures: 1, parts: null })),
});

const row = (clubOf: Club, opponent: Club, rank: number): PlannerRow => ({ club: clubOf, cells: [[{ opponent, home: true, rank }]], mean: rank });

const JOIN: SquadJoin = {
  eligible: new Map([["f0", ["F", "M"]], ["f1", ["M"]], ["f2", ["D"]], ["f3", ["G"]]]),
  projections: new Map([[1, projection(1, 6)], [2, projection(2, 7)], [3, projection(3, 4)]]),
  horizon: [7, 8],
  attack: new Map([[1, row(ARSENAL, HULL, 2)], [12, row(LIVERPOOL, HULL, 3)]]),
  defence: new Map([[1, row(ARSENAL, HULL, 1)], [20, row(HULL, ARSENAL, 18)]]),
  clubs: new Map([[1, ARSENAL], [12, LIVERPOOL], [20, HULL]]),
  clubName: (each) => each.name,
  // Hull's defence and attack are the worst of twenty; Arsenal's attack the best.
  standing: { attack: new Map([[3, 1], [14, 5], [99, 20]]), defence: new Map([[3, 2], [14, 8], [99, 20]]) },
  recent: new Map([[2, [{ gameweek: 5, minutes: 90, goals: 1, assists: 0, cleanSheets: 0, points: 8 }]]]),
};

describe("squadMen", () => {
  it("reads the squad the same whatever the manager has arranged", () => {
    const set = squadMen(team(["ACTIVE", "ACTIVE", "ACTIVE", "RESERVE"], ["F", "M", "D", "G"]), JOIN);
    const shuffled = squadMen(team(["RESERVE", "RESERVE", "ACTIVE", "ACTIVE"], ["M", "D", "G", "F"]), JOIN);
    // Line-ups are private until the lock: nothing a manager arranges may change what Lawro is told.
    expect(shuffled).toEqual(set);
  });

  it("joins each man's club, fixture, ease in his line's view, doubt and Liverpool", () => {
    const [saka, salah, gabriel, nobody] = squadMen(team(["ACTIVE", "ACTIVE", "ACTIVE", "RESERVE"], ["F", "M", "D", "G"]), JOIN);
    // Hull's is one of the softest defences, which is what a forward faces.
    expect(saka).toMatchObject({ club: "Arsenal", positions: ["F", "M"], horizon: 12, ease: 2, liverpool: false });
    expect(saka.fixtures).toEqual([{ opponent: "Hull", home: true, standing: "a soft defence" }]);
    expect(salah).toMatchObject({ liverpool: true, availability: { state: "doubt", chance: 50 }, recent: [{ gameweek: 5, goals: 1 }] });
    // A defender is read in the defence view, and faces Hull's attack, the weakest of all.
    expect(gabriel.ease).toBe(1);
    expect(gabriel.fixtures[0].standing).toBe("a weak attack");
    // No projection is no reading, which is not nought.
    expect(nobody).toMatchObject({ horizon: null, ease: 18 });
  });
});

describe("predictionSide", () => {
  const men = squadMen(team(["ACTIVE", "ACTIVE", "ACTIVE", "RESERVE"], ["F", "M", "D", "G"]), JOIN);
  const side = predictionSide({ teamId: "cp", name: "Cold Palmer", projected: 44, men, hardest: 20, arrivals: [], form: null, worn: new Set() });

  it("ranks the men who matter, and knows when the best of them is a doubt", () => {
    expect(side.keyMen.map((man) => man.name)).toEqual(["Salah", "Saka", "Gabriel"]);
    expect(side.best?.name).toBe("Salah");
    expect(side.bestManDoubt).toBe(true);
    expect(side.doubts.map((man) => man.name)).toEqual(["Salah"]);
    expect(side.kind?.name).toBe("Salah");
  });

  it("counts Liverpool men across the squad and reads the back line by eligibility", () => {
    expect(side.liverpool).toBe(1);
    expect(side.backLine.map((man) => man.name)).toEqual(["Gabriel", "Nobody"]);
    expect(side.backLineEase).toBe((1 + 18) / 2);
    expect(side.hard?.name).toBe("Nobody");
  });
});
