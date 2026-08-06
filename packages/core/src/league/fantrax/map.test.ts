import { describe, expect, it } from "vitest";
import { mapLeagueInfo, mapPlayerPool, readingOrder } from "./map";
import type { RawLeagueInfo, RawPlayerPool } from "./raw";
import leagueInfo from "./__fixtures__/leagueInfo.json";
import leagueInfoDrafted from "./__fixtures__/leagueInfoDrafted.json";
import playerPool from "./__fixtures__/playerPool.json";

// Fixtures are trimmed subsets of live recordings — real entries, fewer of them.
// The pool subset was chosen to carry one of every shape the mapper has to
// survive.
//
// Two leagueInfo fixtures, because the two leagues genuinely differ: the real
// league (5 Aug) has `draftType` and no teams, the rehearsal league (6 Aug) has
// four teams, a full matchup schedule, and no `draftType` at all.

const pool = playerPool as RawPlayerPool;

describe("readingOrder", () => {
  it("flips the surname-first form Fantrax mostly uses", () => {
    expect(readingOrder("Cresswell, Alfie")).toBe("Alfie Cresswell");
  });

  it("leaves names that already read correctly alone", () => {
    // A large minority of the pool arrives like this. Flipping on word count
    // instead of on the comma would mangle every one of them.
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
    // NOT is Nott'm Forest to Fantrax and NFO to FPL. Translating is the identity
    // bridge's job; the mapper must not quietly do it here.
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

  it("degrades to empty rather than throwing on a stripped payload", () => {
    // Scraped data is untrusted; a shape change must not blank the page.
    const empty = mapLeagueInfo({});
    expect(empty.players).toEqual([]);
    expect(empty.scoringPeriods).toEqual([]);
    expect(empty.roster.maxActiveByPosition).toEqual({});
  });
});

describe("mapLeagueInfo, on a league that has drafted", () => {
  const info = mapLeagueInfo(leagueInfoDrafted as RawLeagueInfo);

  it("models an absent draftType as absent", () => {
    // The rehearsal league carries no `draftType` key at all while the real one
    // does. Defaulting to "" would report a draft type Fantrax never gave.
    expect(info.draftType).toBeNull();
  });

  it("reads the teams, keyed by the id every other payload uses", () => {
    expect(info.teams).toHaveLength(4);
    const team = info.teams.find((t) => t.teamId === "8enbgqo5msgb375j");
    expect(team?.name).toBe("123");
  });

  it("flattens matchups to one row per pairing per period", () => {
    // Two periods of two pairings each in the fixture. Flat means selecting a
    // period is a filter.
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
    // 15/11/5 here against 14/11/3 in the real league. Rendering both correctly
    // is the whole 10 Oct swap, tested continuously rather than on the day.
    expect(info.roster.maxTotalPlayers).toBe(15);
    expect(info.roster.maxReservePlayers).toBe(5);
  });
});
