import { FPL_API_BASE } from "../config";
import { notJson, statusError } from "../http/errors";
import { politeFetch } from "../http/fetch";
import { readJson } from "../http/json";
import type { RawEntry, RawPicks } from "./raw";

// The two public entry reads, and nothing else: an entry id is not a credential, and FPL's authenticated reads stay out.

/** A manager's entry, or null when FPL has never heard of the id: a mistyped id is ordinary. Anything else throws. */
export async function fetchEntry(entryId: number): Promise<RawEntry | null> {
  const what = `entry ${entryId}`;
  const res = await politeFetch(`${FPL_API_BASE}/entry/${entryId}/`);
  if (res.status === 404) return null;
  if (!res.ok) throw statusError("FPL", what, res.status);
  return (await readJson(res, notJson("FPL", what))) as RawEntry;
}

/** One round's picks, or null for FPL's 404 on a gameweek the entry has no picks for, as before the season. */
export async function fetchPicks(entryId: number, gameweek: number): Promise<RawPicks | null> {
  const what = `picks ${entryId}/${gameweek}`;
  const res = await politeFetch(`${FPL_API_BASE}/entry/${entryId}/event/${gameweek}/picks/`);
  if (res.status === 404) return null;
  if (!res.ok) throw statusError("FPL", what, res.status);
  return (await readJson(res, notJson("FPL", what))) as RawPicks;
}
