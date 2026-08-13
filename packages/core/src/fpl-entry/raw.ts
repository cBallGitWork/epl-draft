// FPL's entry endpoints as they arrive. Every field optional: this is somebody
// else's undocumented API and a pre-season entry is mostly nulls.

export interface RawEntry {
  id?: number;
  name?: string;
  player_first_name?: string;
  player_last_name?: string;
  summary_overall_points?: number | null;
  summary_overall_rank?: number | null;
  summary_event_points?: number | null;
  current_event?: number | null;
  leagues?: { classic?: RawClassicLeague[] };
}

export interface RawClassicLeague {
  id?: number;
  name?: string;
  entry_rank?: number | null;
  entry_last_rank?: number | null;
  /** "s" for the automatic global leagues, "x" for one somebody made. */
  league_type?: string;
}

export interface RawPick {
  element?: number;
  position?: number;
  multiplier?: number;
  is_captain?: boolean;
  is_vice_captain?: boolean;
}

export interface RawPicks {
  picks?: RawPick[];
  entry_history?: {
    event?: number;
    points?: number | null;
    event_transfers_cost?: number | null;
  };
}
