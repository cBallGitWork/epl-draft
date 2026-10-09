import { recordedRole } from "@epl/core";
import recorded from "../data/leagues/recorded.json";

// The leagues the archive records: data, read by scripts. The app serves one league, the
// environment's `FANTRAX_LEAGUE_ID`, and reads the `stats` and `scoring` roles from the file (`statsLeague.ts`, `scoring.ts`).

/** A league we capture. `key` is its directory under `data/snapshots/fantrax/leagues/`. */
export interface RecordedLeague {
  key: string;
  leagueId: string;
}

export const RECORDED_LEAGUES: readonly RecordedLeague[] = recorded.leagues;

/** Which recorded league shape-diff compares against which. */
export const SHAPE_DIFF = recorded.shapeDiff;

/** The league kept to track every category at no points, whose columns `npm run stats` reads. */
export const STATS_LEAGUE: RecordedLeague = recordedLeague("stats");

/** The league whose scoring prices every point we work out ourselves, whichever league is served. */
export const SCORING_LEAGUE: RecordedLeague = recordedLeague("scoring");

function recordedLeague(role: "stats" | "scoring"): RecordedLeague {
  const leagueId = recordedRole(recorded, role);
  if (leagueId === null) throw new Error(`recorded.json names no league "${recorded[role]}"`);
  return { key: recorded[role], leagueId };
}
