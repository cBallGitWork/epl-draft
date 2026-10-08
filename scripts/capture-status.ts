import { captureStaleness } from "@epl/core";
import { RECORDED_LEAGUES } from "./leagues";
import { leagueCaptureDir, leagueCaptureRoot, todayInLondon } from "./paths";
import { captureDates, captureReads, drafted, excused } from "./snapshots";

// Whether each recorded league is still being captured, and whether its newest day recorded every read; non-zero when
// not. Per league, because each drafts on its own day and one combined answer would hide whichever stopped.

async function main(): Promise<void> {
  const today = todayInLondon();

  for (const league of RECORDED_LEAGUES) {
    const root = leagueCaptureRoot(league.key);
    const dates = await captureDates(root);
    const isDrafted = await drafted(root);
    const status = captureStaleness(dates, today, isDrafted);

    if (status.lastCapture === null) {
      console.log(`${league.key}: no captures yet. Run \`npm run capture\`.`);
    } else {
      console.log(
        `${league.key}: last capture ${status.lastCapture} (${status.ageDays}d ago, ` +
          `cadence ${status.cadenceDays}d as of ${today}).`,
      );
    }

    // A dated directory is not a capture: it is made before the first read, so only the manifest says what landed.
    if (status.lastCapture !== null) {
      const reads = await captureReads(leagueCaptureDir(league.key, status.lastCapture));
      if (reads === null) {
        console.error(`${league.key}: ${status.lastCapture} has no readable manifest.`);
        process.exitCode = 1;
      } else if (reads.ok === 0) {
        console.error(
          `${league.key}: ${status.lastCapture} recorded NOTHING — all ${reads.failed.length} reads ` +
            "failed. The day is on disk and the league state is not.",
        );
        process.exitCode = 1;
      } else {
        const lost = reads.failed.filter((read) => !excused(read.code, isDrafted));
        if (lost.length > 0) {
          const named = lost.map((read) => `${read.method} (${read.code ?? "no code"})`).join(", ");
          console.error(`${league.key}: ${status.lastCapture} failed ${named}, and a missed read cannot be backfilled.`);
          process.exitCode = 1;
        } else if (reads.failed.length > 0) {
          const refused = reads.failed.map((read) => read.method).join(", ");
          console.log(`  ${reads.ok} reads recorded; ${refused} refused NO_TEAMS, as before the draft.`);
        }
      }
    }

    if (status.overdue) {
      console.error(
        `${league.key}: OVERDUE — league state is not being recorded. ` +
          "This history cannot be backfilled.",
      );
      process.exitCode = 1;
    }
  }
}

void main();
