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

/** A mapping file, or the fallback when there is genuinely no file.
 *
 *  **Only absence is tolerated.** This used to swallow every failure and return
 *  the fallback, on the reasoning that "any other read failure would resurface on
 *  write" — it does not: nothing re-reads, and the run writes the rebuilt result
 *  straight back over the original. So one malformed byte in `fantrax.json`
 *  rebuilt the bridge from nothing and destroyed the audited half of it, which is
 *  the half a person made by hand and the only half that cannot be regenerated.
 *
 *  `snapshots.ts` already makes this argument for capture directories, in the
 *  same words: reporting a permissions problem as "nothing here" hides the actual
 *  cause behind a plausible one. */
async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return fallback;
    throw error;
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
