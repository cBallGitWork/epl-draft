import { describe, expect, it } from "vitest";
import { categoryPoints } from "../scoring";
import { mapLeagueInfo, mapPlayerPool, readingOrder } from "./map";
import type { RawLeagueInfo, RawPlayerPool } from "./raw";
import leagueInfo from "./__fixtures__/leagueInfo.json";
import leagueInfoDrafted from "./__fixtures__/leagueInfoDrafted.json";
import playerPool from "./__fixtures__/playerPool.json";

// Trimmed live recordings carrying every shape the mapper must survive. Two leagueInfo fixtures, as the leagues differ:
// the real one has `draftType` and no teams, the rehearsal one four teams, a matchup schedule and no `draftType`.

const pool = playerPool as RawPlayerPool;

describe("readingOrder", () => {
  it("flips the surname-first form Fantrax mostly uses", () => {
    expect(readingOrder("Cresswell, Alfie")).toBe("Alfie Cresswell");
  });

  it("leaves names that already read correctly alone", () => {
    // A large minority of the pool arrives like this; flipping on word count would mangle them.
    expect(readingOrder("Gabriel Jesus")).toBe("Gabriel Jesus");
    expect(readingOrder("Dario Essugo")).toBe("Dario Essugo");
  });

  it("survives a name with no first name at all", () => {
    expect(readingOrder("Ronaldo")).toBe("Ronaldo");
    expect(readingOrder("")).toBe("");
  });
});

describe("mapPlayerPool", () => {
  it("drops the synthetic team entities", () => {
    const teamEntities = Object.values(pool).filter((entry) => entry.fantraxId.includes("#"));
    expect(teamEntities.length).toBeGreaterThan(0); // the fixture must actually test this

    const players = mapPlayerPool(pool);
    expect(players).toHaveLength(Object.keys(pool).length - teamEntities.length);
    expect(players.every((player) => !player.fantraxId.includes("#"))).toBe(true);
    expect(players.some((player) => player.displayName.startsWith("Team"))).toBe(false);
  });

  it("keeps the raw name beside the display name, for bridge audits", () => {
    const wood = mapPlayerPool(pool).find((player) => player.fantraxId === "02m5b");
    expect(wood?.rawName).toBe("Wood, Chris");
    expect(wood?.displayName).toBe("Chris Wood");
  });

  it("models a missing rotowireId as absent rather than zero", () => {
    const players = mapPlayerPool(pool);
    const withoutRotowire = players.find((player) => player.fantraxId === "075zi");
    const withRotowire = players.find((player) => player.fantraxId === "02m5b");
    expect(withoutRotowire?.rotowireId).toBeNull();
    expect(typeof withRotowire?.rotowireId).toBe("number");
  });

  it("carries Fantrax's own club code through unchanged", () => {
    // NOT is Nott'm Forest to Fantrax and NFO to FPL: the identity bridge translates, never the mapper.
    const forest = mapPlayerPool(pool).find((player) => player.fantraxId === "02m5b");
    expect(forest?.clubCode).toBe("NOT");
  });
});

describe("mapLeagueInfo", () => {
  const info = mapLeagueInfo(leagueInfo as RawLeagueInfo);

  it("reads the competition's configuration", () => {
    expect(info.name).toBe("Tim Hortons Pro League 24/25");
    expect(info.seasonYear).toBe(2026);
    expect(info.draftType).toBe("snake");
    expect(info.startDate).toBe("2026-08-21");
  });

  it("reads the roster limits the commissioner set", () => {
    expect(info.roster.maxTotalPlayers).toBe(14);
    expect(info.roster.maxActivePlayers).toBe(11);
    expect(info.roster.maxReservePlayers).toBe(3);
    expect(info.roster.maxActiveByPosition).toEqual({ G: 1, D: 5, M: 5, F: 3 });
  });

  it("splits multi-position eligibility into a list", () => {
    // "F,M" is common and is why position can never be a scalar join key.
    const multi = info.players.find((player) => player.eligiblePositions.length > 1);
    expect(multi).toBeDefined();
    expect(multi?.eligiblePositions).toEqual(expect.arrayContaining(["F", "M"]));
  });

  it("keeps single positions as a one-element list", () => {
    const single = info.players.find((player) => player.fantraxId === "075zi");
    expect(single?.eligiblePositions).toEqual(["M"]);
    expect(single?.status).toBe("WW");
  });

  it("orders scoring periods by number", () => {
    const numbers = info.scoringPeriods.map((period) => period.number);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(info.scoringPeriods[0]?.start).toContain("2026-08-21");
  });

  it("has no teams or matchups before anyone joins", () => {
    expect(info.teams).toEqual([]);
    expect(info.matchups).toEqual([]);
  });

  it("carries the roster calendar separately from the scoring one", () => {
    // Two calendars, never rounded together: the ends differ by a second, and the lineup gate reads the roster one.
    expect(info.rosterPeriods).toHaveLength(info.scoringPeriods.length);
    expect(info.rosterPeriods[0]?.start).toBe(info.scoringPeriods[0]?.start);
    expect(info.rosterPeriods[0]?.end).not.toBe(info.scoringPeriods[0]?.end);
    expect(info.rosterPeriods[0]?.end).toContain("14:59:58");
    expect(info.scoringPeriods[0]?.end).toContain("14:59:59");
  });

  it("degrades to empty rather than throwing on a stripped payload", () => {
    // Scraped data is untrusted; a shape change must not blank the page.
    const empty = mapLeagueInfo({});
    expect(empty.players).toEqual([]);
    expect(empty.scoringPeriods).toEqual([]);
    expect(empty.rosterPeriods).toEqual([]);
    expect(empty.roster.maxActiveByPosition).toEqual({});
  });

  it("keeps a player whose entry arrives null, with no positions and no status", () => {
    expect(mapLeagueInfo({ playerInfo: { x: null } }).players).toEqual([{ fantraxId: "x", eligiblePositions: [], status: "" }]);
  });
});

describe("mapLeagueInfo, on a league that has drafted", () => {
  const info = mapLeagueInfo(leagueInfoDrafted as RawLeagueInfo);

  it("carries the scoring rules through from getLeagueInfo", () => {
    // The only production path to `LeagueInfo.scoring`, reached from the payload a route actually fetches.
    expect(info.scoring).not.toBeNull();
    expect(categoryPoints(info.scoring!, "CS", "D")).toBe(4);
  });

  it("says nothing about scoring when a league describes none", () => {
    expect(mapLeagueInfo({}).scoring).toBeNull();
  });

  it("models an absent draftType as absent", () => {
    // The rehearsal league has no `draftType` key; "" would report a draft type Fantrax never gave.
    expect(info.draftType).toBeNull();
  });

  it("models an absent roster calendar as absent", () => {
    // The trim took `rosterPeriods`; with `scoringPeriods` present, this proves the mapper never falls back to them,
    // so the gate fails safe to squad-only rather than gating on the wrong deadline.
    expect(info.rosterPeriods).toEqual([]);
    expect(info.scoringPeriods.length).toBeGreaterThan(0);
  });

  it("reads the teams, keyed by the id every other payload uses", () => {
    expect(info.teams).toHaveLength(4);
    const team = info.teams.find((t) => t.teamId === "8enbgqo5msgb375j");
    expect(team?.name).toBe("123");
  });

  it("flattens matchups to one row per pairing per period", () => {
    // Two periods of two pairings each in the fixture.
    expect(info.matchups).toHaveLength(4);
    expect(info.matchups.filter((m) => m.period === 1)).toHaveLength(2);
  });

  it("carries team ids in matchups, not a second copy of the names", () => {
    const first = info.matchups.find((m) => m.period === 1);
    expect(first?.homeTeamId).toMatch(/^\w+$/);
    expect(first).not.toHaveProperty("homeTeamName");
    const ids = new Set(info.teams.map((team) => team.teamId));
    expect(info.matchups.every((m) => ids.has(m.homeTeamId) && ids.has(m.awayTeamId))).toBe(true);
  });

  it("reads this league's own roster limits, which differ from the other's", () => {
    // 15/11/5 here against 14/11/3 in the real league: both must render.
    expect(info.roster.maxTotalPlayers).toBe(15);
    expect(info.roster.maxReservePlayers).toBe(5);
  });
});

describe("mapLeagueInfo, the playoff", () => {
  // Both shapes are live: the real league answers `used: true` (top four, from period 35), the rehearsal `used: false`.
  it("reads the league's own cut", () => {
    const info = mapLeagueInfo({
      playoffs: {
        used: true,
        numPlayoffTeams: 4,
        firstPlayoffPeriod: 35,
        lastRegularSeasonPeriod: 34,
        mergePlayoffPeriods: false,
      },
    });
    expect(info.playoffs).toEqual({ places: 4 });
  });

  it("treats a league that runs no playoff as having none", () => {
    // `used: false` is an answer: a table with no cut draws no line.
    expect(mapLeagueInfo({ playoffs: { used: false } }).playoffs).toBeNull();
    expect(mapLeagueInfo({}).playoffs).toBeNull();
  });

  it("needs the one number the table actually draws", () => {
    // A playoff of unstated size draws no line; the unread periods must not veto a size that IS stated.
    expect(
      mapLeagueInfo({ playoffs: { used: true, firstPlayoffPeriod: 35 } }).playoffs,
    ).toBeNull();
    expect(
      mapLeagueInfo({ playoffs: { used: true, numPlayoffTeams: 4 } }).playoffs,
    ).toEqual({ places: 4 });
  });
});
