import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { captureStaleness } from "@epl/core";
import { RECORDED_LEAGUES } from "./leagues";
import { leagueCaptureDir, leagueCaptureRoot, todayInLondon } from "./paths";
import { captureDates, captureReads } from "./snapshots";

// Makes capture health something a human sees rather than something we assume.
// Exits non-zero when overdue so it can gate other work later.
//
// Per league, because each drafts on its own day: a drafted league is captured
// daily, one still waiting on the weekly cadence. One combined answer would hide
// whichever of them stopped.

/** Whether Fantrax said this league had drafted, in the newest capture that recorded its draft. */
async function drafted(key: string, dates: readonly string[]): Promise<boolean> {
  for (const date of [...dates].sort().reverse()) {
    const raw = await readFile(join(leagueCaptureDir(key, date), "getDraftResults.json"), "utf8").catch(() => null);
    if (raw !== null) return (JSON.parse(raw) as { draftState?: string }).draftState === "completed";
  }
  return false;
}

async function main(): Promise<void> {
  const today = todayInLondon();

  for (const league of RECORDED_LEAGUES) {
    const dates = await captureDates(leagueCaptureRoot(league.key));
    const status = captureStaleness(dates, today, await drafted(league.key, dates));

    if (status.lastCapture === null) {
      console.log(`${league.key}: no captures yet. Run \`npm run capture\`.`);
    } else {
      console.log(
        `${league.key}: last capture ${status.lastCapture} (${status.ageDays}d ago, ` +
          `cadence ${status.cadenceDays}d as of ${today}).`,
      );
    }

    // A date is not a capture. `capture-fantrax` makes the directory before the
    // first read and writes a manifest whatever happens, so a day Fantrax
    // refused end to end looks exactly like a day it answered — and this
    // watchdog, which counts directories, called it `0d ago`. The manifest says
    // which it was.
    if (status.lastCapture !== null) {
      const reads = await captureReads(leagueCaptureDir(league.key, status.lastCapture));
      if (reads === null) {
        console.error(`${league.key}: ${status.lastCapture} has no readable manifest.`);
        process.exitCode = 1;
      } else if (reads.ok === 0) {
        console.error(
          `${league.key}: ${status.lastCapture} recorded NOTHING — all ${reads.failed} reads ` +
            "failed. The day is on disk and the league state is not.",
        );
        process.exitCode = 1;
      } else if (reads.failed > 0) {
        // Not a failure: the real league refuses `getTeamRosters` with NO_TEAMS
        // every day until 10 Oct, and that is a true answer about the league.
        console.log(`  ${reads.ok} reads recorded, ${reads.failed} refused.`);
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
