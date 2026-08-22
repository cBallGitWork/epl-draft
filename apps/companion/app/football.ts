import { unstable_cache } from "next/cache";
import {
  PAGE_REVALIDATE,
  POLL,
  type Fixture,
  type FootballSnapshot,
  duringGameweek,
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

/** How often a page showing this round should ask the server again.
 *
 *  `duringGameweek` and not `isMatchdayLive`: the window from the first kickoff
 *  to the last whistle is the right question for a poll rate, because Saturday
 *  tea-time between two kickoffs is when a score is most likely to have moved
 *  since you looked. It is the wrong question for the LIVE dot, which is a
 *  different call and stays one (`roundState`).
 *
 *  The clock is read here rather than passed in, and that is deliberate: four
 *  pages were each spelling out `new Date().toISOString()` beside the same
 *  ternary, which is four chances to compare a snapshot against a clock that
 *  someone later decides to inject. This is the app edge; the edge is where a
 *  clock belongs. */
export function pollSeconds(snapshot: FootballSnapshot): number {
  return duringGameweek(snapshot, new Date().toISOString()) ? POLL.live : POLL.idle;
}

/** How stale a snapshot may be and still be spoken about in the present tense,
 *  as a multiple of the live poll window.
 *
 *  Three rather than one, so ordinary jitter — a slow FPL round trip, a render
 *  that lands between revalidations — never trips it. What it is there to catch
 *  is the order of magnitude beyond that: `unstable_cache` serves a stale entry
 *  while it revalidates and puts no upper bound on its age at all, and on 22 Aug
 *  a round was measured being served fifty-three hours old. */
const PRESENT_TENSE_WINDOW = 3;

/** Whether this snapshot is recent enough to make a claim about *now*.
 *
 *  The live treatment — the dot, the ticking minute, the word Live — is the one
 *  thing on a football screen that is a statement about the present rather than
 *  about a result, and it is derived purely from `fixture.status`, which has no
 *  clock in it. So a cached snapshot taken mid-match keeps saying "Live 45'" for
 *  as long as the cache holds it: /gw/1 rendered "BRE 2–0 Live 45′" while
 *  /matchday, in the same second, rendered "BRE 3–0 FT".
 *
 *  A page may be stale. It may not be stale in the present tense — so when this
 *  is false the scores still render and the tense does not. The clock is read
 *  here at the app edge, beside `pollSeconds`, for the reason that one gives. */
export function speaksForNow(snapshot: FootballSnapshot): boolean {
  const taken = Date.parse(snapshot.fetchedAt);
  if (Number.isNaN(taken)) return false;
  return Date.now() - taken <= POLL.live * PRESENT_TENSE_WINDOW * 1000;
}
