import { unstable_cache } from "next/cache";
import { PAGE_REVALIDATE, type FootballSnapshot, getFootballSnapshot } from "@epl/core";

// One football snapshot per window, shared by everything that needs it.
//
// It is the app's largest read by far — FPL's bootstrap is 1.3 MB — and the
// layout wants it on every single page view to decide whether the Live tab
// exists. Uncached that is a megabyte per request per phone, and the routes are
// dynamic now because they read a session cookie, so nothing else was going to
// stop it. Cached, sixteen managers refreshing all weekend cost FPL one request
// per window between them.
//
// Nothing about who is asking may cross into here: the real Premier League is
// the same for everybody, which is exactly why it is cacheable.

export const footballNow: () => Promise<FootballSnapshot> = unstable_cache(
  async () => getFootballSnapshot(),
  ["football-snapshot"],
  { revalidate: PAGE_REVALIDATE },
);
