import { readFileSync } from "node:fs";
import { SHAPE_BASELINE_PATH, leagueCaptureRoot } from "./paths";
import { RECORDED_LEAGUES, type RecordedLeague, SHAPE_DIFF } from "./leagues";
import { comparableLive } from "./shape/scored";
import { drafted, excused } from "./snapshots";
import {
  type AcknowledgedDifference,
  ProviderError,
  diffShapes,
  fetchDraftResults,
  fetchLeagueInfo,
  fetchLiveScoring,
  fetchSeasonResults,
  fetchStandings,
  fetchStandingsPage,
  fetchTeamRosters,
  fetchTransactions,
  mapTeamRosters,
  orphaned,
  shapeOf,
  unacknowledged,
} from "@epl/core";

// Does the real league answer in the shape the mappers were written for, the rehearsal league's? A path only the
// reference has is a mapper reading `undefined`: exit 1. So is a read either league failed, bar NO_TEAMS before its
// draft and live scoring before its first game. Exit 2 is a run that could not answer.   npm run shape-diff

const REFERENCE = RECORDED_LEAGUES.find((league) => league.key === SHAPE_DIFF.reference);
const SUBJECT = RECORDED_LEAGUES.find((league) => league.key === SHAPE_DIFF.subject);

const READS: { method: string; run: (leagueId: string) => Promise<unknown> }[] = [
  { method: "getLeagueInfo", run: fetchLeagueInfo },
  { method: "getTeamRosters", run: (id) => fetchTeamRosters(id) },
  { method: "getStandings", run: fetchStandings },
  { method: "getDraftResults", run: fetchDraftResults },
  { method: "getTransactionDetailsHistory-CLAIM_DROP", run: (id) => fetchTransactions(id, "CLAIM_DROP") },
  { method: "getTransactionDetailsHistory-TRADE", run: (id) => fetchTransactions(id, "TRADE") },
  // The three fxpa reads the app cannot render a live Saturday without.
  { method: "fxpa getStandings (page)", run: fetchStandingsPage },
  { method: "fxpa getStandings?view=SCHEDULE", run: fetchSeasonResults },
  { method: "getLiveScoringStats", run: liveScoring },
];

/** A league that has played no game yet, so has nothing of this read to compare: said aloud, and not a failure. */
class Unplayed {
  constructor(readonly why: string) {}
}

/** Live scoring at the league's last period with a scored man, read back from the one Fantrax has open. None is a
 *  failed read once any game is on the standings, as it would compare nothing inside a man's row. */
async function liveScoring(leagueId: string): Promise<unknown> {
  const open = mapTeamRosters(await fetchTeamRosters(leagueId)).period;
  if (open === null) throw new ProviderError("NO_PERIOD", "getTeamRosters named no open period to read back from");
  const live = await comparableLive(
    open,
    (period) => fetchLiveScoring(leagueId, period),
    () => fetchStandings(leagueId),
  );
  if (live === "unplayed") return new Unplayed("nothing scored yet — compared from its first played period");
  if (live === null) throw new ProviderError("NO_SCORES", `no period up to ${open} has a scored man to compare`);
  return live;
}

/** A payload, the provider's reason for not giving one, or a league with nothing to compare yet. */
type Answer = { payload: unknown } | { refused: ProviderError } | { unplayed: string };

async function read(run: (leagueId: string) => Promise<unknown>, leagueId: string): Promise<Answer> {
  try {
    const payload = await run(leagueId);
    return payload instanceof Unplayed ? { unplayed: payload.why } : { payload };
  } catch (error) {
    if (error instanceof ProviderError) return { refused: error };
    throw error;
  }
}

/** One line on a league that gave no payload, and whether that may stand: only NO_TEAMS before its draft. */
async function stands(method: string, league: RecordedLeague, error: ProviderError): Promise<boolean> {
  if (excused(error.code, await drafted(leagueCaptureRoot(league.key)))) {
    console.log(`~ ${method}\n    ${league.key} refused ${error.code} before its draft — not comparable`);
    return true;
  }
  console.log(`✗ ${method}  ${league.key}: ${error.message}`);
  return false;
}

async function main() {
  if (!REFERENCE || !SUBJECT) {
    console.error("shape-diff: both leagues named in data/leagues/recorded.json must be listed there");
    process.exitCode = 2;
    return;
  }

  console.log(`shape-diff — reference ${REFERENCE.key}, subject ${SUBJECT.key} (${SUBJECT.leagueId})\n`);

  // Every acknowledged difference must explain itself, or the baseline is a blindfold with a filename: exit 2.
  const baseline = JSON.parse(readFileSync(SHAPE_BASELINE_PATH, "utf8")) as AcknowledgedDifference[];
  const unexplained = baseline.filter(
    (entry) => !entry.read || !entry.path || (entry.why ?? "").trim().length < 40,
  );
  if (unexplained.length > 0) {
    console.error(
      `${unexplained.length} baseline entr${unexplained.length === 1 ? "y has" : "ies have"} no reason recorded:`,
    );
    for (const entry of unexplained) console.error(`    ${entry.read} ${entry.path}`);
    console.error("Every acknowledged difference needs a sentence saying why it is acceptable.");
    process.exitCode = 2;
    return;
  }
  const stranded = orphaned(baseline, READS.map((entry) => entry.method));
  if (stranded.length > 0) {
    console.error(`${stranded.length} baseline entr${stranded.length === 1 ? "y names" : "ies name"} a read this script does not make:`);
    for (const entry of stranded) console.error(`    ${entry.read} ${entry.path}`);
    console.error("Rename the entry's `read` to the method label in READS.");
    process.exitCode = 2;
    return;
  }

  let dangerous = 0;
  let uncompared = 0;
  let stale = 0;
  // Comparisons MADE, not reads attempted: without it the exit code cannot tell a clean run from an empty one.
  let compared = 0;
  const failed: string[] = [];

  for (const { method, run } of READS) {
    const [reference, subject] = await Promise.all([
      read(run, REFERENCE.leagueId),
      read(run, SUBJECT.leagueId),
    ]);

    if (!("payload" in reference) || !("payload" in subject)) {
      uncompared += 1;
      for (const [league, answer] of [[REFERENCE, reference], [SUBJECT, subject]] as const) {
        if ("unplayed" in answer) console.log(`~ ${method}  ${league.key}: ${answer.unplayed}`);
        else if ("refused" in answer && !(await stands(method, league, answer.refused))) {
          failed.push(`${method} (${league.key} ${answer.refused.code})`);
        }
      }
      continue;
    }

    const { missing, emptied, added } = diffShapes(
      shapeOf(reference.payload),
      shapeOf(subject.payload),
    );
    compared += 1;
    // Counted, never listed: an empty table would otherwise print a line per column and bury the two that matter.
    const empty = emptied.length > 0 ? `  (${emptied.length} inside empty collections)` : "";

    const { residue, settled } = unacknowledged(method, missing, baseline);

    if (residue.length === 0 && added.length === 0 && settled.length === 0) {
      console.log(`✓ ${method}${empty}${acknowledged(missing.length)}`);
      continue;
    }

    console.log(`${residue.length > 0 ? "✗" : "+"} ${method}${empty}${acknowledged(missing.length)}`);
    for (const path of residue) console.log(`    MISSING  ${path}`);
    for (const path of added) console.log(`    added    ${path}`);
    // A baseline entry that no longer differs is one a person can delete: saying so keeps the file from growing.
    for (const path of settled) console.log(`    settled  ${path}  (prune from the baseline)`);
    dangerous += residue.length;
    stale += settled.length;
  }

  // "nobody has looked at", not "the app reads": this diffs payloads, not mappers.
  console.log(
    `\n${dangerous} path${dangerous === 1 ? "" : "s"} the real league does not answer and nobody has looked at` +
      `${uncompared > 0 ? `, ${uncompared} read${uncompared === 1 ? "" : "s"} not comparable` : ""}` +
      `${stale > 0 ? `, ${stale} baseline entr${stale === 1 ? "y" : "ies"} to prune` : ""}.`,
  );

  // Nothing compared is not nothing wrong: a rate limit or a vanished league looks like this from here.
  if (compared === 0) {
    console.error("Compared NOTHING: every read refused, so this run vouches for nothing.");
    process.exitCode = 2;
    return;
  }
  if (failed.length > 0) {
    console.error(`FAILED: ${failed.join(", ")} not compared; only NO_TEAMS before a league's draft may stand.`);
  }
  process.exitCode = dangerous > 0 || failed.length > 0 ? 1 : 0;
}

/** How many of this read's differences were already judged, so a green line still says how much is a decision. */
function acknowledged(missing: number): string {
  return missing > 0 ? `  (${missing} acknowledged)` : "";
}

// Not awaited at the top level: these scripts transpile to CJS, and a rejection should crash loudly.
void main();
