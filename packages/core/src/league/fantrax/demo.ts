import payloads from "./demoPayloads.json";

// A ten-team league for building screens against: a source, not a mode, chosen by `FANTRAX_LEAGUE_ID` like any other.
// Provider-shaped payloads from real captures, so they pass through `map.ts` and nothing downstream knows.
// The id is no Fantrax id and there is no default, so it cannot be reached by accident.

const DEMO_LEAGUE_ID = "demo";

export function isDemo(leagueId: string): boolean {
  return leagueId === DEMO_LEAGUE_ID;
}

/** The canned fxea answer for a method, or null for one the demo lacks, which the client refuses (`DEMO_UNMAPPED`). */
export function demoFxea(method: string): unknown | null {
  switch (method) {
    case "getLeagueInfo":
      return payloads.leagueInfo;
    case "getTeamRosters":
      return payloads.rosters;
    case "getStandings":
      return payloads.standings;
    default:
      return null;
  }
}

/** The canned fxpa answer, or null. Its `getStandings` is the rendered page, not fxea's array: swapped, League fails. */
export function demoFxpa(method: string): unknown | null {
  switch (method) {
    case "getStandings":
      return payloads.standingsPage;
    default:
      return null;
  }
}
