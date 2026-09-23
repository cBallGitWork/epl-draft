import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fetchBootstrap, roundPlayed, shotIntel, squadIntel, touchIntel, xiFault } from "@epl/core";
import type { IntelShots, IntelSquads, IntelTouches, IntelXi } from "@epl/core";
import { INTEL_ROOT } from "./paths";
import { INTEL_SEASON } from "./intel";

// How old the intel is, and whether it still says what the app assumes.
//
// **Nothing in this repo can make it fresher.** The export is written by
// `make export-epl-draft` in `~/ai-carling-premiership`, so the least this side
// can do is say plainly when what it is serving has gone stale — the same
// argument `capture-status.ts` makes for the snapshots, and the same exit code,
// so a workflow or a hook can gate on it.
//
// The check that matters most is the LAST one: the predicted eleven is for a
// named round, and once that round has been played the file is not stale so much
// as wrong. A pitch drawn from last week's team sheet under this week's heading
// is the failure nobody notices.

async function main(): Promise<void> {
  const squadsPath = join(INTEL_ROOT, "squads", `${INTEL_SEASON}.json`);
  const squads = read<IntelSquads>(squadsPath);
  if (squads === null) {
    console.error("no squads export — run `make export-epl-draft` in the sister repo.");
    process.exitCode = 1;
    return;
  }

  const players = squadIntel(squads);
  const real = [...players.values()].filter((player) => player.position !== null).length;
  const numbers = [...players.values()].filter((player) => player.squadNumber !== null).length;
  const cleared = squads.manifest.numberCollisions ?? 0;

  console.log(`squads: ${players.size} players, exported ${age(squads.manifest.exportedAt)}`);
  console.log(`  ${real} with a real position, ${players.size - real} FPL's own guess`);
  // Reported and not resolved: the source has genuine duplicates — three
  // Manchester City players all claim 8 — so there is no tie-break that is not a
  // guess, and a guess that deletes numbers a club actually wears is worse than
  // printing what the source says. A rising count is the tell that the upstream
  // squad numbers are getting worse.
  console.log(
    `  ${numbers} squad numbers` +
      (cleared > 0 ? `, ${cleared} of them shared with a club-mate` : ""),
  );
  for (const source of squads.manifest.sources) {
    console.log(`  built from ${source.path} (${age(source.mtime)})`);
  }

  checkTouches();
  checkShots();

  // One rolling file, the latest Scout has; its round is in the manifest.
  const xiPath = join(INTEL_ROOT, "xi", `${INTEL_SEASON}.json`);
  const xi = read<IntelXi>(xiPath);
  if (xi === null) {
    console.error(`\nno predicted eleven exported, or xi/${INTEL_SEASON}.json will not parse.`);
    process.exitCode = 1;
    return;
  }
  const round = xi.manifest?.gameweek;
  if (typeof round !== "number") {
    console.error("\nthe predicted eleven names no round.");
    process.exitCode = 1;
    return;
  }

  console.log(`\nxi: gameweek ${round}, ${Object.keys(xi.clubs).length} clubs`);
  console.log(`  ${xi.source ?? "unnamed source"} fetched ${age(xi.fetchedAt)}`);

  // Every club an eleven, in the shape it says it plays. Checked here as well as
  // in the exporter because the two run in different repos on different days.
  const faults = Object.entries(xi.clubs)
    .map(([club, entry]) => [club, xiFault(entry)] as const)
    .filter(([, fault]) => fault !== null);
  if (faults.length > 0) {
    for (const [club, fault] of faults) console.error(`  ✗ ${club}: ${fault}`);
    process.exitCode = 1;
  } else {
    console.log("  every club is an eleven.");
  }

  // The one that makes this file worth running: is the prediction for a round
  // whose football has already been played?
  //
  // **`finished`, and not `is_next`, which is what this asked until 5 Sep 2026.**
  // FPL flips `is_next` the moment a deadline passes, so from Friday teatime it
  // names the round AFTER the one being played — and this check called Saturday's
  // own prediction "wrong" every single matchday, which is how a check trains the
  // person reading it to ignore it. Verified live that day: GW3 `is_current` with
  // ten matches in play, `is_next` already 4.
  const played = await askFpl(round);
  if (played === null) {
    console.log("  FPL would not say whether that round has been played, so the age is unchecked.");
  } else if (played) {
    console.error(
      `  ✗ this eleven is for gameweek ${round}, whose football has been played. The club ` +
        "pages still draw it under its last-updated date, and the paper will not print it. Re-run the export.",
    );
    process.exitCode = 1;
  } else {
    console.log(`  gameweek ${round} still has football to come.`);
  }
}

/** The touch clouds behind the comparison heat maps.
 *
 *  **Absent is a WARNING and not a failure**, unlike the squads. The maps are one
 *  section of one screen and it says so itself when there is nothing to draw;
 *  the squad export is the football layer's real position for the whole app.
 *
 *  The count worth printing is players rather than points, because that is the
 *  one a reader can judge: 367 of about 650 is what a bridge covering the men
 *  who have actually played looks like, and a number that falls is the tell that
 *  the SofaScore join is rotting. */
function checkTouches(): void {
  const path = join(INTEL_ROOT, "touches", `${INTEL_SEASON}.json`);
  const touches = read<IntelTouches>(path);
  if (touches === null) {
    console.log("\ntouches: no export — the comparison heat maps will be empty.");
    return;
  }
  const players = touchIntel(touches);
  const points = touches.manifest.rows;
  console.log(
    `\ntouches: ${players.size} players, ${points} points, ` +
      `exported ${age(touches.manifest.exportedAt)}`,
  );
  for (const source of touches.manifest.sources) {
    console.log(`  built from ${source.path} (${age(source.mtime)})`);
  }
}

/** The shots behind the analysis screen's map and the match screen's.
 *
 *  **It shipped without a line here**, which the export contract requires in the
 *  same commit as a file's first reader — `intel.ts` has read it since 10 Sep and
 *  this script checked squads, xi and touches only. Added when the match screen
 *  became its second reader.
 *
 *  A WARNING and not a failure, for `checkTouches`' reason. The count worth
 *  printing is FIXTURES rather than shots: a season's shot total only ever goes
 *  up, so it cannot tell you the export has stopped, and the round it reaches
 *  can. */
function checkShots(): void {
  const path = join(INTEL_ROOT, "shots", `${INTEL_SEASON}.json`);
  const shots = read<IntelShots>(path);
  if (shots === null) {
    console.log("\nshots: no export — the shot maps will be empty.");
    return;
  }
  const byCode = shotIntel(shots);
  const taken = [...byCode.values()].flat();
  const fixtures = new Set(taken.map((shot) => shot.fplFixtureId)).size;
  console.log(
    `\nshots: ${taken.length} shots, ${byCode.size} players, ${fixtures} fixtures, ` +
      `exported ${age(shots.manifest.exportedAt)}`,
  );
  for (const source of shots.manifest.sources) {
    console.log(`  built from ${source.path} (${age(source.mtime)})`);
  }
}

/** Whether FPL has finished the round this export predicts, or null when it will
 *  not answer. Not fatal: this script's other answers are still true without the
 *  network. The judgement is `roundPlayed` in core, where it is tested. */
async function askFpl(round: number): Promise<boolean | null> {
  try {
    return roundPlayed(await fetchBootstrap(), round);
  } catch {
    return null;
  }
}

/** A committed JSON file, or null when it is absent or will not parse. Both are
 *  ordinary here — the export is written by another repo and may not have run. */
function read<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

/** "3 hours ago", or that nothing said. */
function age(at: string | null | undefined): string {
  if (!at) return "at an unrecorded time";
  const when = new Date(at).getTime();
  if (Number.isNaN(when)) return "at an unreadable time";
  const hours = Math.floor((Date.now() - when) / 3_600_000);
  if (hours < 1) return "less than an hour ago";
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

void main();
