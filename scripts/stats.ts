import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  KEEPER,
  OUTFIELD,
  POOL_PAGE_SIZE,
  columnDrift,
  fetchPoolStats,
  mapStatSheet,
  type IntelStats,
  type StatSheet,
} from "@epl/core";
import { INTEL_SEASON, intelManifest, readBridge, readIntel, sameApartFromManifest } from "./intel";
import { STATS_LEAGUE } from "./leagues";
import { INTEL_ROOT } from "./paths";
import { buildStats } from "./stats/build";

// The stats league's season-to-date counts for every man who has played, into `data/intel/stats/`
// (Craig, 25 Sep 2026: every category enabled at no points, so `getPlayerStats` answers them all).
// Run daily by `ingest-stats.yml`; the file is rewritten only when a figure changed.
//
//   npm run stats                    # or, once the vocabulary covers a changed league:
//   npm run stats -- --accept-drift
//
// Exits 1 without writing on a projection, or when the league's columns changed: a changed scoring
// must never quietly reshape the file.

async function main(): Promise<void> {
  // One group after the other, never both at once: Fantrax throttles a burst.
  const sheets: StatSheet[] = [];
  for (const group of [OUTFIELD, KEEPER]) {
    sheets.push(mapStatSheet(await fetchPoolStats(STATS_LEAGUE.leagueId, POOL_PAGE_SIZE, undefined, group)));
  }
  const projected = sheets.find((sheet) => sheet.season.projected);
  if (projected !== undefined) {
    return refuse(`Fantrax answered "${projected.season.name}", a projection`);
  }

  const bridge = readBridge();
  const { stats, unknown, missing } = buildStats(sheets, bridge);
  const file = `${INTEL_SEASON}.json`;
  const held = readIntel<IntelStats>("stats", file);
  const drift = columnDrift(held?.columns ?? stats.columns, stats.columns);
  const drifted = [
    ...unknown.map((stat) => `a column we have no key for: ${named(sheets, stat)}`),
    ...missing.map((key) => `a key no sheet carried: ${key}`),
    ...drift.added.map((key) => `a key the held file lacks: ${key}`),
    ...drift.removed.map((key) => `a key the held file has and this read lacks: ${key}`),
  ];
  if (drifted.length > 0 && !process.argv.includes("--accept-drift")) {
    return refuse("the stats league's columns changed", drifted);
  }

  const now = new Date().toISOString();
  const out: IntelStats = {
    manifest: intelManifest(
      {
        gameweek: null,
        rows: stats.players.length,
        sources: [{ path: `Fantrax getPlayerStats, the "${STATS_LEAGUE.key}" league`, mtime: null }],
      },
      now,
    ),
    ...stats,
  };
  if (held !== null && sameApartFromManifest(held, out)) {
    console.log(`stats: unchanged since ${held.manifest.exportedAt}.`);
    return;
  }
  mkdirSync(join(INTEL_ROOT, "stats"), { recursive: true });
  writeFileSync(join(INTEL_ROOT, "stats", file), dense(out));
  console.log(
    `stats: ${out.players.length} men, ${out.columns.length} columns written` +
      ` (${out.unbridgedWithMinutes} who have played the bridge cannot key).`,
  );
}

function refuse(why: string, lines: readonly string[] = []): void {
  console.error(`stats: ${why}; nothing written.`);
  for (const line of lines) console.error(`  ✗ ${line}`);
  process.exitCode = 1;
}

/** A Fantrax stat id with its short name, for a person to add to the vocabulary. */
function named(sheets: readonly StatSheet[], stat: string): string {
  const column = sheets.flatMap((sheet) => sheet.columns).find((entry) => entry.stat === stat);
  return column === undefined ? stat : `${stat} (${column.short}, "${column.name}")`;
}

/** The file with each man on one line: a value per line would be most of it whitespace. */
function dense({ players, ...head }: IntelStats): string {
  const top = JSON.stringify({ ...head, players: [] }, null, 2).replace(/\[\]\n\}$/, "[");
  return `${top}\n${players.map((player) => `    ${JSON.stringify(player)}`).join(",\n")}\n  ]\n}\n`;
}

void main();
