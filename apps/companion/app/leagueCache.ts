import { unstable_cache } from "next/cache";
import { FANTRAX_LEAGUE_ID } from "@epl/core";
import { PAGE_REVALIDATE } from "./config";

// One league read, cached for everybody.
//
// Eleven reads had written out the same three lines, and the duplication was
// never the point. **The cache key must carry the league id**, and on 10 Oct
// that stops being a tidiness question: the swap is one environment variable,
// and a key that omitted `FANTRAX_LEAGUE_ID` would serve the rehearsal league's
// squads, standings and scores to sixteen people looking at the real one. It
// would look like a working app. Nothing would throw, no view would say
// "unavailable", and the names on the screen would be wrong.
//
// Written out eleven times, that is eleven chances to forget. Written once, it
// cannot be forgotten — which is the only reason this file exists, and why it
// takes the key rather than the whole key array.
//
// Caching is also not an optimisation here. Reading the session cookie in the
// layout makes every route dynamic, so without it the pool's 533 KB stats
// payload is fetched again for every view by every phone. The league is the same
// for all sixteen of them, so it is read once and rendered sixteen ways.
//
// **Nothing about who is asking may cross into a cached read** — no team id, no
// cookie — or one manager's view is served to another. That rule lives at every
// call site because only the call site knows what it closed over.
//
// **The tag is the key, and it is derived here for the same reason the key is.**
// A cache window is a ceiling on staleness, not a promise of freshness: a write
// that changed what a read answers should not have to wait it out, and a tag is
// how it says so. It is the two parts the key is made of and nothing else — so
// `revalidateTag` on the rehearsal league cannot drop the real league's rosters,
// and no call site is in a position to forget the half that stops it. A `tags`
// argument here would have been the parameter with no caller that CODE_RULES §1
// forbids; this is the same guarantee with nothing to pass.

export function leagueCache<A extends unknown[], R>(
  /** What is being read, in the domain's words. Joined with the league id to
   *  make the key; never the whole key, so the id cannot be left out. */
  key: string,
  read: (...args: A) => Promise<R>,
  /** How long it may be held. Defaults to the page's own window, which is what
   *  ten of the eleven want; the season code is the exception, and it is one
   *  because Fantrax's answer to it changes about twice a year. */
  revalidate: number = PAGE_REVALIDATE,
): (...args: A) => Promise<R> {
  return unstable_cache(read, [key, FANTRAX_LEAGUE_ID], {
    revalidate,
    tags: [leagueTag(key)],
  });
}

/** The tag a `leagueCache` read is filed under, for a write to expire it. */
export function leagueTag(key: string): string {
  return `${key}:${FANTRAX_LEAGUE_ID}`;
}
