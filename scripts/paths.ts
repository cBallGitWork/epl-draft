import { londonDay } from "@epl/core";
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

/** League rules Fantrax enforces and will not serve as JSON. One file today —
 *  the per-position minimums, which live only on the commissioner's setup page —
 *  and it is `data/` rather than `snapshots/` because a snapshot is a dated copy
 *  of what an endpoint said and this is a setting we read and keep. */
export const LEAGUE_LIMITS = join(REPO_ROOT, "data", "leagues");

/** One file per gameweek, one line per change, recording how a round settles.
 *  Under `probes/` and not `snapshots/`: a snapshot is league state we would
 *  otherwise lose, and this is an experiment answering a question. */
export const ROUND_STATE_ROOT = join(REPO_ROOT, "data", "probes", "round-state");

/** The shape differences somebody has read and accepted. Beside the mappings for
 *  the same reason: both are a person's judgement, checked in as data. */
export const SHAPE_BASELINE_PATH = join(REPO_ROOT, "data", "shape", "baseline.json");

/** The written columns, committed as data.
 *
 *  Under `data/` and NOT under `data/snapshots` or `data/probes`, and that is
 *  load-bearing rather than tidy: `apps/companion/vercel.json` excludes exactly
 *  those two from the build trigger, so a capture does not redeploy the app. An
 *  edition MUST redeploy it — the app imports the column statically and it is
 *  baked in at build time, so a commit that does not build is a column nobody
 *  reads. */
export const EDITIONS_ROOT = join(REPO_ROOT, "data", "editions");

/** The sister repo's export — real positions, squad numbers, a predicted eleven.
 *
 *  Under `data/` and NOT under `data/snapshots` or `data/probes`, for the same
 *  load-bearing reason `EDITIONS_ROOT` is: `apps/companion/vercel.json` excludes
 *  exactly those two from the build trigger, and the app imports this export
 *  statically, so it is baked in at build time. A commit carrying a new export
 *  MUST redeploy or it is data nobody reads.
 *
 *  Written by `make export-epl-draft` in `~/ai-carling-premiership`, never by
 *  anything here — which is why `intel-check` exists: nothing in this repo can
 *  make it fresher, so the least it can do is say how old it is. */
export const INTEL_ROOT = join(REPO_ROOT, "data", "intel");

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

/** Today as a London calendar date. The league is British and its deadlines are
 *  British, so a capture run late on a UK evening belongs to that UK day even
 *  when the machine running it thinks otherwise. */
export function todayInLondon(): string {
  return londonDay(new Date());
}
