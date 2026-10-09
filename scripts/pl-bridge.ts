import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SEASON, fetchPlFixture, fetchPlRound } from "@epl/core";
import { MAPPINGS_ROOT } from "./paths";
import { heldBridge } from "./plBridge/held";

// The Premier League player id → Opta code map the Live tab's wire joins through, harvested from team sheets, which
// name every man an event can (the players collection lags registration). It accumulates and never removes an id;
// neither id is FPL's per-season one.   npm run pl-bridge, after a round.

const PATH = join(MAPPINGS_ROOT, "premierleague.json");

async function main(): Promise<void> {
  const rounds = Number(process.argv[2] ?? 38);
  const bridge = await heldBridge(PATH, SEASON);
  const before = Object.keys(bridge.players).length;
  let sheets = 0;

  for (let gameweek = 1; gameweek <= rounds; gameweek++) {
    const round = await fetchPlRound(gameweek);
    const played = round.content.filter((f) => f.status !== "U");
    if (played.length === 0) continue;

    for (const fixture of played) {
      const detail = await fetchPlFixture(fixture.id);
      for (const list of detail.teamLists ?? []) {
        // A side nobody has named is a null entry in the two-long array, not an absent array.
        if (list === null) continue;
        sheets++;
        for (const player of [...list.lineup, ...list.substitutes]) {
          const opta = player.altIds?.opta;
          if (opta !== undefined) bridge.players[String(player.id)] = opta;
        }
      }
    }
    console.log(`gameweek ${gameweek}: ${played.length} played`);
  }

  const added = Object.keys(bridge.players).length - before;
  await mkdir(MAPPINGS_ROOT, { recursive: true });
  await writeFile(PATH, `${JSON.stringify(bridge, null, 1)}\n`, "utf8");

  console.log(
    `\n${sheets} team sheets → ${Object.keys(bridge.players).length} players ` +
      `(${added} new). Written to ${PATH}`,
  );
  // A man an event names who is not in here renders as `?` beside a goal somebody owns.
  console.log("Re-run after every round. A miss is a goal with no owner beside it.");
}

void main();
