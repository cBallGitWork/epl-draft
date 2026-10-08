import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type Bridge,
  ProviderError,
  fetchBootstrap,
  fetchPlayerPool,
  fetchTeamRosters,
  mapPlayerPool,
  mapTeamRosters,
} from "@epl/core";
import { type HoleReason, holeIn } from "./bridge/holes";
import { RECORDED_LEAGUES } from "./leagues";
import { MAPPINGS_ROOT, leagueCaptureRoot } from "./paths";
import { drafted, excused } from "./snapshots";

// Is anybody's actual squad missing a footballer? Each rostered man we cannot resolve is a hole in a squad view, and
// fails: unbridged, assumed-unmapped or absent from FPL. A person's verdict stands. A league whose squads do not
// arrive fails too, unless it refused NO_TEAMS before its draft.   npm run bridge:check

/** What a person does about each kind of hole: `npm run bridge` never revises a mapped row, so absent is by hand. */
const ADVICE: Record<HoleReason, string> = {
  unbridged: "the bridge is stale — run `npm run bridge`",
  "assumed-unmapped": "the matcher found nobody; look, and if it is right, say so in the file",
  absent:
    "FPL no longer lists the code the bridge gives him: he has left the Premier League, or the row is wrong; " +
    "look, and correct it by hand",
};

interface Hole {
  league: string;
  teamName: string;
  fantraxId: string;
  name: string;
  why: HoleReason;
}

async function main() {
  const bridge = JSON.parse(
    await readFile(join(MAPPINGS_ROOT, "fantrax.json"), "utf8"),
  ) as Bridge;
  const [pool, fpl] = await Promise.all([fetchPlayerPool(), fetchBootstrap()]);
  const names = new Map(mapPlayerPool(pool).map((player) => [player.fantraxId, player.displayName]));
  const fplCodes = new Set(fpl.elements.map((element) => element.code));

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
        const why = holeIn(slot.fantraxId, bridge, fplCodes);
        if (why === null) continue;
        // A person's absence, standing: counted so the number is seen rather than silently passed.
        if (why === "audited") {
          audited += 1;
          continue;
        }
        const name = names.get(slot.fantraxId) ?? slot.fantraxId;
        holes.push({ league: league.key, teamName: team.teamName, fantraxId: slot.fantraxId, name, why });
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
    console.log("");
    for (const why of new Set(holes.map((hole) => hole.why))) console.log(`${why}: ${ADVICE[why]}.`);
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
