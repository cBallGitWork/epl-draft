import { londonDay } from "@epl/core";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Where captures live and what "today" means; the capture writer and the staleness check must agree on both.

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const SNAPSHOT_ROOT = join(REPO_ROOT, "data", "snapshots", "fantrax");

/** The player pool, filed once a day beside the leagues: `getPlayerIds` answers the same for every league. */
export const POOL_ROOT = join(SNAPSHOT_ROOT, "pool");

/** One directory per league archive, recorded or not. */
export const LEAGUES_ROOT = join(SNAPSHOT_ROOT, "leagues");

export const MAPPINGS_ROOT = join(REPO_ROOT, "data", "mappings");

/** League rules Fantrax will not serve as JSON (the per-position minimums off the commissioner's setup page). */
export const LEAGUE_LIMITS = join(REPO_ROOT, "data", "leagues");

/** The shape differences somebody has read and accepted. */
export const SHAPE_BASELINE_PATH = join(REPO_ROOT, "data", "shape", "baseline.json");

/** The written columns. Outside `data/snapshots` and `data/probes`, so a new edition redeploys the app that bakes it in. */
export const EDITIONS_ROOT = join(REPO_ROOT, "data", "editions");

/** The sister repo's export plus what scout-xi, stats, intel-cups, draft-pack and ingest-pressers file beside it.
 *  Outside `data/snapshots` and `data/probes`, which `vercel.json` keeps from redeploying: the app bakes this in. */
export const INTEL_ROOT = join(REPO_ROOT, "data", "intel");

/** Our marks for every man in every match, which `npm run ratings` files and the player pages read. */
export const RATINGS_ROOT = join(REPO_ROOT, "data", "ratings");

/** Where the matcher leaves what it would not decide, for a human to settle. */
export const REVIEW_ROOT = join(MAPPINGS_ROOT, "review");

/** Every capture day for one league. `leagueKey` is a `RecordedLeague.key` (`data/leagues/recorded.json`), which
 *  is why renaming a key moves data. */
export function leagueCaptureRoot(leagueKey: string): string {
  return join(LEAGUES_ROOT, leagueKey);
}

export function leagueCaptureDir(leagueKey: string, date: string): string {
  return join(leagueCaptureRoot(leagueKey), date);
}

export function poolCaptureDir(date: string): string {
  return join(POOL_ROOT, date);
}

/** Today as a London calendar date, whatever the machine's own zone. */
export function todayInLondon(): string {
  return londonDay(new Date());
}
