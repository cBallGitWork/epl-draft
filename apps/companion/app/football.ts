import { unstable_cache } from "next/cache";
import {
  PAGE_REVALIDATE,
  POLL,
  type Fixture,
  type FootballSnapshot,
  datedKickoffs,
  duringGameweek,
  fetchFixtures,
  getFootballSnapshot,
  type MatchSheet,
  type PlayerMatchStats,
  fetchLive,
  mapFixtures,
  mapLiveStats,
  mapMatchSheets,
  portraitUrl,
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

/** One round's match sheets — who did what in each of its ten fixtures.
 *
 *  **A per-round read and deliberately not a slice of `seasonFixtures`.** Three
 *  measurements, all taken 4 Sep 2026, and each of them rules out the obvious
 *  alternative:
 *
 *  `?event=N` is **26 KB**. The whole season is 183 KB today and rising fast —
 *  an unstarted fixture is 342 bytes and a finished one 2,938, so all 380
 *  finished is about **1.1 MB by May**. `seasonFixtures` is read on the paper's
 *  front page and on `/matchday`; fattening it would put a megabyte and a
 *  `JSON.parse` of it on both.
 *
 *  A second cached read of the SAME whole-season URL would not be free either.
 *  Next treats every fetch inside `unstable_cache` as `force-no-store`, so the
 *  Data Cache does not dedupe it, and React's memoization is per render pass
 *  while these two entries go stale independently.
 *
 *  And a played round never changes again, which is `gameweekSnapshot`'s own
 *  argument for staying out of `footballNow` one function above.
 *
 *  The score, the status and `settled` are **not** taken from here. They come
 *  from `seasonFixtures` and nowhere else: two independently cached reads of one
 *  URL can disagree, and a page showing one read's score beside the other's
 *  scorers is a page arguing with itself. */
export const gameweekSheets: (gameweek: number) => Promise<MatchSheet[]> = unstable_cache(
  async (gameweek: number) => mapMatchSheets(await fetchFixtures(gameweek)),
  ["football-sheets"],
  { revalidate: PAGE_REVALIDATE },
);

/** One round's per-player figures, per fixture.
 *
 *  **What it is for, when `gameweekSheets` above already exists.** That read is
 *  26 KB and gives the scoresheet — who scored, who assisted, cards, bonus, and
 *  a bps that is genuinely this fixture's. It carries no MINUTES and no points,
 *  because the fixture list publishes neither. This one is 437 KB and carries
 *  both, per fixture, for every player in every match of the season.
 *
 *  **Why the points are worth 437 KB.** They are the only per-fixture fantasy
 *  figure that exists for everybody. Counted 4 Sep 2026 against fixture 11's 32
 *  participants: Fantrax's live scoring gives a figure for **6**, and what it
 *  gives is a PERIOD total rather than a match one; Fantrax's per-player profile
 *  gives a true match figure for all 32 and costs one rate-limited request each.
 *  FPL's `explain` block gives all 32, exactly, in one read.
 *
 *  Cached per round like its two neighbours, and for their reason: a played
 *  round never changes again, so this is paid once per gameweek for the season. */
export const gameweekLive: (gameweek: number) => Promise<PlayerMatchStats[]> = unstable_cache(
  async (gameweek: number) => mapLiveStats(await fetchLive(gameweek)),
  ["football-live"],
  { revalidate: PAGE_REVALIDATE },
);

/** The season's kickoffs as the league layer wants to be told them: plain data,
 *  one way, never a `Fixture`. The rule for which fixtures have one is
 *  `datedKickoffs`; what this adds is the cache in front of it. */
export async function seasonKickoffs() {
  return datedKickoffs(await seasonFixtures());
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
  return roundUnderway(snapshot) ? POLL.live : POLL.idle;
}

/** Whether the round in view is under way — first kickoff to last whistle,
 *  including every gap in between.
 *
 *  The clock read that `pollSeconds` already made, given a name because a second
 *  caller wanted the same answer for a different reason: a head-to-head card says
 *  "all played" for a side with nobody left, and that is worth saying whenever
 *  the round is running rather than only while a ball is in the air. On a
 *  Wednesday every side has nobody left and none of them needs telling, which is
 *  the case this window excludes and `isMatchdayLive` was being used to. */
export function roundUnderway(snapshot: FootballSnapshot): boolean {
  return duringGameweek(snapshot, new Date().toISOString());
}

/** Enough faces to read as a crowd, few enough to stay one request each and to
 *  keep the composite legible. */
const GROUND_FACES = 6;

/** A few real faces for the desk's ground, as portrait URLs.
 *
 *  The placeholder behind every desk screen until a match photograph is
 *  configured — `DESK_GROUND` in core config. Real players rather than stock
 *  photography, because these are the men actually in the round and a stadium
 *  nobody in the league plays in would be set dressing.
 *
 *  **Spread across the pool rather than taken off the front of it.** FPL orders
 *  its elements by club, so the first six are six of the same club — which reads
 *  as a team photograph and not as a crowd. Evenly spaced instead, which lands
 *  six different shirts, and DETERMINISTIC rather than sampled so the crowd does
 *  not reshuffle on every poll.
 *
 *  Fails to nothing rather than throwing: a ground is decoration, and a football
 *  provider being down is not a reason for the whole shell to fall over.
 */
export async function groundFaces(): Promise<string[]> {
  try {
    const { players } = await footballNow();
    const step = Math.floor(players.length / GROUND_FACES);
    if (step < 1) return players.map((player) => portraitUrl(player));
    return Array.from({ length: GROUND_FACES }, (_, at) => portraitUrl(players[at * step]));
  } catch {
    return [];
  }
}

/** Whether the app offers its Live section: is a round of football under way.
 *
 *  Fails **open**. If FPL cannot be reached the section is offered rather than
 *  hidden — navigation must not lie by omission during the one window it
 *  matters, and the page behind it says honestly that nothing could be read. The
 *  reverse failure, a section silently missing mid-match, is the one nobody
 *  could diagnose from a phone. A stated policy rather than a swallowed default,
 *  which is the distinction CODE_RULES §2 draws.
 *
 *  One caller: the shell, which decides from it whether the rail and the foot
 *  row carry a Live plate. Two asked until 16 Sep 2026 — the paper's own index
 *  was the second, on the one route the rail stood down on, and both the index
 *  and that exemption are gone.
 */
export async function offerLive(): Promise<boolean> {
  try {
    return roundUnderway(await footballNow());
  } catch {
    return true;
  }
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
