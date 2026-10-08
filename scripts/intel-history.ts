import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { slimSummary } from "@epl/core";
import type { IntelHistory } from "@epl/core";
import { INTEL_ROOT, SISTER_ROOT } from "./paths";
import { INTEL_SEASON, intelManifest } from "./intel";

// The sister repo's copy of FPL's element-summaries, by FPL code and cut to what our mappers read: a player's season
// for the page when FPL will not answer Vercel and nothing is cached for him. Run by `scripts/sync-intel.sh`, which
// restores `raw/fpl/live/element_summaries` from R2 first.

/** FPL's element-summary as it arrives; core keeps the raw type to itself. */
type RawElementSummary = Parameters<typeof slimSummary>[0];

const LIVE = join(SISTER_ROOT, "data", "raw", "fpl", "live");
const SUMMARIES = join(LIVE, "element_summaries");

// The summaries are filed by FPL's per-season id; the file keeps the code that survives the summer.
const bootstrap = JSON.parse(readFileSync(join(LIVE, "bootstrap", "bootstrap-static.json"), "utf8")) as {
  elements: { id: number; code: number }[];
};
const codeOf = new Map(bootstrap.elements.map((element) => [element.id, element.code]));

const players: Record<string, RawElementSummary> = {};
let newest = 0;
let latestRound = 0;
let skipped = 0;
for (const name of readdirSync(SUMMARIES).filter((file) => /^\d+\.json$/.test(file))) {
  const code = codeOf.get(Number(name.replace(".json", "")));
  if (code === undefined) {
    skipped += 1;
    continue;
  }
  const path = join(SUMMARIES, name);
  const slim = slimSummary(JSON.parse(readFileSync(path, "utf8")) as RawElementSummary);
  players[String(code)] = slim;
  newest = Math.max(newest, statSync(path).mtimeMs);
  for (const row of slim.history) if (row.team_h_score !== null) latestRound = Math.max(latestRound, row.round);
}

const rows = Object.keys(players).length;
if (rows === 0) throw new Error(`no element-summaries in ${SUMMARIES}: restore raw/fpl/live/element_summaries first`);

const file: IntelHistory = {
  manifest: intelManifest(
    { gameweek: latestRound || null, rows, sources: [{ path: "data/raw/fpl/live/element_summaries", mtime: new Date(newest).toISOString() }] },
    // Stamped by when the sweep fetched them, not when this ran: the page says "as of" this.
    new Date(newest).toISOString(),
  ),
  players,
};
mkdirSync(join(INTEL_ROOT, "history"), { recursive: true });
writeFileSync(join(INTEL_ROOT, "history", `${INTEL_SEASON}.json`), `${JSON.stringify(file)}\n`);
console.log(`intel-history: ${rows} players through GW${latestRound}, fetched ${new Date(newest).toISOString()}${skipped ? `; ${skipped} ids not in the bootstrap` : ""}`);
