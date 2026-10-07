import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  SCOUT_TEAM_NEWS_URL,
  fetchFixtures,
  mapFixtures,
  nextRound,
  parseScoutXi,
  politeFetch,
  sameElevens,
  xiFault,
  type IntelXi,
} from "@epl/core";
import { INTEL_SEASON, intelManifest, readIntel } from "./intel";
import { INTEL_ROOT } from "./paths";

// Scout's predicted elevens, straight from their team-news page into `data/intel/xi/`
// (Craig, 23 Sep 2026: "It should just always be live, and it's updated when scout
// updates it"). Run on a schedule by `scout-xi.yml`.
//
// The file is rewritten only when an eleven changes, and `fetchedAt` is that moment: the
// page carries no time of its own for the elevens (`FFS.currentDate` is when it was
// rendered), so "last updated" is when we first saw this prediction.
//
//   npm run scout-xi
//
// Exits 1 without writing when the page will not parse into every club's eleven: a broken
// fetch must never replace a good file.

async function main(): Promise<void> {
  const now = new Date().toISOString();
  const [page, fixtures] = await Promise.all([
    politeFetch(SCOUT_TEAM_NEWS_URL, { signal: AbortSignal.timeout(30_000) }),
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

  const file = `${INTEL_SEASON}.json`;
  const held = readIntel<IntelXi>("xi", file);
  if (held !== null && sameElevens(held.clubs, clubs)) {
    console.log(`scout-xi: unchanged since ${held.fetchedAt ?? "an unrecorded time"}.`);
    return;
  }

  const xi: IntelXi = {
    manifest: intelManifest(
      {
        gameweek: nextRound(fixtures, now)?.gameweek ?? null,
        rows: Object.keys(clubs).length,
        sources: [{ path: SCOUT_TEAM_NEWS_URL, mtime: null }],
      },
      now,
    ),
    fetchedAt: now,
    source: "ffscout",
    clubs,
  };
  writeFileSync(join(INTEL_ROOT, "xi", file), `${JSON.stringify(xi, null, 2)}\n`);
  console.log(`scout-xi: ${xi.manifest.rows} elevens for GW${xi.manifest.gameweek ?? "?"} written.`);
}

void main();
