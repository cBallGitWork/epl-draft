import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type Bridge,
  type FplCandidate,
  mapPlayerPool,
  matchPlayers,
  mergeBridge,
} from "@epl/core";
import { MAPPINGS_ROOT, SNAPSHOT_ROOT, REVIEW_ROOT } from "./paths";

// Builds the Fantrax→FPL player mapping. Run it, then read the review files and
// decide the residue by hand — the script proposes, a person disposes. Nothing
// downstream ever name-matches at runtime; it reads the file this writes.

const FPL_BOOTSTRAP = "https://fantasy.premierleague.com/api/bootstrap-static/";

interface RawElement {
  code: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
}

async function newestPoolSnapshot(): Promise<unknown> {
  const dates = (await readdir(SNAPSHOT_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const newest = dates.at(-1);
  if (newest === undefined) throw new Error("No captures yet — run `npm run capture` first.");

  // Deliberately the checked-in snapshot rather than a live fetch: the same
  // inputs must produce the same mapping, and the inputs are in git.
  console.log(`Fantrax pool from snapshot ${newest}`);
  return JSON.parse(await readFile(join(SNAPSHOT_ROOT, newest, "getPlayerIds.json"), "utf8"));
}

async function fplCandidates(): Promise<FplCandidate[]> {
  const res = await fetch(FPL_BOOTSTRAP);
  if (!res.ok) throw new Error(`FPL bootstrap → ${res.status}`);
  const body = (await res.json()) as {
    elements: RawElement[];
    teams: { id: number; short_name: string }[];
  };

  const clubs = new Map(body.teams.map((team) => [team.id, team.short_name]));
  return body.elements
    // element_type 5 is managers, who are not footballers and are not in
    // Fantrax's pool.
    .filter((element) => element.element_type <= 4)
    .map((element) => ({
      code: element.code,
      firstName: element.first_name,
      secondName: element.second_name,
      webName: element.web_name,
      clubCode: clubs.get(element.team) ?? "",
    }));
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    // Absent on the first run. Any other read failure would resurface on write.
    return fallback;
  }
}

async function main(): Promise<void> {
  const [pool, candidates] = await Promise.all([newestPoolSnapshot(), fplCandidates()]);
  const fantraxPlayers = mapPlayerPool(pool as Parameters<typeof mapPlayerPool>[0]);
  console.log(`${fantraxPlayers.length} Fantrax players, ${candidates.length} FPL players\n`);

  const bridgePath = join(MAPPINGS_ROOT, "fantrax.json");
  const aliasPath = join(MAPPINGS_ROOT, "fantrax-aliases.json");
  const existing = await readJson<Bridge>(bridgePath, {});
  const aliases = await readJson<Record<string, string>>(aliasPath, {});

  const { matches, proposals } = matchPlayers(fantraxPlayers, candidates, aliases, existing);

  const merged = mergeBridge(existing, matches);
  await mkdir(REVIEW_ROOT, { recursive: true });
  await writeFile(bridgePath, `${JSON.stringify(sortKeys(merged), null, 2)}\n`);
  await writeFile(aliasPath, `${JSON.stringify(aliases, null, 2)}\n`);
  await writeFile(
    join(REVIEW_ROOT, "proposals.json"),
    `${JSON.stringify(proposals, null, 2)}\n`,
  );

  const byStage = { exact: 0, alias: 0, fuzzy: 0, manual: 0 };
  for (const entry of Object.values(matches)) byStage[entry.matchedBy] += 1;

  const considered = Object.keys(matches).length + proposals.length;
  console.log(`exact  ${byStage.exact}`);
  console.log(`alias  ${byStage.alias}`);
  console.log(`fuzzy  ${byStage.fuzzy}`);
  console.log(`review ${proposals.length}`);
  console.log(
    `\n${Object.keys(matches).length}/${considered} matched ` +
      `(${Math.round((Object.keys(matches).length / Math.max(considered, 1)) * 100)}%). ` +
      `Bridge now holds ${Object.keys(merged).length} settled players.`,
  );
  for (const reason of ["no-candidates", "below-threshold", "ambiguous", "identity-taken"]) {
    const count = proposals.filter((proposal) => proposal.reason === reason).length;
    if (count > 0) console.log(`  review: ${reason} ${count}`);
  }
}

/** Stable key order so a re-run produces a readable diff rather than churn. */
function sortKeys(bridge: Bridge): Bridge {
  return Object.fromEntries(Object.entries(bridge).sort(([a], [b]) => a.localeCompare(b)));
}

void main();
