import { describe, expect, it } from "vitest";
import type { Fixture } from "../types";
import { cupIntel, cupName, tmlCupTies, seasonRun } from "./cups";
import type { CupTie, TmlRow } from "./cups";

const CITY = "manchester_city_26-27_team_302366";
const ARSENAL = "arsenal_26-27_team_420662";
const clubCodes = new Map([
  [CITY, 43],
  [ARSENAL, 3],
]);
const names = new Map([["external:paris_saint_germain", "Paris Saint-Germain"]]);

function row(over: Partial<TmlRow>): TmlRow {
  return {
    competition: "champions_league",
    team_id: CITY,
    opponent_team_id: "external:paris_saint_germain",
    opponent_name: null,
    is_home: true,
    neutral: false,
    status: "scheduled",
    kickoff_utc: "2026-10-14T19:00:00Z",
    goals_for: null,
    goals_against: null,
    ...over,
  };
}

describe("tmlCupTies", () => {
  it("files a tie to come under the club's FPL code, the opponent named by FotMob, with no score", () => {
    const { clubs, complaints } = tmlCupTies([row({})], { clubCodes, names });
    expect(clubs).toEqual({
      "43": [
        {
          competition: "champions_league",
          kickoff: "2026-10-14T19:00:00Z",
          home: true,
          neutral: false,
          opponentCode: null,
          opponentName: "Paris Saint-Germain",
          score: null,
        },
      ],
    });
    expect(complaints).toEqual([]);
  });

  it("gives a played tie the club's goals first", () => {
    const played = row({ status: "completed", is_home: false, goals_for: 2, goals_against: 0 });
    expect(tmlCupTies([played], { clubCodes, names }).clubs["43"][0].score).toEqual({ for: 2, against: 0 });
  });

  it("files a tie between two of FPL's clubs under both, each opponent by code", () => {
    const shield = { competition: "community_shield", neutral: true, status: "completed" };
    const { clubs } = tmlCupTies(
      [
        row({ ...shield, team_id: ARSENAL, opponent_team_id: CITY, goals_for: 3, goals_against: 0 }),
        row({ ...shield, team_id: CITY, opponent_team_id: ARSENAL, is_home: false, goals_for: 0, goals_against: 3 }),
      ],
      { clubCodes, names },
    );
    expect(clubs["3"][0]).toMatchObject({ opponentCode: 43, neutral: true, score: { for: 3, against: 0 } });
    expect(clubs["43"][0]).toMatchObject({ opponentCode: 3, home: false, score: { for: 0, against: 3 } });
  });

  it("leaves out the league, which is FPL's, and the other side's own row", () => {
    const { clubs, complaints } = tmlCupTies(
      [row({ competition: "premier_league" }), row({ team_id: "external:paris_saint_germain", opponent_team_id: CITY })],
      { clubCodes, names },
    );
    expect(clubs).toEqual({});
    expect(complaints).toEqual([]);
  });

  it("names the opponent from the log's own row where FotMob has none, and leaves him unnamed where neither has", () => {
    const { clubs } = tmlCupTies(
      [
        row({ opponent_team_id: "external:tromso_il", opponent_name: "Tromsø IL", kickoff_utc: "2026-08-20T17:00:00Z" }),
        row({ opponent_team_id: "external:viking" }),
      ],
      { clubCodes, names },
    );
    expect(clubs["43"].map((tie) => tie.opponentName)).toEqual(["Tromsø IL", null]);
  });

  it("skips a tie that is neither played nor to come, and keeps one in a competition it cannot name", () => {
    const { clubs, complaints } = tmlCupTies(
      [row({ status: "postponed" }), row({ competition: "intertoto_cup" })],
      { clubCodes, names },
    );
    expect(clubs["43"].map((tie) => tie.competition)).toEqual(["intertoto_cup"]);
    expect(complaints).toHaveLength(2);
  });

  it("runs each club's ties oldest first, an undated one last", () => {
    const { clubs } = tmlCupTies(
      [
        row({ kickoff_utc: null }),
        row({ kickoff_utc: "2026-11-04T20:00:00Z" }),
        row({ kickoff_utc: "2026-10-14T19:00:00Z" }),
      ],
      { clubCodes, names },
    );
    expect(clubs["43"].map((tie) => tie.kickoff)).toEqual(["2026-10-14T19:00:00Z", "2026-11-04T20:00:00Z", null]);
  });
});

const manifest = { season: "26-27", gameweek: null, exportedAt: "2026-10-06T09:00:00Z", rows: 1, sources: [] };
const tie: CupTie = {
  competition: "champions_league",
  kickoff: "2026-10-14T19:00:00Z",
  home: true,
  neutral: false,
  opponentCode: null,
  opponentName: "Paris Saint-Germain",
  score: null,
};

describe("cupIntel", () => {
  it("reads each club's ties by FPL code", () => {
    expect(cupIntel({ manifest, clubs: { "43": [tie] } }).get(43)).toEqual([tie]);
  });

  it("drops a tie it cannot read rather than guessing", () => {
    const broken = { ...tie, home: "yes" } as unknown as CupTie;
    const ties = cupIntel({ manifest, clubs: { "43": [tie, broken], "not-a-code": [tie] } });
    expect(ties.get(43)).toEqual([tie]);
    expect(ties.size).toBe(1);
    expect(cupIntel(null).size).toBe(0);
  });
});

describe("cupName", () => {
  it("says a competition the way a British reader does, and nothing for one it does not know", () => {
    expect(cupName("efl_cup")).toBe("League Cup");
    expect(cupName("champions_league")).toBe("Champions League");
    expect(cupName("intertoto_cup")).toBeNull();
  });
});

describe("seasonRun", () => {
  const fixture = (id: number, kickoff: string | null) => ({ id, kickoff }) as Fixture;

  it("sets the ties among the league's fixtures in the order the season runs, the undated last", () => {
    const run = seasonRun(
      [fixture(2, "2026-10-18T14:00:00Z"), fixture(3, null), fixture(1, "2026-10-10T14:00:00Z")],
      [tie, { ...tie, kickoff: null }],
    );
    expect(run.map((entry) => (entry.kind === "league" ? entry.fixture.id : entry.tie.kickoff))).toEqual([
      1,
      "2026-10-14T19:00:00Z",
      2,
      3,
      null,
    ]);
  });
});
