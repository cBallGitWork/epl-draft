import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type GameweekKickoff,
  datedKickoffs,
  fetchFixtures,
  mapFixtures,
  mapLeagueInfo,
  periodGameweeks,
} from "@epl/core";
import { RECORDED_LEAGUES } from "./leagues";
import { leagueCaptureDir, leagueCaptureRoot } from "./paths";
import { holdsOnlyItsOwn } from "./periods/aligned";
import { newestCapture } from "./snapshots";

// Does each recorded league's scoring period still contain exactly its own FPL gameweek, against the LIVE fixture
// list? A rearranged match stays in FPL's original gameweek and is scored in the period it is played in.
// `calendar.test.ts` asks the same of a recorded season.

/** Fantrax's raw shape, named through the mapper: core keeps it off its public surface. */
type RawLeagueInfo = Parameters<typeof mapLeagueInfo>[0];

async function newestLeagueInfo(leagueKey: string): Promise<RawLeagueInfo> {
  const newest = await newestCapture(leagueCaptureRoot(leagueKey));
  if (newest === null) {
    throw new Error(`No captures for ${leagueKey} — run \`npm run capture\` first.`);
  }
  const path = join(leagueCaptureDir(leagueKey, newest), "getLeagueInfo.json");
  console.log(`${leagueKey}: periods from ${newest}`);
  return JSON.parse(await readFile(path, "utf8")) as RawLeagueInfo;
}

async function main(): Promise<void> {
  const fixtures = mapFixtures(await fetchFixtures());
  const kickoffs: GameweekKickoff[] = datedKickoffs(fixtures);

  console.log(`${fixtures.length} fixtures live from FPL, ${kickoffs.length} dated\n`);

  let mismatched = 0;

  for (const league of RECORDED_LEAGUES) {
    const info = mapLeagueInfo(await newestLeagueInfo(league.key));
    const aligned = periodGameweeks(info.scoringPeriods, kickoffs);

    for (const entry of aligned) {
      const { period, gameweeks } = entry;
      const matches = holdsOnlyItsOwn(entry);
      if (!matches) mismatched += 1;
      const label = gameweeks.length === 0 ? "—" : gameweeks.join(", ");
      console.log(`  period ${String(period).padStart(2)}  gw ${label}${matches ? "" : "   MISMATCH"}`);
    }
    console.log("");
  }

  if (mismatched > 0) {
    console.error(
      `${mismatched} period(s) no longer contain exactly their own gameweek. ` +
        "A fixture has almost certainly been rearranged.",
    );
    process.exitCode = 1;
  } else {
    console.log("Every period contains exactly its own gameweek.");
  }
}

void main();
