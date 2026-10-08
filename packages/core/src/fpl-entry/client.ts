import { FPL_API_BASE } from "../config";
import { fetchJsonOr404 } from "../http/get";
import type { RawEntry, RawPicks } from "./raw";

// The two public entry reads, and nothing else: an entry id is not a credential, and FPL's authenticated reads stay out.

/** A manager's entry, or null when FPL has never heard of the id: a mistyped id is ordinary. Anything else throws. */
export async function fetchEntry(entryId: number): Promise<RawEntry | null> {
  return (await fetchJsonOr404(`${FPL_API_BASE}/entry/${entryId}/`, "FPL", `entry ${entryId}`)) as RawEntry | null;
}

/** One round's picks, or null for FPL's 404 on a gameweek the entry has no picks for, as before the season. */
export async function fetchPicks(entryId: number, gameweek: number): Promise<RawPicks | null> {
  return (await fetchJsonOr404(`${FPL_API_BASE}/entry/${entryId}/event/${gameweek}/picks/`, "FPL", `picks ${entryId}/${gameweek}`)) as RawPicks | null;
}
