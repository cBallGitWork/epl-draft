import {
  SCOUT_TEAM_NEWS_URL,
  fetchFixtures,
  mapFixtures,
  nextRound,
  parseScoutXi,
  politeFetch,
  xiFault,
  xiToWrite,
  type IntelXi,
} from "@epl/core";
import { intelManifest, readIntel, writeIntel } from "./intel";

// Scout's predicted elevens from their team-news page into `data/intel/xi/`, on `scout-xi.yml`'s schedule. Rewritten only
// when an eleven changes, `fetchedAt` that moment (the page dates no eleven); exits 1 without writing unless every club
// parses, so a broken fetch never replaces a good file.

/** How long Scout's page may take to arrive: twice a provider read's FETCH_TIMEOUT_MS. */
const SCOUT_PAGE_TIMEOUT_MS = 30_000;

async function main(): Promise<void> {
  const now = new Date().toISOString();
  const [page, fixtures] = await Promise.all([
    politeFetch(SCOUT_TEAM_NEWS_URL, { signal: AbortSignal.timeout(SCOUT_PAGE_TIMEOUT_MS) }),
    fetchFixtures().then(mapFixtures),
  ]);
  if (!page.ok) throw new Error(`Scout's team news answered ${page.status}`);

  const clubs = parseScoutXi(await page.text());
  const league = new Set(fixtures.map((fixture) => fixture.homeClubId)).size;
  const faults = Object.entries(clubs)
    .map(([club, xi]) => [club, xiFault(xi)] as const)
    .filter(([, fault]) => fault !== null);
  if (Object.keys(clubs).length !== league || faults.length > 0) {
    console.error(`scout-xi: ${Object.keys(clubs).length} of ${league} clubs read; nothing written.`);
    for (const [club, fault] of faults) console.error(`  ✗ ${club}: ${fault}`);
    process.exitCode = 1;
    return;
  }

  const held = readIntel<IntelXi>("xi");
  const gameweek = nextRound(fixtures, now)?.gameweek ?? null;
  const write = xiToWrite(held, clubs, gameweek, now);
  if (write === null) {
    console.log(`scout-xi: unchanged since ${held?.fetchedAt ?? "an unrecorded time"}.`);
    return;
  }

  const xi: IntelXi = {
    manifest: intelManifest(
      { gameweek, rows: Object.keys(clubs).length, sources: [{ path: SCOUT_TEAM_NEWS_URL, mtime: null }] },
      now,
    ),
    fetchedAt: write.fetchedAt,
    source: "ffscout",
    clubs,
  };
  writeIntel("xi", `${JSON.stringify(xi, null, 2)}\n`);
  console.log(`scout-xi: ${xi.manifest.rows} elevens for GW${xi.manifest.gameweek ?? "?"} written.`);
}

void main();
