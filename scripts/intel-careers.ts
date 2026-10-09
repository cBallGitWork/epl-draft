import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fetchBootstrap, type IntelCareers } from "@epl/core";
import { INTEL_SEASON, intelManifest, writeIntel } from "./intel";
import { SISTER_ROOT } from "./paths";

// Each man's club in every season the sister's identity store holds, keyed on FPL's code, into `data/intel/careers/`
// (`intel-export.md` §7). Reads the sister repo and never writes to it; `scripts/sync-intel.sh weekly` runs it.

const PLAYERS = "data/identity/persons/players/seasons";
const TEAMS = "data/identity/teams/seasons";

interface PersonFile {
  root_id?: string;
  current_team_id?: string;
  source_mappings?: { fpl?: string };
}

/** Every JSON file in one season's folder, by its name without `.json`. */
function season(dir: string): Map<string, Record<string, unknown>> {
  const files = new Map<string, Record<string, unknown>>();
  for (const name of readdirSync(join(SISTER_ROOT, dir)).filter((file) => file.endsWith(".json"))) {
    files.set(name.slice(0, -5), JSON.parse(readFileSync(join(SISTER_ROOT, dir, name), "utf8")) as Record<string, unknown>);
  }
  return files;
}

async function main(): Promise<void> {
  const codeOf = new Map((await fetchBootstrap()).elements.map((element) => [String(element.id), element.code]));
  const seasons = readdirSync(join(SISTER_ROOT, PLAYERS)).filter((name) => /^\d{2}-\d{2}$/.test(name)).sort().reverse();
  // Per season, root_id → the club's name that season.
  const clubs = new Map<string, Map<string, string>>();
  for (const label of seasons) {
    const teams = season(join(TEAMS, label));
    const at = new Map<string, string>();
    for (const person of season(join(PLAYERS, label)).values() as Iterable<PersonFile>) {
      const name = teams.get(person.current_team_id ?? "")?.display_name;
      if (person.root_id !== undefined && typeof name === "string") at.set(person.root_id, name);
    }
    clubs.set(label, at);
  }

  const players: IntelCareers["players"] = [];
  for (const person of season(join(PLAYERS, INTEL_SEASON)).values() as Iterable<PersonFile>) {
    const code = codeOf.get(person.source_mappings?.fpl ?? "");
    const root = person.root_id;
    if (code === undefined || root === undefined) continue;
    const rows = seasons.flatMap((label) => {
      const club = clubs.get(label)?.get(root);
      return club === undefined ? [] : [{ season: label, club }];
    });
    if (rows.length > 0) players.push({ code, seasons: rows });
  }
  players.sort((a, b) => a.code - b.code);
  if (players.length === 0) throw new Error(`no man in ${PLAYERS}/${INTEL_SEASON} has an FPL code; nothing written`);

  const file: IntelCareers = {
    manifest: intelManifest({ gameweek: null, rows: players.length, sources: [{ path: PLAYERS, mtime: null }] }),
    players,
  };
  writeIntel("careers", `${JSON.stringify(file)}\n`);
  console.log(`careers: ${players.length} men across ${seasons.length} seasons written.`);
}

main().catch((error: unknown) => {
  console.error(`careers: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
