// `data/leagues/recorded.json`: the leagues the archive records, and the roles that name one of them.

/** The file, as far as a role is read from it. */
export interface RecordedLeagues {
  leagues: readonly { key: string; leagueId: string }[];
  /** The league kept to list every category at no points. */
  stats: string;
  /** The league whose rules price every point we work out ourselves. */
  scoring: string;
}

/** The league id the file records under a role, or null when the role names a league it does not list. */
export function recordedRole(file: RecordedLeagues, role: "stats" | "scoring"): string | null {
  return file.leagues.find((league) => league.key === file[role])?.leagueId ?? null;
}
