import {
  FANTRAX_LEAGUES,
  FantraxError,
  diffShapes,
  fetchDraftResults,
  fetchLeagueInfo,
  fetchLiveScoring,
  fetchSeasonResults,
  fetchStandings,
  fetchTeamBadges,
  fetchTeamRosters,
  fetchTransactions,
  shapeOf,
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

const REFERENCE = FANTRAX_LEAGUES.find((league) => league.key === "rehearsal");
const SUBJECT = FANTRAX_LEAGUES.find((league) => league.key === "real");

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
  { method: "fxpa getStandings (badges)", run: fetchTeamBadges },
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
    console.error("shape-diff: both leagues must be declared in FANTRAX_LEAGUES");
    process.exitCode = 2;
    return;
  }

  console.log(`shape-diff — reference ${REFERENCE.key}, subject ${SUBJECT.key} (${SUBJECT.leagueId})\n`);

  let dangerous = 0;
  let refusals = 0;

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
    // Counted, never listed: a league that has not drafted answers every table
    // with `[]`, and one line per column would bury the two lines that matter.
    const empty = emptied.length > 0 ? `  (${emptied.length} inside empty collections)` : "";

    if (missing.length === 0 && added.length === 0) {
      console.log(`✓ ${method}${empty}`);
      continue;
    }

    console.log(`${missing.length > 0 ? "✗" : "+"} ${method}${empty}`);
    for (const path of missing) console.log(`    MISSING  ${path}`);
    for (const path of added) console.log(`    added    ${path}`);
    dangerous += missing.length;
  }

  console.log(
    `\n${dangerous} path${dangerous === 1 ? "" : "s"} the app reads and the real league does not answer` +
      `${refusals > 0 ? `, ${refusals} read${refusals === 1 ? "" : "s"} not comparable` : ""}.`,
  );

  // Non-zero only for the dangerous direction. A league that has not drafted is
  // not a broken league, and a gate that reddened on it would be switched off
  // long before it mattered.
  process.exitCode = dangerous > 0 ? 1 : 0;
}

// Not awaited at the top level: these scripts transpile to CJS, and a rejection
// here should crash the run loudly rather than be caught and softened.
void main();
