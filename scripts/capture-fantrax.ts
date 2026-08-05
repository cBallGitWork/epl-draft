import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  fetchDraftResults,
  fetchLeagueInfo,
  fetchPlayerPool,
  fetchStandings,
  fetchTeamRosters,
} from "@epl/core";
import { SNAPSHOT_ROOT, captureDir, todayInLondon } from "./paths";

// Records what Fantrax says about our league today, verbatim, into a dated
// directory. Raw only — no mapping, no derivation. What we can parse later is a
// function of what we kept, and the cheapest way to be wrong about that is to
// decide now which fields matter.
//
// This is the substrate for everything longitudinal: diffing consecutive days is
// what will eventually say "dropped by the same manager three times". Fantrax
// serves current state only, so that history exists only if we write it down.

const READS = [
  { method: "getLeagueInfo", run: () => fetchLeagueInfo(FANTRAX_LEAGUE_ID) },
  { method: "getTeamRosters", run: () => fetchTeamRosters(FANTRAX_LEAGUE_ID) },
  { method: "getStandings", run: () => fetchStandings(FANTRAX_LEAGUE_ID) },
  { method: "getDraftResults", run: () => fetchDraftResults(FANTRAX_LEAGUE_ID) },
  { method: "getPlayerIds", run: () => fetchPlayerPool() },
] as const;

interface ReadOutcome {
  method: string;
  ok: boolean;
  /** Fantrax's error code when it refused. `NO_TEAMS` before the draft is
   *  expected, not a fault — the manifest records it either way. */
  code?: string;
  message?: string;
  bytes?: number;
}

async function main(): Promise<void> {
  const date = todayInLondon();
  const dir = captureDir(date);
  await mkdir(dir, { recursive: true });

  const outcomes: ReadOutcome[] = [];

  for (const { method, run } of READS) {
    try {
      const body = await run();
      const json = `${JSON.stringify(body, null, 2)}\n`;
      await writeFile(join(dir, `${method}.json`), json);
      outcomes.push({ method, ok: true, bytes: json.length });
      console.log(`  ${method}: ${json.length} bytes`);
    } catch (error) {
      // One read failing must not cost us the other four. A partial capture is
      // worth having; a silent one is not, so the failure goes in the manifest.
      if (!(error instanceof FantraxError)) throw error;
      outcomes.push({ method, ok: false, code: error.code, message: error.message });
      console.log(`  ${method}: ${error.code}`);
    }
  }

  const manifest = { capturedAt: new Date().toISOString(), leagueId: FANTRAX_LEAGUE_ID, reads: outcomes };
  await writeFile(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const failed = outcomes.filter((outcome) => !outcome.ok).length;
  console.log(`\nCaptured ${outcomes.length - failed}/${outcomes.length} reads to ${dir.replace(SNAPSHOT_ROOT, "data/snapshots/fantrax")}`);
}

// Not awaited at the top level: these scripts transpile to CJS, and a rejection
// here should crash the run loudly rather than be caught and softened.
void main();
