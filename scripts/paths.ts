import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Where captures live, and what "today" means. Shared by the writer and the
// reader deliberately: if they disagreed about either, the staleness check would
// cheerfully report on a directory nothing was ever written to. That is a
// contract between two callers, not a coincidence worth duplicating.

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const SNAPSHOT_ROOT = join(REPO_ROOT, "data", "snapshots", "fantrax");

/** The player pool is not league state. `getPlayerIds` takes no leagueId and
 *  returns byte-identical answers for every league, so it is filed once a day
 *  beside the leagues rather than inside one of them — otherwise the bridge
 *  would have to choose arbitrarily between two identical copies, and that
 *  arbitrary choice is the tell that the file is in the wrong place. */
export const POOL_ROOT = join(SNAPSHOT_ROOT, "pool");

const LEAGUES_ROOT = join(SNAPSHOT_ROOT, "leagues");

export const MAPPINGS_ROOT = join(REPO_ROOT, "data", "mappings");

/** Where the matcher leaves what it would not decide, for a human to settle. */
export const REVIEW_ROOT = join(MAPPINGS_ROOT, "review");

/** Every capture day for one league. `leagueKey` is `FantraxLeague.key`, which
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

/** Today as a London calendar date. The league is British and its deadlines are
 *  British, so a capture run late on a UK evening belongs to that UK day even
 *  when the machine running it thinks otherwise. */
export function todayInLondon(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
