import recorded from "../data/leagues/recorded.json";

// The leagues the archive records: data, read by scripts. The app serves one league, the
// environment's `FANTRAX_LEAGUE_ID`, and reads only the `stats` role from the file (`assistKinds.ts`).

/** A league we capture. `key` is its directory under `data/snapshots/fantrax/leagues/`. */
export interface RecordedLeague {
  key: string;
  leagueId: string;
}

export const RECORDED_LEAGUES: readonly RecordedLeague[] = recorded.leagues;

/** Which recorded league shape-diff compares against which. */
export const SHAPE_DIFF = recorded.shapeDiff;
