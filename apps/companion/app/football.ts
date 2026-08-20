import { unstable_cache } from "next/cache";
import {
  PAGE_REVALIDATE,
  type Fixture,
  type FootballSnapshot,
  fetchFixtures,
  getFootballSnapshot,
  mapFixtures,
} from "@epl/core";

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

/** One named round of football, cached per round.
 *
 *  `footballNow` is the same read with the gameweek left to FPL. Kept apart
 *  rather than folded into one optional argument because the two have different
 *  lifetimes: the current round changes all afternoon, and a round in February
 *  is the same bytes every time anyone asks for it. */
export const gameweekSnapshot: (gameweek: number) => Promise<FootballSnapshot> = unstable_cache(
  async (gameweek: number) => getFootballSnapshot(gameweek),
  ["football-gameweek"],
  { revalidate: PAGE_REVALIDATE },
);

/** Every fixture in the season, dated as FPL has them.
 *
 *  A different read from the snapshot, which holds one gameweek: two things need
 *  the whole calendar and neither can get it from a snapshot — the schedule
 *  labels all thirty-eight rounds, and the deadline is measured back from a
 *  period's first kickoff, which may be in a round nobody is looking at.
 *
 *  Small beside the bootstrap (380 fixtures against 564 players and 20 clubs)
 *  and it moves only when a match is rearranged, but it is cached for the same
 *  reason everything else here is: it is the same for all sixteen of them. */
export const seasonFixtures: () => Promise<Fixture[]> = unstable_cache(
  async () => mapFixtures(await fetchFixtures()),
  ["season-fixtures"],
  { revalidate: PAGE_REVALIDATE },
);

/** The season's kickoffs as the league layer wants to be told them: plain data,
 *  one way, never a `Fixture`. Undated matches — TV picks with no time yet — are
 *  dropped rather than carried as a null nobody downstream can use. */
export async function seasonKickoffs() {
  const fixtures = await seasonFixtures();
  return fixtures.flatMap((fixture) =>
    fixture.gameweek === null || fixture.kickoff === null
      ? []
      : [{ gameweek: fixture.gameweek, kickoff: fixture.kickoff }],
  );
}
