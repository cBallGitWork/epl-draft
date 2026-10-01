import { unstable_cache } from "next/cache";
import { FANTRAX_LEAGUE_ID, type ProviderError } from "@epl/core";
import { PAGE_REVALIDATE } from "./config";
import { orDegraded } from "./refusals";

// One league read, cached for everybody. The key and the tag both carry the league id, so the swap
// cannot serve one league's entry to the other; nothing about who is asking may cross into a read.

export function leagueCache<A extends unknown[], R>(
  /** What is being read, in the domain's words. Joined with the league id to
   *  make the key; never the whole key, so the id cannot be left out. */
  key: string,
  read: (...args: A) => Promise<R>,
  /** What a cold key shows when a provider could not answer. Never stored: a warm key serves its
   *  last good answer instead, because Next keeps a stale entry whose refresh threw. */
  degrade: (error: ProviderError, ...args: A) => R,
  /** How long it may be held. Defaults to the page's own window; only a final answer earns longer. */
  revalidate: number = PAGE_REVALIDATE,
): (...args: A) => Promise<R> {
  const cached = unstable_cache(read, [key, FANTRAX_LEAGUE_ID], {
    revalidate,
    tags: [leagueTag(key)],
  });
  return (...args) => orDegraded(cached(...args), (error) => degrade(error, ...args));
}

/** The tag a `leagueCache` read is filed under, for a write to expire it. */
export function leagueTag(key: string): string {
  return `${key}:${FANTRAX_LEAGUE_ID}`;
}
