import { unstable_cache } from "next/cache";
import {
  type Fixture,
  type FootballSnapshot,
  datedKickoffs,
  duringGameweek,
  fetchFixtures,
  getFootballSnapshot,
  type MatchSheet,
  type PlayerMatchStats,
  fetchLive,
  fetchRegions,
  mapFixtures,
  mapLiveStats,
  mapMatchSheets,
  portraitUrl,
  rewindRound,
  roundAt,
  secondsToLive,
} from "@epl/core";
import { now, replayAt } from "./clock";
import { roundGoals } from "./commentary";
import { LIVE_REVALIDATE, PAGE_REVALIDATE, POLL, SEASON_CODE_LIFE } from "./config";

// One football snapshot per window, shared by every reader: FPL's bootstrap is 1.3 MB and the
// layout reads it on every page view. Nothing about who is asking may cross into this cache.

const currentRound: () => Promise<FootballSnapshot> = unstable_cache(
  async () => getFootballSnapshot(),
  ["football-snapshot"],
  { revalidate: LIVE_REVALIDATE },
);

export async function footballNow(): Promise<FootballSnapshot> {
  const at = replayAt();
  return at === null ? currentRound() : rewoundRound(at);
}

/** The round `REPLAY_AT` falls in as it stood then, or the live round before the season starts.
 *  Outside `currentRound`: `roundGoals` has its own cache, and a nested `unstable_cache` bypasses it. */
async function rewoundRound(at: string): Promise<FootballSnapshot> {
  const gameweek = roundAt(await seasonFixtures(), at);
  if (gameweek === null) return currentRound();
  const snapshot = await gameweekSnapshot(gameweek);
  return rewindRound(snapshot, await roundGoals(gameweek, snapshot.players), at);
}

/** One named round of football, cached per round apart from the current one in `footballNow`. */
export const gameweekSnapshot: (gameweek: number) => Promise<FootballSnapshot> = unstable_cache(
  async (gameweek: number) => getFootballSnapshot(gameweek),
  ["football-gameweek"],
  { revalidate: PAGE_REVALIDATE },
);

/** Every fixture in the season, as FPL dates them (a snapshot holds one gameweek). */
export const seasonFixtures: () => Promise<Fixture[]> = unstable_cache(
  async () => mapFixtures(await fetchFixtures()),
  ["season-fixtures"],
  { revalidate: PAGE_REVALIDATE },
);

/** FPL's country list, which a `region` id points into. It does not change within a season. */
export const regions = unstable_cache(async () => fetchRegions(), ["fpl-regions"], {
  revalidate: SEASON_CODE_LIFE,
});

/** One round's match sheets, read per round: the whole season's list nears 1 MB by May. The score,
 *  status and `settled` come from `seasonFixtures` only, as two caches of one URL can disagree. */
export const gameweekSheets: (gameweek: number) => Promise<MatchSheet[]> = unstable_cache(
  async (gameweek: number) => mapMatchSheets(await fetchFixtures(gameweek)),
  ["football-sheets"],
  { revalidate: PAGE_REVALIDATE },
);

/** One round's per-player minutes and points, per fixture, which the match sheets do not carry. */
export const gameweekLive: (gameweek: number) => Promise<PlayerMatchStats[]> = unstable_cache(
  async (gameweek: number) => mapLiveStats(await fetchLive(gameweek)),
  ["football-live"],
  { revalidate: PAGE_REVALIDATE },
);

/** The season's kickoffs as plain data for the league layer, never as a `Fixture`. */
export async function seasonKickoffs() {
  return datedKickoffs(await seasonFixtures());
}

/** Seconds until football is live as this render sees it, for the shell's poller to count down
 *  (`components/shell/cadence.ts`). Nought for the whole round, gaps between kickoffs included. */
export async function liveIn(snapshot: FootballSnapshot): Promise<number | null> {
  return secondsToLive(snapshot, await seasonFixtures(), now().toISOString());
}

/** Whether the round in view is under way: first kickoff to last whistle, gaps included. */
export function roundUnderway(snapshot: FootballSnapshot): boolean {
  return duringGameweek(snapshot, now().toISOString());
}

/** Enough faces to read as a crowd, few enough to stay one request each and to
 *  keep the composite legible. */
const GROUND_FACES = 6;

/** Portrait URLs for the desk's ground, spaced evenly because FPL orders players by club, and fixed
 *  so the crowd holds still between polls. Empty rather than a throw: a ground is decoration. */
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

/** Whether the shell offers its Live section: a round is under way. Fails open, so an FPL outage
 *  never hides Live mid-match. */
export async function offerLive(): Promise<boolean> {
  return (await roundLive()) ?? true;
}

/** Whether a round is under way; null when FPL could not be read, so each caller picks its own failure. */
export async function roundLive(): Promise<boolean | null> {
  try {
    return roundUnderway(await footballNow());
  } catch {
    return null;
  }
}

/** How stale a snapshot may be and still speak in the present tense, in live poll windows: three
 *  absorbs jitter, and `unstable_cache` sets no upper bound on a stale entry's age. */
const PRESENT_TENSE_WINDOW = 3;

/** Whether this snapshot is recent enough to speak of *now*: `fixture.status` has no clock, so a
 *  stale mid-match snapshot keeps saying "Live 45'". When false, scores render without the tense. */
export function speaksForNow(snapshot: FootballSnapshot): boolean {
  const taken = Date.parse(snapshot.fetchedAt);
  if (Number.isNaN(taken)) return false;
  return now().getTime() - taken <= POLL.live * PRESENT_TENSE_WINDOW * 1000;
}
