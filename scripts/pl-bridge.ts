import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SEASON, fetchPlFixture, fetchPlRound } from "@epl/core";
import { MAPPINGS_ROOT } from "./paths";

// Builds the Premier League player id → Opta code map that the Live tab's wire
// joins through. Run it after a round: `npm run pl-bridge`.
//
// **Harvested from TEAM SHEETS, and that is the whole point of the script.**
// `/football/players?compSeasons=…` is the obvious source and is incomplete:
// counted 4 Sep 2026 against every player named in the 2,215 events of
// gameweeks 1-3, it misses 20 of the 360 who appear — 14 of them in a goal, a
// card or a substitution, one of them a scorer. Every one of the twenty is on a
// team sheet, and not one was an id mismatch; the collection simply lags squad
// registration. So the sheets are the source and the collection is a top-up for
// men who have not played yet.
//
// It ACCUMULATES. The file is read, added to and rewritten, because a team sheet
// is only published for a match that has been played and no single run can see a
// season. Nothing is ever removed: an id that appeared once may be named by an
// event forever.
//
// The map persists the Premier League's id against Opta's code, and neither is
// FPL's per-season `id` — the FPL half of the chain is re-derived in memory on
// every request from `FootballPlayer.optaCode`, which is on all 652. So nothing
// season-scoped is written to disk (CODE_RULES §3).

const PATH = join(MAPPINGS_ROOT, "premierleague.json");

interface PlBridge {
  season: string;
  /** Premier League player id → Opta code. */
  players: Record<string, string>;
}

async function existing(): Promise<PlBridge> {
  try {
    const parsed = JSON.parse(await readFile(PATH, "utf8")) as PlBridge;
    // A file from a previous season is not a file to add to: the ids are the
    // Premier League's own and we have not probed whether they survive a summer.
    return parsed.season === SEASON ? parsed : { season: SEASON, players: {} };
  } catch {
    // No file yet is the ordinary first run, not a failure to swallow.
    return { season: SEASON, players: {} };
  }
}

async function main(): Promise<void> {
  const rounds = Number(process.argv[2] ?? 38);
  const bridge = await existing();
  const before = Object.keys(bridge.players).length;
  let sheets = 0;

  for (let gameweek = 1; gameweek <= rounds; gameweek++) {
    const round = await fetchPlRound(gameweek);
    const played = round.content.filter((f) => f.status !== "U");
    if (played.length === 0) continue;

    for (const fixture of played) {
      const detail = await fetchPlFixture(fixture.id);
      for (const list of detail.teamLists ?? []) {
        // A side nobody has named is a null ENTRY in a two-long array, not an
        // absent array (`RawPlFixture.teamLists`). It never reached here — the
        // `status !== "U"` filter above sees to that — but it was counted as a
        // sheet and then read straight into, so the guard is the honest form of
        // the filter's promise and the harvest count stops over-reporting.
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
  // The number that matters is the one nobody can see: a man named by an event
  // who is not in here renders as `?` beside a goal somebody in the league owns.
  console.log("Re-run after every round. A miss is a goal with no owner beside it.");
}

void main();
