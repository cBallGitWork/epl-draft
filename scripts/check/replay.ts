import { existsSync } from "node:fs";
import { LEAGUES_ROOT, LEAGUE_LIMITS, leagueCaptureRoot } from "../paths";
import { leagueKeys, replayLeague } from "./fingerprints";

// Every captured Fantrax read through its core mapper, one sha256 per file: identical output on main and a branch is
// proof no mapper's output moved.   npm run check:replay > main.txt, again on the branch, then diff the two

async function main(): Promise<void> {
  const missing = [LEAGUES_ROOT, LEAGUE_LIMITS].filter((path) => !existsSync(path));
  if (missing.length > 0) {
    console.error(`Nothing to replay: ${missing.join(" and ")} missing.`);
    process.exitCode = 2;
    return;
  }

  // Imported here, not above: it reads data/leagues/recorded.json, which the check above guards.
  const { RECORDED_LEAGUES } = await import("../leagues");
  const keys = await leagueKeys(
    RECORDED_LEAGUES.map((league) => league.key),
    LEAGUES_ROOT,
  );

  let replayed = 0;
  for (const key of keys) {
    for (const line of await replayLeague(key, leagueCaptureRoot(key))) {
      console.log(line);
      replayed += 1;
    }
  }
  console.log(`${replayed} captured reads replayed`);
}

void main();
