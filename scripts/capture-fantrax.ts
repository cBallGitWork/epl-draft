import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  FantraxError,
  type TransactionView,
  fetchDraftResults,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchStandings,
  fetchTeamRosters,
  fetchTransactions,
} from "@epl/core";
import { RECORDED_LEAGUES } from "./leagues";
import { SNAPSHOT_ROOT, leagueCaptureDir, poolCaptureDir, todayInLondon } from "./paths";

/** The transaction logs to record. Fantrax publishes the legal set in each
 *  response's `displayedLists.tabs`; this list is what we ask for, and a tab
 *  appearing there that is missing here is the signal to add it. */
const TRANSACTION_VIEWS: readonly TransactionView[] = ["CLAIM_DROP", "TRADE", "LINEUP_CHANGE"];

// Records what Fantrax says about our leagues today, verbatim, into dated
// directories. Raw only — no mapping, no derivation. What we can parse later is a
// function of what we kept, and the cheapest way to be wrong about that is to
// decide now which fields matter.
//
// This is the substrate for everything longitudinal: diffing consecutive days is
// what will eventually say "dropped by the same manager three times". Fantrax
// serves current state only, so that history exists only if we write it down.
//
// Both leagues are captured on every run. The rehearsal league is where the app
// is built and the real league is the continuous test of the 10 Oct swap, so
// neither is optional and neither may overwrite the other.

const LEAGUE_READS = [
  { method: "getLeagueInfo", run: fetchLeagueInfo },
  { method: "getTeamRosters", run: fetchTeamRosters },
  { method: "getStandings", run: fetchStandings },
  { method: "getDraftResults", run: fetchDraftResults },
  // Fantrax's own transaction log, one file per view. Captured even though it is
  // a live read we could make on demand: this is the one part of the league's
  // history Fantrax could prune or renumber, and unlike the rosters it cannot be
  // reconstructed from anything else we hold. `LINEUP_CHANGE` is empty until a
  // period opens and is captured anyway, so the day it fills we can see when.
  ...TRANSACTION_VIEWS.map((view) => ({
    method: `getTransactionDetailsHistory-${view}`,
    run: (leagueId: string) => fetchTransactions(leagueId, view),
  })),
] as const;

interface ReadOutcome {
  method: string;
  ok: boolean;
  /** Fantrax's error code when it refused. `NO_TEAMS` before the draft is
   *  expected, not a fault — the manifest records it either way. */
  code?: string;
  message?: string;
  bytes?: number;
}

async function capture(
  dir: string,
  method: string,
  run: () => Promise<unknown>,
): Promise<ReadOutcome> {
  try {
    const body = await run();
    const json = `${JSON.stringify(body, null, 2)}\n`;
    await writeFile(join(dir, `${method}.json`), json);
    console.log(`  ${method}: ${json.length} bytes`);
    return { method, ok: true, bytes: json.length };
  } catch (error) {
    // One read failing must not cost us the others. A partial capture is worth
    // having; a silent one is not, so the failure goes in the manifest.
    if (!(error instanceof FantraxError)) throw error;
    console.log(`  ${method}: ${error.code}`);
    return { method, ok: false, code: error.code, message: error.message };
  }
}

/** `leagueId` is null for the pool, which belongs to no league. */
async function writeManifest(
  dir: string,
  capturedAt: string,
  leagueId: string | null,
  reads: ReadOutcome[],
): Promise<void> {
  const manifest = { capturedAt, leagueId, reads };
  await writeFile(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function main(): Promise<void> {
  const date = todayInLondon();
  // One timestamp for the whole run, so the league directories and the pool
  // directory agree about when this capture happened.
  const capturedAt = new Date().toISOString();
  const outcomes: ReadOutcome[] = [];

  for (const league of RECORDED_LEAGUES) {
    console.log(`${league.key} (${league.leagueId})`);
    const dir = leagueCaptureDir(league.key, date);
    await mkdir(dir, { recursive: true });

    const leagueOutcomes: ReadOutcome[] = [];
    for (const { method, run } of LEAGUE_READS) {
      leagueOutcomes.push(await capture(dir, method, () => run(league.leagueId)));
    }
    await writeManifest(dir, capturedAt, league.leagueId, leagueOutcomes);
    outcomes.push(...leagueOutcomes);
  }

  console.log("pool");
  const poolDir = poolCaptureDir(date);
  await mkdir(poolDir, { recursive: true });
  const poolOutcome = await capture(poolDir, "getPlayerIds", fetchPlayerPool);
  await writeManifest(poolDir, capturedAt, null, [poolOutcome]);
  outcomes.push(poolOutcome);

  const failed = outcomes.filter((outcome) => !outcome.ok).length;
  console.log(
    `\nCaptured ${outcomes.length - failed}/${outcomes.length} reads for ${date} ` +
      `into ${SNAPSHOT_ROOT}/{leagues,pool}`,
  );
}

// Not awaited at the top level: these scripts transpile to CJS, and a rejection
// here should crash the run loudly rather than be caught and softened.
void main();
