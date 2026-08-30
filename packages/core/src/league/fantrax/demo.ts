import payloads from "./demoPayloads.json";

// A league with ten teams in it, for building screens against.
//
// The real league does not publish a team list until it drafts — `teamInfo` is
// an empty object on every capture — and the rehearsal league has four teams
// with five-character names. So every dense table in this app has been designed
// against four rows and the names "test2" and "123", which flatters a layout in
// exactly the way a ten-team league with real names will not.
//
// **This is a source, not a mode.** It is selected the same way any other league
// is, by `FANTRAX_LEAGUE_ID`, and the payloads are the provider's own shapes —
// so they flow through `map.ts` and the domain types untouched, and a screen
// built here is a screen built against the real thing. Nothing downstream knows.
//
// Generated once from real captures rather than invented: the roster limits are
// the REAL league's (14 total, 11 active, 3 reserve, D5 F3 G1 M5), the scoring
// system and the 38 periods are its own, and every player is a Fantrax id the
// bridge actually resolves, so portraits and fixtures land like any other page.
//
// **It cannot be reached by accident.** `FANTRAX_LEAGUE_ID` defaults to the
// rehearsal league, and the id below is not a Fantrax id — nothing on their
// side answers to it.

export const DEMO_LEAGUE_ID = "demo";

export function isDemo(leagueId: string): boolean {
  return leagueId === DEMO_LEAGUE_ID;
}

/** The canned answer for a method, or null to let the caller go to the network.
 *
 *  Null rather than a throw for anything unmapped: a demo league that answers
 *  the table and the squads but not, say, the transaction history should show
 *  the same empty state the real league shows before it has one — not a crash,
 *  and not an invented history. */
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

/** The internal surface. **`getStandings` means something different here** —
 *  fxea answers a flat array carrying `gamesBack`, fxpa answers the rendered
 *  standings page, and the mapper joins the two. One method name, two payloads,
 *  which is Fantrax's doing and not ours; returning the wrong one put an object
 *  where the mapper flatMaps an array and took the whole League tab down. */
export function demoFxpa(method: string): unknown | null {
  switch (method) {
    case "getStandings":
      return payloads.standingsPage;
    default:
      return null;
  }
}
