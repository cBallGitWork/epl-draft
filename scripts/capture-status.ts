import { readdir } from "node:fs/promises";
import { DRAFT_DATE, captureStaleness } from "@epl/core";
import { SNAPSHOT_ROOT, todayInLondon } from "./paths";

// Makes capture health something a human sees rather than something we assume.
// Exits non-zero when overdue so it can gate other work later.

const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;

async function captureDates(): Promise<string[]> {
  try {
    const entries = await readdir(SNAPSHOT_ROOT, { withFileTypes: true });
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
  const status = captureStaleness(await captureDates(), today, DRAFT_DATE);

  if (status.lastCapture === null) {
    console.log("No Fantrax captures yet. Run `npm run capture`.");
  } else {
    console.log(
      `Last Fantrax capture ${status.lastCapture} (${status.ageDays}d ago, ` +
        `limit ${status.maxAgeDays}d as of ${today}).`,
    );
  }

  if (status.overdue) {
    console.error(
      "OVERDUE — league state is not being recorded. This history cannot be backfilled.",
    );
    process.exitCode = 1;
  }
}

void main();
