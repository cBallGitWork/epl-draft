import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type Bridge,
  type FplCandidate,
  type MappedEntry,
  type UnmappedSplit,
  assumeUnmapped,
  fetchBootstrap,
  isUnmapped,
  mapPlayerPool,
  matchPlayers,
  mergeBridge,
} from "@epl/core";
import { readJsonOr } from "./absent";
import { MAPPINGS_ROOT, POOL_ROOT, REVIEW_ROOT } from "./paths";
import { newestCapture } from "./snapshots";

// Builds the Fantrax→FPL player mapping. Run it, then read the review files and
// decide the residue by hand — the script proposes, a person disposes. Nothing
// downstream ever name-matches at runtime; it reads the file this writes.

async function newestPoolSnapshot(): Promise<unknown> {
  const newest = await newestCapture(POOL_ROOT);
  if (newest === null) throw new Error("No captures yet — run `npm run capture` first.");

  // Deliberately the checked-in snapshot rather than a live fetch: the same
  // inputs must produce the same mapping, and the inputs are in git.
  console.log(`Fantrax pool from snapshot ${newest}`);
  return JSON.parse(await readFile(join(POOL_ROOT, newest, "getPlayerIds.json"), "utf8"));
}

/** FPL's side of the match, in the shape `identity/` asks for.
 *
 *  Unlike the Fantrax pool this is fetched live, because FPL adds players
 *  mid-window and a stale candidate list produces a stale bridge. The wiring
 *  lives here rather than in either layer: `identity/` declares `FplCandidate`
 *  precisely so it never has to import the football adapter. */
async function fplCandidates(): Promise<FplCandidate[]> {
  const body = await fetchBootstrap();

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

async function main(): Promise<void> {
  const [pool, candidates] = await Promise.all([newestPoolSnapshot(), fplCandidates()]);
  const fantraxPlayers = mapPlayerPool(pool as Parameters<typeof mapPlayerPool>[0]);
  console.log(`${fantraxPlayers.length} Fantrax players, ${candidates.length} FPL players\n`);

  const bridgePath = join(MAPPINGS_ROOT, "fantrax.json");
  const aliasPath = join(MAPPINGS_ROOT, "fantrax-aliases.json");
  // Only absence is a fresh start: a malformed bridge rebuilt from nothing would lose its audited half.
  const existing = readJsonOr<Bridge>(bridgePath, {});
  const aliases = readJsonOr<Record<string, string>>(aliasPath, {});

  const { matches, proposals } = matchPlayers(fantraxPlayers, candidates, aliases, existing);
  const { assumed, forReview } = assumeUnmapped(proposals);

  const merged = mergeBridge(existing, { ...matches, ...assumed });
  await mkdir(REVIEW_ROOT, { recursive: true });
  await writeFile(bridgePath, `${JSON.stringify(sortKeys(merged), null, 2)}\n`);
  await writeFile(aliasPath, `${JSON.stringify(aliases, null, 2)}\n`);
  await writeFile(
    join(REVIEW_ROOT, "proposals.json"),
    `${JSON.stringify(forReview, null, 2)}\n`,
  );

  report(matches, { assumed, forReview }, merged);
}

/** What the run did, counted off the file it wrote rather than off this run's
 *  work: once the residue is recorded, later runs match almost nobody new, and a
 *  percentage of "considered" would fall to zero while the bridge stayed whole. */
function report(
  matches: Record<string, MappedEntry>,
  split: UnmappedSplit,
  merged: Bridge,
): void {
  const byStage = { exact: 0, alias: 0, fuzzy: 0, manual: 0 };
  for (const entry of Object.values(matches)) byStage[entry.matchedBy] += 1;

  console.log(`exact  ${byStage.exact}`);
  console.log(`alias  ${byStage.alias}`);
  console.log(`fuzzy  ${byStage.fuzzy}`);
  console.log(`no FPL counterpart ${Object.keys(split.assumed).length}`);
  console.log(`review ${split.forReview.length}`);

  const rows = Object.values(merged);
  const unmapped = rows.filter(isUnmapped).length;
  console.log(
    `\nBridge holds ${rows.length} players: ${rows.length - unmapped} mapped, ` +
      `${unmapped} with no FPL counterpart.`,
  );
  for (const reason of ["ambiguous", "identity-taken"]) {
    const count = split.forReview.filter((proposal) => proposal.reason === reason).length;
    if (count > 0) console.log(`  review: ${reason} ${count}`);
  }
}

/** Stable key order so a re-run produces a readable diff rather than churn. */
function sortKeys(bridge: Bridge): Bridge {
  return Object.fromEntries(Object.entries(bridge).sort(([a], [b]) => a.localeCompare(b)));
}

void main();
