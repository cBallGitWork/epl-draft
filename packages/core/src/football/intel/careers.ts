import { byCode } from "./byCode";
import type { IntelManifest } from "./types";

// The Premier League club a man was at in each season the sister repo's identity store holds.
// Untrusted like every export: a season it lists is only printed against a season FPL's own
// history lists, because the store carries rows for seasons a man was not in the league.

export interface IntelCareers {
  manifest: IntelManifest;
  players: { code: number; seasons: { season: string; club: string }[] }[];
}

/** Each man's clubs by season, `"25-26"` → `"Sunderland"`, keyed on FPL's season-stable code. */
export function careerIntel(careers: IntelCareers | null): Map<number, Map<string, string>> {
  return byCode(careers?.players, (player) => {
    const seasons = new Map<string, string>();
    for (const row of player.seasons ?? []) {
      if (typeof row?.season === "string" && typeof row?.club === "string" && row.club !== "") seasons.set(row.season, row.club);
    }
    return seasons;
  });
}

/** FPL's `"2025/26"` or Fantrax's `"2025-26"` as the store's `"25-26"`; null for anything else. */
export function seasonKey(label: string): string | null {
  const match = /^\d{2}(\d{2})[/-](\d{2})$/.exec(label.trim());
  return match === null ? null : `${match[1]}-${match[2]}`;
}
