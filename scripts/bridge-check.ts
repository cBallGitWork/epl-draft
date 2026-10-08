import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type Bridge,
  ProviderError,
  fetchPlayerPool,
  fetchTeamRosters,
  isAssumed,
  isUnmapped,
  mapPlayerPool,
  mapTeamRosters,
} from "@epl/core";
import { RECORDED_LEAGUES } from "./leagues";
import { MAPPINGS_ROOT, leagueCaptureRoot } from "./paths";
import { drafted, excused } from "./snapshots";

// Is anybody's actual squad missing a footballer? Each rostered man we cannot resolve is a hole in a squad view.
// Unbridged (the bridge is stale) and assumed-unmapped (the matcher's guess) fail; a person's verdict stands. A league
// whose squads do not arrive fails too, unless it refused NO_TEAMS before its draft.   npm run bridge:check

interface Hole {
  league: string;
  teamName: string;
  fantraxId: string;
  name: string;
  why: "unbridged" | "assumed-unmapped";
}

async function main() {
  const bridge = JSON.parse(
    await readFile(join(MAPPINGS_ROOT, "fantrax.json"), "utf8"),
  ) as Bridge;
  const pool = mapPlayerPool(await fetchPlayerPool());
  const names = new Map(pool.map((player) => [player.fantraxId, player.displayName]));

  const holes: Hole[] = [];
  const unread: string[] = [];
  let rostered = 0;
  let audited = 0;

  for (const league of RECORDED_LEAGUES) {
    let teams;
    try {
      teams = mapTeamRosters(await fetchTeamRosters(league.leagueId)).teams;
    } catch (error) {
      if (!(error instanceof ProviderError)) throw error;
      if (excused(error.code, await drafted(leagueCaptureRoot(league.key)))) {
        console.log(`~ ${league.key}: ${error.code} before its draft — nobody holds anybody yet`);
      } else {
        console.error(`✗ ${league.key}: ${error.message}`);
        unread.push(`${league.key} (${error.code})`);
      }
      continue;
    }

    for (const team of teams) {
      for (const slot of team.slots) {
        rostered += 1;
        const entry = bridge[slot.fantraxId];
        const name = names.get(slot.fantraxId) ?? slot.fantraxId;

        if (entry === undefined) {
          holes.push({ league: league.key, teamName: team.teamName, fantraxId: slot.fantraxId, name, why: "unbridged" });
          continue;
        }
        if (!isUnmapped(entry)) continue;
        if (isAssumed(entry)) {
          holes.push({ league: league.key, teamName: team.teamName, fantraxId: slot.fantraxId, name, why: "assumed-unmapped" });
          continue;
        }
        // A person's absence, standing: counted so the number is seen rather than silently passed.
        audited += 1;
      }
    }
    console.log(`  ${league.key}: ${teams.length} squads`);
  }

  console.log(`\n${rostered} rostered slots checked.`);
  if (audited > 0) {
    console.log(`${audited} of them are absences a person confirmed, which stand.`);
  }

  if (holes.length > 0) {
    console.log(`\n${holes.length} rostered player${holes.length === 1 ? "" : "s"} unresolved:\n`);
    for (const hole of holes) {
      console.log(`  ${hole.why.padEnd(17)} ${hole.name.padEnd(24)} ${hole.teamName} (${hole.league}) [${hole.fantraxId}]`);
    }
    console.log(
      `\nUnbridged means the bridge is stale — run \`npm run bridge\`. Assumed-unmapped` +
        ` means the matcher found nobody; look, and if it is right, say so in the file.`,
    );
    process.exitCode = 1;
  } else if (rostered > 0) {
    console.log(
      unread.length === 0
        ? "No holes: every player anybody holds resolves to a footballer."
        : "No holes in the squads that arrived.",
    );
  } else if (unread.length === 0) {
    // Nobody checked is not everybody clear, so this never claims "no holes".
    console.log("Nothing to check: no league has a rostered player yet.");
  }

  if (unread.length > 0) {
    console.error(`\nFAILED: squads not read for ${unread.join(", ")}; only NO_TEAMS before a league's draft may stand.`);
    process.exitCode = 1;
  }
}

// A provider's failure is one line and exit 1; a fault of our own still crashes loudly.
void main().catch((error: unknown) => {
  if (!(error instanceof ProviderError)) throw error;
  console.error(`✗ bridge:check could not read: ${error.message}`);
  process.exitCode = 1;
});
