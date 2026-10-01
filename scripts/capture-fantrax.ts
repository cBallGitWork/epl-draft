import {
  type TransactionView,
  fetchDraftResults,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchStandings,
  fetchTeamRosters,
  fetchTransactions,
} from "@epl/core";
import { type CaptureTarget, captureDay } from "./capture/day";
import { RECORDED_LEAGUES } from "./leagues";
import { SNAPSHOT_ROOT, leagueCaptureDir, poolCaptureDir, todayInLondon } from "./paths";

// Records what Fantrax says about every recorded league and the pool today, verbatim, into dated
// directories. Fantrax serves current state only, so a day not written down is gone.

/** The transaction logs to record; a tab in a response's `displayedLists.tabs` missing here is one to add. */
const TRANSACTION_VIEWS: readonly TransactionView[] = ["CLAIM_DROP", "TRADE", "LINEUP_CHANGE"];

const LEAGUE_READS = [
  { method: "getLeagueInfo", run: fetchLeagueInfo },
  { method: "getTeamRosters", run: fetchTeamRosters },
  { method: "getStandings", run: fetchStandings },
  { method: "getDraftResults", run: fetchDraftResults },
  // The one history Fantrax could prune and nothing else reconstructs; `LINEUP_CHANGE` is kept empty too.
  ...TRANSACTION_VIEWS.map((view) => ({
    method: `getTransactionDetailsHistory-${view}`,
    run: (leagueId: string) => fetchTransactions(leagueId, view),
  })),
] as const;

async function main(): Promise<void> {
  const date = todayInLondon();
  const targets: CaptureTarget[] = RECORDED_LEAGUES.map(({ key, leagueId }) => ({
    label: `${key} (${leagueId})`,
    dir: leagueCaptureDir(key, date),
    leagueId,
    reads: LEAGUE_READS.map(({ method, run }) => ({ method, run: () => run(leagueId) })),
  }));
  targets.push({
    label: "pool",
    dir: poolCaptureDir(date),
    leagueId: null,
    reads: [{ method: "getPlayerIds", run: fetchPlayerPool }],
  });

  const outcomes = await captureDay(targets, new Date().toISOString());
  const failed = outcomes.filter((outcome) => !outcome.ok).length;
  console.log(
    `\nCaptured ${outcomes.length - failed}/${outcomes.length} reads for ${date} ` +
      `into ${SNAPSHOT_ROOT}/{leagues,pool}`,
  );
  // Red only after every directory is written, so the workflow still commits the partial day.
  if (failed > 0) process.exitCode = 1;
}

// Not awaited at the top level: these scripts transpile to CJS, and a rejection should crash loudly.
void main();
