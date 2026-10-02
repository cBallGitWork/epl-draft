import recorded from "../data/leagues/recorded.json";

// The leagues the archive records: data, read by scripts. The app serves one league, the
// environment's `FANTRAX_LEAGUE_ID`, and reads the `stats` and `scoring` roles from the file (`assistKinds.ts`, `scoring.ts`).

/** A league we capture. `key` is its directory under `data/snapshots/fantrax/leagues/`. */
export interface RecordedLeague {
  key: string;
  leagueId: string;
}

export const RECORDED_LEAGUES: readonly RecordedLeague[] = recorded.leagues;

/** Which recorded league shape-diff compares against which. */
export const SHAPE_DIFF = recorded.shapeDiff;

/** The league kept to track every category at no points, whose columns `npm run stats` reads. */
export const STATS_LEAGUE: RecordedLeague = recordedLeague(recorded.stats);

/** The league whose scoring prices every point we work out ourselves, whichever league is served. */
export const SCORING_LEAGUE: RecordedLeague = recordedLeague(recorded.scoring);

function recordedLeague(key: string): RecordedLeague {
  const found = RECORDED_LEAGUES.find((league) => league.key === key);
  if (found === undefined) throw new Error(`recorded.json names no league "${key}"`);
  return found;
}
