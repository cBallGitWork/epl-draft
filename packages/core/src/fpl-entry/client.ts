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

/** Every element's FPL points for a round, keyed by FPL's per-season element id.
 *
 *  Read here rather than through the football layer on purpose. `total_points` is
 *  FPL's own scoring — the rules of the game this tab is about — and the football
 *  layer deliberately carries countable events and never fantasy points, because
 *  a goal is a fact and what a goal is worth is a house rule. This is the house
 *  that owns that rule.
 *
 *  Empty before the first kickoff of the round, which is not an error. */
export async function fetchEntryPoints(gameweek: number): Promise<Map<number, number>> {
  const res = await politeFetch(`${FPL_API_BASE}/event/${gameweek}/live/`);
  if (!res.ok) throw new Error(`FPL live ${gameweek} → ${res.status}`);

  const body = (await res.json()) as { elements?: { id?: number; stats?: Record<string, unknown> }[] };
  const points = new Map<number, number>();

  for (const element of body.elements ?? []) {
    const total = element.stats?.total_points;
    if (element.id !== undefined && typeof total === "number") points.set(element.id, total);
  }
  return points;
}

/** Which line FPL files each element in, keyed by their per-season element id.
 *
 *  Read here rather than through the football layer for the same reason
 *  `fetchEntryPoints` is: `element_type` is FPL's own classification of a player
 *  for FPL's own game, and `football/types.ts` deliberately carries no position
 *  because Fantrax files several of the same men differently. This is the house
 *  that owns the rule.
 *
 *  It costs a second read of the same 1.3 MB bootstrap the football snapshot
 *  already fetched, which is the price of not putting a fantasy classification on
 *  a footballer. Bounded by the caller's cache rather than paid per render. */
export async function fetchEntryLines(): Promise<Map<number, number>> {
  const res = await politeFetch(`${FPL_API_BASE}/bootstrap-static/`);
  if (!res.ok) throw new Error(`FPL bootstrap → ${res.status}`);

  const body = (await res.json()) as { elements?: { id?: number; element_type?: number }[] };
  const lines = new Map<number, number>();

  for (const element of body.elements ?? []) {
    if (element.id !== undefined && typeof element.element_type === "number") {
      lines.set(element.id, element.element_type);
    }
  }
  return lines;
}
