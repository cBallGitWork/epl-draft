import { readFileSync } from "node:fs";
import { SHAPE_BASELINE_PATH } from "./paths";
import { RECORDED_LEAGUES, SHAPE_DIFF } from "./leagues";
import {
  FantraxError,
  type AcknowledgedDifference,
  diffShapes,
  fetchDraftResults,
  fetchLeagueInfo,
  fetchLiveScoring,
  fetchSeasonResults,
  fetchStandings,
  fetchStandingsPage,
  fetchTeamRosters,
  fetchTransactions,
  orphaned,
  shapeOf,
  unacknowledged,
} from "@epl/core";

// Does the real league answer in the shape the app was built for?
//
// The 10 Oct swap is one environment variable, and every mapper in this repo was
// written against the REHEARSAL league's payloads. Fantrax varies field presence
// between leagues and not only between states — the real league's
// `getLeagueInfo` carries `draftType` and `leagueHistoryId` and the rehearsal
// one carries neither. That was found by hand, once, in August. This finds the
// rest on purpose, and it is the 11:00 item on the ship-day runbook.
//
// The rehearsal league is the REFERENCE because it is what the code was written
// against. The real league is the SUBJECT. The dangerous direction is therefore
// `missing` — a path the reference has and the subject does not is a mapper
// reading `undefined` and a screen quietly showing nothing. Added paths are
// ordinarily harmless, and are printed anyway because "harmless" is a judgement
// a person should make rather than a script.
//
//   npm run shape-diff
//
// Exits non-zero when anything is missing, so CI can gate the swap on it. A
// refusal is NOT a failure: our real league answers NO_TEAMS to most of this
// until draft night, and reporting that as "every field has vanished" would be
// the loudest possible way to say nothing.

const REFERENCE = RECORDED_LEAGUES.find((league) => league.key === SHAPE_DIFF.reference);
const SUBJECT = RECORDED_LEAGUES.find((league) => league.key === SHAPE_DIFF.subject);

/** The period to ask period-scoped reads for. Period 1 rather than "now": this
 *  script compares shapes, and the shape of a period Fantrax has data for is the
 *  one worth comparing. */
const PERIOD = 1;

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
  { method: "getLiveScoringStats", run: (id) => fetchLiveScoring(id, PERIOD) },
];

/** A payload, or the provider's own reason for not giving one. A refusal is a
 *  state, not an error: it is what our real league answers for most of this
 *  until draft night. */
async function read(run: (leagueId: string) => Promise<unknown>, leagueId: string) {
  try {
    return { payload: await run(leagueId) };
  } catch (error) {
    if (error instanceof FantraxError) return { refused: `${error.code}` };
    throw error;
  }
}

async function main() {
  if (!REFERENCE || !SUBJECT) {
    console.error("shape-diff: both leagues named in data/leagues/recorded.json must be listed there");
    process.exitCode = 2;
    return;
  }

  console.log(`shape-diff — reference ${REFERENCE.key}, subject ${SUBJECT.key} (${SUBJECT.leagueId})\n`);

  // Read once, up front. **Every entry has to explain itself.** The whole
  // mechanism is one person's judgement standing in for a check a payload differ
  // cannot make, so an entry nobody wrote a reason for is a blindfold with a
  // filename — and a gate that would run on one has already stopped being a gate.
  // Exit 2: this run could not answer, which is not the same as answering badly.
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
  let refusals = 0;
  let stale = 0;
  // Comparisons MADE, not reads attempted — so it is incremented past both
  // `continue`s below. Without it the exit code cannot tell a clean run from a
  // run that compared nothing.
  let compared = 0;

  for (const { method, run } of READS) {
    const [reference, subject] = await Promise.all([
      read(run, REFERENCE.leagueId),
      read(run, SUBJECT.leagueId),
    ]);

    if (reference.refused !== undefined) {
      // The reference refusing is its own problem: it means this run cannot say
      // anything about that read, in either direction.
      console.log(`~ ${method}\n    reference refused (${reference.refused}) — nothing to compare against`);
      refusals += 1;
      continue;
    }
    if (subject.refused !== undefined) {
      console.log(`~ ${method}\n    subject refused (${subject.refused}) — expected until draft night`);
      refusals += 1;
      continue;
    }

    const { missing, emptied, added } = diffShapes(
      shapeOf(reference.payload),
      shapeOf(subject.payload),
    );
    compared += 1;
    // Counted, never listed: a league that has not drafted answers every table
    // with `[]`, and one line per column would bury the two lines that matter.
    const empty = emptied.length > 0 ? `  (${emptied.length} inside empty collections)` : "";

    const { residue, settled } = unacknowledged(method, missing, baseline);

    if (residue.length === 0 && added.length === 0 && settled.length === 0) {
      console.log(`✓ ${method}${empty}${acknowledged(missing.length)}`);
      continue;
    }

    console.log(`${residue.length > 0 ? "✗" : "+"} ${method}${empty}${acknowledged(missing.length)}`);
    for (const path of residue) console.log(`    MISSING  ${path}`);
    for (const path of added) console.log(`    added    ${path}`);
    // Not a failure — the opposite. A baseline entry that no longer differs is
    // one a person can delete, and saying so is what stops the file growing into
    // a blindfold.
    for (const path of settled) console.log(`    settled  ${path}  (prune from the baseline)`);
    dangerous += residue.length;
    stale += settled.length;
  }

  // "nobody has looked at" and not "the app reads": this script diffs payloads,
  // not mappers, and has no way to check the second claim.
  console.log(
    `\n${dangerous} path${dangerous === 1 ? "" : "s"} the real league does not answer and nobody has looked at` +
      `${refusals > 0 ? `, ${refusals} read${refusals === 1 ? "" : "s"} not comparable` : ""}` +
      `${stale > 0 ? `, ${stale} baseline entr${stale === 1 ? "y" : "ies"} to prune` : ""}.`,
  );

  // **Nothing compared is not nothing wrong.** Every read refusing is what a rate
  // limit, a blocked runner or a league that stopped existing looks like from
  // here, and this is the 11:00 item on a runbook whose next step is a redeploy.
  // It has no standing to give an all-clear it did not earn. Exit 2 rather than
  // 1 because this file already has that vocabulary: 2 is "this run could not
  // answer", 1 is "the answer is bad". Both break a `&&` chain.
  //
  // A PARTIAL refusal still exits 0, deliberately. Today's run refuses one read
  // of nine — the real league's `getTeamRosters` says NO_TEAMS — and reddening
  // on that is exactly the gate that gets switched off long before it matters.
  // Three answers, not two, which is the shape `captureReads` and `bridge:check`
  // were both given for the same reason.
  if (compared === 0) {
    console.error("Compared NOTHING — every read refused. This run says nothing about the swap.");
    process.exitCode = 2;
    return;
  }

  // Non-zero only for the dangerous direction. A league that has not drafted is
  // not a broken league, and a gate that reddened on it would be switched off
  // long before it mattered.
  process.exitCode = dangerous > 0 ? 1 : 0;
}

/** How many of this read's differences were already judged. Printed beside the
 *  tick so a green line still says how much of it is somebody's decision. */
function acknowledged(missing: number): string {
  return missing > 0 ? `  (${missing} acknowledged)` : "";
}

// Not awaited at the top level: these scripts transpile to CJS, and a rejection
// here should crash the run loudly rather than be caught and softened.
void main();
