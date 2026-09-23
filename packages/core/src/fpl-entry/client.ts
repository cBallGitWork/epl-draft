import { FPL_API_BASE } from "../config";
import { politeFetch } from "../http/fetch";
import type { RawEntry, RawPicks } from "./raw";

// The two entry reads, and nothing else. Public: an FPL entry id is the number in
// the URL a manager already shares, not a credential. FPL's authenticated
// endpoints (/me/, /my-team/) stay out — a credential flow the Premier League
// changes without warning, for a viewer that does not need it.

/** A manager's entry, or null when FPL has never heard of the id.
 *
 *  A mistyped id is the ordinary case here — somebody reading a number off
 *  another website — so a 404 is an answer, not a fault. Anything else still
 *  throws. */
export async function fetchEntry(entryId: number): Promise<RawEntry | null> {
  const res = await politeFetch(`${FPL_API_BASE}/entry/${entryId}/`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`FPL entry ${entryId} → ${res.status}`);
  return (await res.json()) as RawEntry;
}

/** One round's picks, or null before that round has been played.
 *
 *  FPL answers 404 for a gameweek an entry has no picks for, which is every
 *  gameweek until the season starts. Expected, and modelled rather than thrown. */
export async function fetchPicks(entryId: number, gameweek: number): Promise<RawPicks | null> {
  const res = await politeFetch(`${FPL_API_BASE}/entry/${entryId}/event/${gameweek}/picks/`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`FPL picks ${entryId}/${gameweek} → ${res.status}`);
  return (await res.json()) as RawPicks;
}
