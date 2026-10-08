import type { RawElementSummary, RawHistoryEntry, RawPastSeason } from "../fpl/raw";
import type { IntelManifest } from "./types";

// FPL's own element-summaries as the sister repo's sweep keeps them, exported by FPL code and cut to what our mappers
// read: a player's season for the page when FPL will not answer and nothing is cached for him.

/** Every field `RawHistoryEntry` types; `mapGameLog` reads from these and nothing else. */
const HISTORY_KEYS = [
  "fixture", "round", "opponent_team", "was_home", "kickoff_time", "team_h_score", "team_a_score", "total_points",
  "minutes", "goals_scored", "assists", "clean_sheets", "goals_conceded", "yellow_cards", "red_cards", "saves",
  "bonus", "bps", "defensive_contribution", "expected_goals", "expected_assists", "starts", "tackles",
  "clearances_blocks_interceptions", "recoveries", "expected_goals_conceded",
] as const satisfies readonly (keyof RawHistoryEntry)[];

/** Every field `RawPastSeason` types, which `mapPastSeasons` reads. */
const PAST_KEYS = [
  "season_name", "total_points", "minutes", "goals_scored", "assists", "clean_sheets", "goals_conceded",
  "yellow_cards", "red_cards", "saves", "bonus",
] as const satisfies readonly (keyof RawPastSeason)[];

export interface IntelHistory {
  manifest: IntelManifest;
  /** By FPL code, the id that survives the summer. */
  players: Record<string, RawElementSummary>;
}

/** One summary cut to the fields the mappers read, its `fixtures` dropped. Pure. */
export function slimSummary(raw: RawElementSummary): RawElementSummary {
  return {
    history: (raw.history ?? []).map((row) => pick(row, HISTORY_KEYS)),
    history_past: (raw.history_past ?? []).map((row) => pick(row, PAST_KEYS)),
  };
}

/** A man's summary by FPL code, or null where the export holds none. */
export function historyOf(file: IntelHistory | null, code: number): RawElementSummary | null {
  return file?.players[String(code)] ?? null;
}

/** The row with only `keys`; one the row lacks stays absent, as FPL sent it. */
function pick<T extends object, K extends keyof T>(row: T, keys: readonly K[]): Pick<T, K> {
  const kept = {} as Pick<T, K>;
  for (const key of keys) if (key in row) kept[key] = row[key];
  return kept;
}
