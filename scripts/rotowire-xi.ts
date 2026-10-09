import {
  ROTOWIRE_LINEUPS_URL,
  SCOUT_TEAM_NEWS_URL,
  fetchBootstrap,
  fetchFixtures,
  fetchPlayerPool,
  fplCodeOf,
  mapFixtures,
  nextRound,
  parseRotowireXi,
  parseScoutXi,
  politeFetch,
  xiFault,
  xiToWrite,
  type IntelClubXi,
  type IntelXi,
} from "@epl/core";
import { intelManifest, readBridge, readIntel, writeIntel } from "./intel";
import { rotowireClubs } from "./xi/clubs";

// The predicted elevens into `data/intel/xi/`, on `scout-xi.yml`'s schedule: RotoWire's page first, Scout's for any
// club RotoWire cannot fill. Rewritten only when an eleven or an absence changes; exits 1 without writing unless every
// club has a full eleven, so a broken fetch never replaces a good file.

/** How long a lineups page may take to arrive: twice a provider read's FETCH_TIMEOUT_MS. */
const PAGE_TIMEOUT_MS = 30_000;

async function page(url: string): Promise<string> {
  const res = await politeFetch(url, { signal: AbortSignal.timeout(PAGE_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.text();
}

async function main(): Promise<void> {
  const now = new Date().toISOString();
  const [fixtures, bootstrap] = await Promise.all([fetchFixtures().then(mapFixtures), fetchBootstrap()]);
  const gameweek = nextRound(fixtures, now)?.gameweek ?? null;
  const shortName = new Map(bootstrap.teams.map((team) => [team.id, team.short_name]));
  const league = new Set(fixtures.map((fixture) => shortName.get(fixture.homeClubId)));
  const ties = fixtures
    .filter((fixture) => fixture.gameweek === gameweek)
    .map((fixture) => ({ home: shortName.get(fixture.homeClubId) ?? "", away: shortName.get(fixture.awayClubId) ?? "" }));

  const clubs: Record<string, IntelClubXi> = {};
  const used: string[] = [];
  try {
    const [html, pool] = await Promise.all([page(ROTOWIRE_LINEUPS_URL), fetchPlayerPool()]);
    const bridge = readBridge();
    const fantraxId = new Map(
      Object.values(pool).flatMap((entry) => (entry.rotowireId === undefined ? [] : [[entry.rotowireId, entry.fantraxId] as const])),
    );
    const clubOf = new Map(bootstrap.elements.map((element) => [element.code, shortName.get(element.team) ?? null]));
    const read = rotowireClubs(
      parseRotowireXi(html),
      (id) => {
        const found = fantraxId.get(id);
        return found === undefined ? null : fplCodeOf(bridge, found);
      },
      (code) => clubOf.get(code) ?? null,
      ties,
    );
    Object.assign(clubs, read.clubs);
    if (Object.keys(read.clubs).length > 0) used.push(ROTOWIRE_LINEUPS_URL);
    console.log(`rotowire-xi: RotoWire filled ${Object.keys(read.clubs).length} clubs; ${read.unjoined.length} men unjoined.`);
    for (const man of read.unjoined) console.log(`  ? ${man.abbr} rotowire ${man.rotowireId}: no bridge entry, left out`);
    for (const reason of read.refused) console.log(`  ✗ ${reason}`);
  } catch (error: unknown) {
    console.error(`rotowire-xi: RotoWire unread (${error instanceof Error ? error.message : String(error)}); Scout instead.`);
  }

  const missing = [...league].filter((club) => club !== undefined && clubs[club] === undefined);
  if (missing.length > 0) {
    const scout = parseScoutXi(await page(SCOUT_TEAM_NEWS_URL));
    for (const club of missing) if (club !== undefined && xiFault(scout[club]) === null) clubs[club] = scout[club];
    used.push(SCOUT_TEAM_NEWS_URL);
    console.log(`rotowire-xi: Scout asked for ${missing.join(", ")}.`);
  }

  const short = [...league].filter((club) => club === undefined || clubs[club] === undefined);
  if (short.length > 0) {
    console.error(`rotowire-xi: ${league.size - short.length} of ${league.size} clubs read; nothing written.`);
    for (const club of short) console.error(`  ✗ ${club ?? "an unnamed club"}: no full eleven`);
    process.exitCode = 1;
    return;
  }

  const held = readIntel<IntelXi>("xi");
  const write = xiToWrite(held, clubs, gameweek, now);
  if (write === null) {
    console.log(`rotowire-xi: unchanged since ${held?.fetchedAt ?? "an unrecorded time"}.`);
    return;
  }

  const xi: IntelXi = {
    manifest: intelManifest(
      { gameweek, rows: Object.keys(clubs).length, sources: used.map((path) => ({ path, mtime: null })) },
      now,
    ),
    fetchedAt: write.fetchedAt,
    source: used.map((url) => (url === ROTOWIRE_LINEUPS_URL ? "rotowire" : "ffscout")).join("+"),
    clubs,
  };
  writeIntel("xi", `${JSON.stringify(xi, null, 2)}\n`);
  console.log(`rotowire-xi: ${xi.manifest.rows} elevens for GW${xi.manifest.gameweek ?? "?"} written (${xi.source}).`);
}

void main();
