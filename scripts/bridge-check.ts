import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  FantraxError,
  type Bridge,
  fetchPlayerPool,
  fetchTeamRosters,
  isAssumed,
  isUnmapped,
  mapPlayerPool,
  mapTeamRosters,
} from "@epl/core";
import { RECORDED_LEAGUES } from "./leagues";
import { MAPPINGS_ROOT } from "./paths";

// Is anybody's actual squad missing a footballer?
//
// The bridge covers 688 Fantrax players and about 120 of them have no FPL
// counterpart, which is a correct answer rather than a failure — Fantrax carries
// academy names FPL has never listed. That 78% is not the number that matters.
// **The number that matters is how many of the players somebody actually holds
// we cannot resolve**, because each one is a hole in a squad view.
//
// ROADMAP §6 asks for a gate on it, and this is it. `npm run bridge` reports
// totals and has never answered this question.
//
// What fails, and what does not:
//
// - **Unbridged** — the bridge has never seen this id. Somebody joined the pool
//   since the last `npm run bridge`. Always a fault, always fixable by running it.
// - **Assumed unmapped** — the script looked and found nobody. Revisable by
//   construction (`isAssumed`), and FPL adds players all window: three of the
//   first residue recorded were in FPL a week later. On a rostered player this
//   fails, because a manager is looking at the hole.
// - **A person's verdict** — `unmappedBy: "manual"`, or any row carrying
//   `auditedAt`. Passes. A person looked and the script did not, and this gate
//   has no standing to reopen that.
//
//   npm run bridge:check

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
  let rostered = 0;
  let audited = 0;

  for (const league of RECORDED_LEAGUES) {
    let teams;
    try {
      teams = mapTeamRosters(await fetchTeamRosters(league.leagueId)).teams;
    } catch (error) {
      if (!(error instanceof FantraxError)) throw error;
      // Our real league answers NO_TEAMS until draft night. A league with nobody
      // in it has nobody unresolved, which is a pass and not a skip.
      console.log(`~ ${league.key}: ${error.code} — no squads to check`);
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
        // A person's absence, standing. Counted so the number is visible rather
        // than silently passing.
        audited += 1;
      }
    }
    console.log(`  ${league.key}: ${teams.length} squads`);
  }

  console.log(`\n${rostered} rostered slots checked.`);
  if (audited > 0) {
    console.log(`${audited} of them are absences a person confirmed, which stand.`);
  }

  // Nobody checked is not everybody clear. Both leagues answering `NO_TEAMS` is
  // the real league's state every day until 10 Oct, and on the morning of the
  // draft this gate would otherwise have reported all-clear having looked at
  // nobody — in CI, on the one push where somebody might believe it.
  if (rostered === 0) {
    console.log("Nothing to check: no league has a rostered player yet.");
    return;
  }

  if (holes.length === 0) {
    console.log("No holes: every player anybody holds resolves to a footballer.");
    return;
  }

  console.log(`\n${holes.length} rostered player${holes.length === 1 ? "" : "s"} unresolved:\n`);
  for (const hole of holes) {
    console.log(`  ${hole.why.padEnd(17)} ${hole.name.padEnd(24)} ${hole.teamName} (${hole.league}) [${hole.fantraxId}]`);
  }
  console.log(
    `\nUnbridged means the bridge is stale — run \`npm run bridge\`. Assumed-unmapped` +
      ` means the matcher found nobody; look, and if it is right, say so in the file.`,
  );
  process.exitCode = 1;
}

// Not awaited at the top level: these scripts transpile to CJS, and a rejection
// here should crash the run loudly rather than be caught and softened.
void main();
