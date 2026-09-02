import { describe, expect, it } from "vitest";
import type { FootballPlayer, FootballSnapshot, PlayerMatchStats } from "../football/types";
import type { Bridge } from "../identity/bridge";
import { mapTeamRosters } from "../league/fantrax/rosters";
import type { RawTeamRosters } from "../league/fantrax/raw";
import type { PeriodRosters } from "../league/types";
import type { RosteredPlayer } from "./roster";
import { fullPlayerName, isResolved, resolveRosters, wasFielded } from "./roster";
import bridgeFixture from "./__fixtures__/bridge.json";
import footballPlayers from "./__fixtures__/footballPlayers.json";
import rehearsalRosters from "./__fixtures__/rehearsalRosters.json";

// The fixtures are the real thing, not a sketch: the rehearsal league's rosters
// as Fantrax returned them on 6 Aug 2026 (four teams, fifteen slots each, the
// whole draft), the sixty rows of `data/mappings/fantrax.json` those slots need,
// and the sixty FPL players they map to. A join that works on invented ids proves
// nothing — the failure this is guarding against is a real name that does not
// match.

const bridge = bridgeFixture as Bridge;
const players = footballPlayers as FootballPlayer[];
const rosters = mapTeamRosters(rehearsalRosters as RawTeamRosters);

const snap = (over: Partial<FootballSnapshot> = {}): FootballSnapshot => ({
  clubs: [],
  players,
  fixtures: [],
  stats: [],
  gameweek: 1,
  deadline: "2026-08-21T17:30:00Z",
  gameweeks: [1],
  fetchedAt: "2026-08-07T07:00:00Z",
  dataChecked: false,
  statsUnavailable: false,
  ...over,
});

const stat = (over: Partial<PlayerMatchStats> & { playerId: number }): PlayerMatchStats => ({
  fixtureId: 1, minutes: 90, goals: 0, assists: 0, cleanSheet: false, goalsConceded: 0,
  ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0, yellowCards: 0, redCards: 0,
  saves: 0, bonus: 0, bps: 0, defensiveContribution: 0, expectedGoals: 0,
  expectedAssists: 0, ...over,
});

/** One team, one slot — enough to name a single outcome without the other 59. */
const oneSlot = (fantraxId: string): PeriodRosters => ({
  period: 1,
  teams: [
    {
      teamId: "t1",
      teamName: "Test",
      slots: [{ fantraxId, position: "M", status: "ACTIVE" }],
    },
  ],
});

describe("resolveRosters, against the recorded draft", () => {
  const period = resolveRosters(snap(), rosters, bridge);
  const all = period.teams.flatMap((team) => team.players);

  it("puts a footballer behind every one of the sixty drafted slots", () => {
    expect(all).toHaveLength(60);
    expect(all.filter(isResolved)).toHaveLength(60);
  });

  it("resolves through the bridge to the right footballer", () => {
    const haaland = all.find((rostered) => rostered.slot.fantraxId === "061vq");
    expect(haaland && isResolved(haaland) && haaland.player.name).toBe("Haaland");
  });

  it("keeps Fantrax's slot as league truth beside FPL's player", () => {
    // Position and active/reserve are the commissioner's, not FPL's. They must
    // survive the join unchanged — a keeper filed as G stays G even though the
    // football layer has no opinion about position at all.
    const keeper = all.find((rostered) => rostered.slot.fantraxId === "02lz0");
    expect(keeper?.slot.position).toBe("G");
    expect(keeper?.slot.status).toBe("ACTIVE");
    expect(keeper && isResolved(keeper) && keeper.player.name).toBe("Martinez");
  });

  it("keeps each manager's fifteen with their team", () => {
    expect(period.teams.map((team) => team.teamName).sort()).toEqual([
      "123", "test2", "test3", "test4",
    ]);
    expect(period.teams.every((team) => team.players.length === 15)).toBe(true);
  });

  it("carries the period from the rosters, not the snapshot's gameweek", () => {
    // Periods are the league's numbering and gameweeks are FPL's. They agree
    // today; inferring one from the other is how they stop agreeing silently.
    expect(resolveRosters(snap({ gameweek: 9 }), rosters, bridge).period).toBe(1);
  });

  it("has no stats before a ball is kicked", () => {
    // FPL's live endpoint returns `{"elements": []}` until the first kickoff.
    // That is the normal state for most of the week, not an error.
    expect(all.every((rostered) => !isResolved(rostered) || rostered.stats.length === 0)).toBe(true);
  });
});

describe("resolveRosters, attaching stats", () => {
  it("gives a player only their own rows", () => {
    const haaland = players.find((p) => p.code === 223094);
    const palmer = players.find((p) => p.code === 244851);
    const snapshot = snap({
      stats: [
        stat({ playerId: haaland?.id ?? 0, goals: 2 }),
        stat({ playerId: palmer?.id ?? 0, assists: 1 }),
      ],
    });

    const [rostered] = resolveRosters(snapshot, oneSlot("061vq"), bridge).teams[0].players;
    expect(isResolved(rostered) && rostered.stats.map((s) => s.goals)).toEqual([2]);
  });

  it("keeps both halves of a double gameweek", () => {
    // Two fixtures, two rows. Summing them here would throw away the only
    // breakdown FPL publishes.
    const haaland = players.find((p) => p.code === 223094);
    const snapshot = snap({
      stats: [
        stat({ playerId: haaland?.id ?? 0, fixtureId: 1, goals: 1 }),
        stat({ playerId: haaland?.id ?? 0, fixtureId: 2, goals: 3 }),
      ],
    });

    const [rostered] = resolveRosters(snapshot, oneSlot("061vq"), bridge).teams[0].players;
    expect(isResolved(rostered) && rostered.stats.map((s) => s.goals)).toEqual([1, 3]);
  });
});

describe("resolveRosters, when a slot will not resolve", () => {
  it("keeps a player the bridge has never seen, and says so", () => {
    // Dropping him would render a fifteen-man squad as fourteen, with nothing on
    // screen to say a player is missing or why.
    const [rostered] = resolveRosters(snap(), oneSlot("99zzz"), bridge).teams[0].players;
    expect(isResolved(rostered)).toBe(false);
    expect(rostered).toMatchObject({ unresolved: "unbridged" });
    expect(rostered.slot.fantraxId).toBe("99zzz");
  });

  it("distinguishes an audited unmapped player from an unknown one", () => {
    // Fantrax carries academy players FPL has never listed. That is a settled,
    // correct answer, and conflating it with "we have not looked yet" would send
    // someone to re-run the bridge for a row it will never fill.
    const audited: Bridge = {
      "00aaa": { status: "unmapped", unmappedBy: "manual", auditedAt: "2026-08-06" },
    };
    const [rostered] = resolveRosters(snap(), oneSlot("00aaa"), audited).teams[0].players;
    expect(rostered).toMatchObject({ unresolved: "unmapped" });
  });

  it("says absent when the mapped code is not in this snapshot", () => {
    // A code that resolved in August and does not in January means FPL dropped
    // him — a stale snapshot, not a bad mapping.
    const [rostered] = resolveRosters(
      snap({ players: [] }),
      oneSlot("061vq"),
      bridge,
    ).teams[0].players;
    expect(rostered).toMatchObject({ unresolved: "absent" });
  });
});

describe("resolveRosters, before the league exists", () => {
  it("degrades to an empty period rather than throwing", () => {
    // What the real league returns until 10 Oct, and what every view must survive.
    expect(resolveRosters(snap(), { period: null, teams: [] }, bridge)).toEqual({
      period: null,
      teams: [],
    });
  });

  it("survives a team with no players drafted yet", () => {
    const undrafted: PeriodRosters = {
      period: null,
      teams: [{ teamId: "t1", teamName: "Test", slots: [] }],
    };
    expect(resolveRosters(snap(), undrafted, bridge).teams[0].players).toEqual([]);
  });
});

describe("wasFielded", () => {
  it("agrees only when the label and the round in view are the same period", () => {
    expect(wasFielded({ period: 1, teams: [] }, 1)).toBe(true);
    expect(wasFielded({ period: 2, teams: [] }, 1)).toBe(false);
  });

  // The ordinary between-rounds state, and the reason this has a name: Fantrax
  // rolls its label the moment a round's last fixture ends, so for most of the
  // week the arrangement on hand is next week's plan.
  it("is false when Fantrax would not say which period it handed us", () => {
    expect(wasFielded({ period: null, teams: [] }, 1)).toBe(false);
  });

  // Null on the right is a round the calendar does not cover. Two unknowns are
  // not a match — the one answer that must never come back true.
  it("is false when there is no round in view, even with no label either", () => {
    expect(wasFielded({ period: 3, teams: [] }, null)).toBe(false);
    expect(wasFielded({ period: null, teams: [] }, null)).toBe(false);
  });
});

// The name a list column shows, which is neither of FPL's two fields.
describe("fullPlayerName", () => {
  const man = (fullName: string, name: string): RosteredPlayer => ({
    slot: { fantraxId: "x", position: "M", status: "ACTIVE" },
    player: { ...players[0], fullName, name },
    stats: [],
  });

  it("joins the forename to the shirt name", () => {
    // Fantrax's own roster says "Matheus Cunha", and this arrives at it from
    // FPL's two fields — the pool carries their spelling and the ROSTER does
    // not, so it cannot simply be read.
    expect(fullPlayerName(man("Matheus Santos Carneiro da Cunha", "Cunha"))).toBe("Matheus Cunha");
    expect(fullPlayerName(man("Rodrigo Muniz Carvalho", "Muniz"))).toBe("Rodrigo Muniz");
  });

  it("leaves a name FPL has already disambiguated", () => {
    // A dot or a space in the shirt name means FPL is separating two players
    // who share a surname. Prefixing would give "Bruno B.Fernandes".
    expect(fullPlayerName(man("Bruno Borges Fernandes", "B.Fernandes"))).toBe("B.Fernandes");
    expect(fullPlayerName(man("Jair Paula da Cunha Filho", "Jair Cunha"))).toBe("Jair Cunha");
  });

  it("does not double a name when the accents differ", () => {
    // Yéremy Pino Santos, web_name "Yeremy" — FPL strips the accent from the
    // shirt name and the guard below compared the two exactly, so the forename
    // and the surname were the same word and the column read "Yéremy Yeremy".
    // One real case in the current pool, found by comparing every element.
    expect(fullPlayerName(man("Yéremy Pino Santos", "Yeremy"))).toBe("Yeremy");
  });

  it("still prefixes a forename when the accented name is genuinely different", () => {
    // The fold must not swallow a real surname: Hincapié's shirt name is his
    // surname unaccented, and he still wants his forename in a list column.
    expect(fullPlayerName(man("Piero Hincapié", "Hincapie"))).toBe("Piero Hincapie");
  });

  it("leaves a one-word player alone", () => {
    expect(fullPlayerName(man("Rodrigo 'Rodri' Hernandez Cascante", "Rodrigo"))).toBe("Rodrigo");
  });

  it("answers with the id when the bridge has not settled him", () => {
    expect(fullPlayerName({ slot: { fantraxId: "078wl", position: "G", status: "ACTIVE" }, unresolved: "unmapped" })).toBe("078wl");
  });
});
