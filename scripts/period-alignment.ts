import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  FANTRAX_LEAGUES,
  type GameweekKickoff,
  fetchFixtures,
  mapFixtures,
  mapLeagueInfo,
  periodGameweeks,
} from "@epl/core";
import { leagueCaptureDir, leagueCaptureRoot } from "./paths";

// Does each Fantrax scoring period still contain exactly its own FPL gameweek?
//
// `calendar.test.ts` answers that against a recorded season and is the assertion
// that gates a commit. This asks the same question of the LIVE fixture list, which
// the recorded one cannot: the Premier League reschedules, and a postponed fixture
// is the known way the two calendars come apart — FPL keeps a rearranged match in
// its original `event`, Fantrax scores it in the period it was actually played.
//
// Run it per league, because scoring periods are league state. Both leagues carry
// byte-identical periods today, but that is default settings rather than a rule.

const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;

// The raw shape is deliberately not on core's public surface — the whole point of
// `league/index.ts` is that nothing outside the adapter knows Fantrax's field
// names. A script reading captured JSON off disk is the one place that has to,
// and naming it through the mapper keeps the two in step.
type RawLeagueInfo = Parameters<typeof mapLeagueInfo>[0];

async function newestLeagueInfo(leagueKey: string): Promise<RawLeagueInfo> {
  const entries = await readdir(leagueCaptureRoot(leagueKey), { withFileTypes: true });
  const newest = entries
    .filter((entry) => entry.isDirectory() && DATE_DIR.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .at(-1);
  if (newest === undefined) {
    throw new Error(`No captures for ${leagueKey} — run \`npm run capture\` first.`);
  }
  const path = join(leagueCaptureDir(leagueKey, newest), "getLeagueInfo.json");
  console.log(`${leagueKey}: periods from ${newest}`);
  return JSON.parse(await readFile(path, "utf8")) as RawLeagueInfo;
}

async function main(): Promise<void> {
  const fixtures = mapFixtures(await fetchFixtures());
  const kickoffs: GameweekKickoff[] = fixtures
    .filter((fixture) => fixture.gameweek != null && fixture.kickoff != null)
    .map((fixture) => ({ gameweek: fixture.gameweek as number, kickoff: fixture.kickoff as string }));

  console.log(`${fixtures.length} fixtures live from FPL, ${kickoffs.length} dated\n`);

  let mismatched = 0;

  for (const league of FANTRAX_LEAGUES) {
    const info = mapLeagueInfo(await newestLeagueInfo(league.key));
    const aligned = periodGameweeks(info.scoringPeriods, kickoffs);

    for (const { period, gameweeks } of aligned) {
      const matches = gameweeks.length === 1 && gameweeks[0] === period;
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
