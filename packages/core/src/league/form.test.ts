import { describe, expect, it } from "vitest";
import { seasonForm } from "./form";
import { mapLeagueInfo } from "./fantrax/map";
import { mapSeasonResults } from "./fantrax/results";
import type { RawSchedulePage } from "./fantrax/results";
import { mapStandings } from "./fantrax/standings";
import type { RawLeagueInfo } from "./fantrax/raw";
import type { RawStandingsPage } from "./fantrax/standingsPage";
import type { LeagueMatchup, StandingsRow } from "./types";
import leagueInfoDrafted from "./fantrax/__fixtures__/leagueInfoDrafted.json";
import seasonResultsLive from "./fantrax/__fixtures__/seasonResultsLive.json";
import standingsPage from "./fantrax/__fixtures__/standingsPage.json";

// The rehearsal league on 29 Aug 2026, from the three payloads that meet here:
// the standings page, the season results, and the pairings on `getLeagueInfo`. Gameweek 1 is settled, gameweek 2 was in play as they were
// recorded, and gameweek 3 reads 0-0 for everybody because Fantrax's results
// table numbers rounds nobody has played.

const table = mapStandings(standingsPage as RawStandingsPage);
const { matchups } = mapLeagueInfo(leagueInfoDrafted as RawLeagueInfo);
const results = mapSeasonResults(seasonResultsLive as RawSchedulePage);

const TEST2 = "pbxm9fgimshcpazf";
const TEST4 = "sezrgvl2mshcpazf";

const formOf = (teamId: string, rows = table, ties: readonly LeagueMatchup[] = matchups) =>
  seasonForm(rows, ties, results).find((team) => team.teamId === teamId)?.run ?? [];

describe("seasonForm", () => {
  it("calls a round by the two totals Fantrax scored it with", () => {
    // Gameweek 1: test4 19, test2 41.
    expect(formOf(TEST2)).toEqual([
      { period: 1, result: "W", pointsFor: 41, pointsAgainst: 19 },
    ]);
    expect(formOf(TEST4)).toEqual([
      { period: 1, result: "L", pointsFor: 19, pointsAgainst: 41 },
    ]);
  });

  // The rule the recorded day exists to prove. Gameweek 2 has real totals on the
  // results table — test2 26, 123 16 — and Fantrax has not counted it, so it is
  // in nobody's form.
  it("stops where Fantrax's own record stops, so a round in play is not in it", () => {
    expect(results.some((row) => row.period === 2 && row.points === 26)).toBe(true);
    expect(formOf(TEST2).map((game) => game.period)).toEqual([1]);
  });

  // Gameweek 3 is 0-0 for every pairing because nobody has played it. Read as
  // scores those are draws, and every side would carry thirty-six of them.
  it("never reads an unplayed round's noughts as a goalless draw", () => {
    expect(results.some((row) => row.period === 3 && row.points === 0)).toBe(true);
    expect(formOf(TEST2).some((game) => game.result === "D")).toBe(false);
  });

  it("has no form for a league nobody has played in", () => {
    expect(seasonForm([], matchups, results)).toEqual([]);
    const unplayed = table.map((row) => ({ ...row, won: 0, drawn: 0, lost: 0 }));
    expect(seasonForm(unplayed, matchups, results).every((team) => team.run.length === 0)).toBe(true);
  });

  // The cross-check, and the reason it is worth the code. A record we cannot
  // reproduce means we have lined the season up wrongly, and five letters that
  // are nearly right are worse than a dash.
  it("gives no run at all when the letters disagree with Fantrax's record", () => {
    const wrong: StandingsRow[] = table.map((row) =>
      row.teamId === TEST2 ? { ...row, won: 0, lost: 1 } : row,
    );
    expect(formOf(TEST2, wrong)).toEqual([]);
    // And the other rows are untouched: one team we cannot vouch for does not
    // cost the rest of the table its form.
    expect(formOf(TEST4, wrong)).toHaveLength(1);
  });

  it("gives no run when the results read did not answer", () => {
    expect(seasonForm(table, matchups, []).every((team) => team.run.length === 0)).toBe(true);
  });

  it("skips a round the team is not in rather than counting it as one of theirs", () => {
    // A bye in period 1: the one settled game is then the period-2 fixture, and
    // the run must be that rather than a period the team has no side in.
    const bye: LeagueMatchup[] = matchups.filter((tie) => tie.period !== 1 || tie.homeTeamId !== TEST2);
    expect(formOf(TEST2, table, bye)).toEqual([
      { period: 2, result: "W", pointsFor: 26, pointsAgainst: 16 },
    ]);
  });

  it("reads a run in the order the rounds were played", () => {
    // Two settled games rather than one, which is gameweek 2 counted as well:
    // test2 won both, 41-19 and then 26-16.
    const twice = table.map((row) =>
      row.teamId === TEST2 ? { ...row, won: 2 } : { ...row, won: 0, drawn: 0, lost: 0 },
    );
    expect(formOf(TEST2, twice).map((game) => game.period)).toEqual([1, 2]);
    expect(formOf(TEST2, twice).map((game) => game.result)).toEqual(["W", "W"]);
  });
});
