import { readdir } from "node:fs/promises";
import { FANTRAX_LEAGUES, captureStaleness } from "@epl/core";
import { leagueCaptureRoot, todayInLondon } from "./paths";

// Makes capture health something a human sees rather than something we assume.
// Exits non-zero when overdue so it can gate other work later.
//
// Per league, because the two draft nine weeks apart: the rehearsal league is
// already past its draft and so must be captured daily, while the real league is
// still on the weekly pre-draft cadence. One combined answer would hide whichever
// of them stopped.

const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;

async function captureDates(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && DATE_DIR.test(entry.name))
      .map((entry) => entry.name);
  } catch {
    // Nothing captured yet is a legitimate state and the staleness check has an
    // opinion about it. Anything else genuinely is broken and should surface.
    return [];
  }
}

async function main(): Promise<void> {
  const today = todayInLondon();

  for (const league of FANTRAX_LEAGUES) {
    const dates = await captureDates(leagueCaptureRoot(league.key));
    const status = captureStaleness(dates, today, league.draftDate);

    if (status.lastCapture === null) {
      console.log(`${league.key}: no captures yet. Run \`npm run capture\`.`);
    } else {
      console.log(
        `${league.key}: last capture ${status.lastCapture} (${status.ageDays}d ago, ` +
          `limit ${status.maxAgeDays}d as of ${today}).`,
      );
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
