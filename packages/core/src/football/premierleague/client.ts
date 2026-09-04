import { PL_COMPETITION, PL_COMP_SEASON, PL_FOOTBALL_API_BASE, PL_TEXTSTREAM_PAGE } from "../../config";
import { politeFetch } from "../../http/fetch";
import type {
  RawPlFixture,
  RawPlFixturePage,
  RawPlMatchStats,
  RawPlTextstream,
} from "./raw";

// All Premier League API I/O, and nowhere else. The mapping next door stays pure.
//
// **Server-side only, and that is the provider's rule rather than ours.** It
// answers `access-control-allow-origin: https://www.premierleague.com`, so a
// browser reading this from our origin is refused. Nothing here may be reached
// from a `"use client"` component.
//
// Freshness is not expressed here, for the same reason `fpl/client.ts` does not
// express it: a Next segment's `revalidate` is Next's business and core does not
// know about Next. Worth knowing anyway — their own `cache-control` is
// `max-age=30`, which is already `PAGE_REVALIDATE`, so a caller polling faster
// is served the same bytes off their CDN.

async function get<T>(path: string): Promise<T> {
  const res = await politeFetch(`${PL_FOOTBALL_API_BASE}${path}`);
  // Loudly, like FPL's. A caller that catches an error can say the commentary is
  // unavailable; one handed a default would print silence as "nothing happened".
  if (!res.ok) throw new Error(`Premier League ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** One round's fixtures — and every goal in it.
 *
 *  Ten rows for a normal gameweek, carrying the live clock, the half-time score,
 *  the ground, the attendance once published, and **`goals`**: the scorer, the
 *  assister and the minute of every goal in all ten matches. Counted across
 *  gameweeks 1-3, that array reconciles with the scoreline on 21 of 21 played
 *  fixtures, so the round's goals cost ONE request and the per-fixture stream is
 *  needed only for cards, substitutions and Opta's prose.
 *
 *  **`altIds=true` is not optional.** Without it the response carries no
 *  `altIds` on any fixture — 0 of 10, measured — and there is then no join to
 *  FPL at all. The failure is a screen with nothing on it rather than an error,
 *  which is why the parameter is here and not left to a caller. */
export function fetchPlRound(gameweek: number): Promise<RawPlFixturePage> {
  return get<RawPlFixturePage>(
    `/fixtures?comps=${PL_COMPETITION}&compSeasons=${PL_COMP_SEASON}` +
      `&gameweekNumbers=${gameweek}&pageSize=20&page=0&sort=asc&altIds=true`,
  );
}

/** One fixture in full: the two team sheets, the formations, the shirt numbers
 *  and the referee.
 *
 *  **This is also the only complete source of the player-id join.** The
 *  `/players` collection looks like the cheaper way to build that map and is
 *  incomplete: counted 4 Sep 2026 against every player named in the 2,215 events
 *  of gameweeks 1-3, it misses 20 of the 360 who appear, 14 of them in a goal, a
 *  card or a substitution — one of them a scorer. All twenty are on a team sheet.
 *  So the map is harvested from here. */
export function fetchPlFixture(id: number): Promise<RawPlFixture> {
  return get<RawPlFixture>(`/fixtures/${id}`);
}

/** Opta's minute-stamped commentary for one fixture.
 *
 *  A fixture nobody has played answers with its header and an empty `content`,
 *  which is the same shape and not an error — checked against all thirty
 *  fixtures of gameweeks 1-3, every one of which answered 200. */
export function fetchPlTextstream(id: number): Promise<RawPlTextstream> {
  return get<RawPlTextstream>(
    `/fixtures/${id}/textstream/EN?pageSize=${PL_TEXTSTREAM_PAGE}&sort=asc`,
  );
}

/** Every Opta metric for both sides of one match — possession, shots, corners,
 *  fouls, offsides, tackles, headers and about 160 more.
 *
 *  This is the read `prem/match/[id]/MatchTabs` has been waiting for. Its
 *  docblock ships two tabs where Championship Manager runs four, on the ground
 *  that *"the two missing ones are the two we have no data for"* — and that is
 *  no longer true of Match Stats: `cm9900/22.jpg`'s board is twelve of thirteen
 *  rows from this one call. Action Zones still has no source.
 *
 *  **A metric worth nought is absent rather than zero** — see `RawPlMetric`. */
export function fetchPlMatchStats(id: number): Promise<RawPlMatchStats> {
  return get<RawPlMatchStats>(`/stats/match/${id}`);
}

