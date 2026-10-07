import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet";
import { cupName, tmlCupTies, fetchBootstrap } from "@epl/core";
import type { IntelCups, TmlRow } from "@epl/core";
import { INTEL_ROOT } from "./paths";
import { INTEL_SEASON, intelManifest } from "./intel";

// Each club's cup and European ties off the sister repo's team match log, into `data/intel/cups/`.
// Reads the sister repo and never writes to it; run after the sister rebuilds its log (`npm run intel-cups`).

const SISTER = process.env.SISTER_REPO || join(fileURLToPath(new URL("..", import.meta.url)), "..", "ai-carling-premiership");
const TML = `data/match_logs/team_match_log/season=${INTEL_SEASON}/team_match_log.parquet`;
const TEAMS = `data/identity/teams/seasons/${INTEL_SEASON}`;
const MATCHES = `data/identity/matches/seasons/${INTEL_SEASON}`;
/** FotMob's raw folders spell the season in full, `2026-2027`; its meta names both sides of a tie to come. */
const FOTMOB = `data/raw/fotmob/matches/${INTEL_SEASON.replace(/^(\d+)-(\d+)$/, "20$1-20$2")}`;
const LEAGUE_DIR = "premier_league";
const COLUMNS = ["competition", "team_id", "opponent_team_id", "opponent_name", "is_home", "neutral", "status", "kickoff_utc", "goals_for", "goals_against"];

async function main(): Promise<void> {
  const records = await parquetReadObjects({ file: await asyncBufferFromFile(at(TML)), columns: COLUMNS });
  const rows = records.flatMap((record) => tmlRow(record) ?? []);
  const { clubs, complaints } = tmlCupTies(rows, { clubCodes: await clubCodes(), names: fotmobNames() });
  const ties = Object.values(clubs).flat();
  if (ties.length === 0) throw new Error(`no ties for any FPL club in ${TML}; nothing written`);

  const file: IntelCups = {
    manifest: intelManifest({
      gameweek: null,
      rows: ties.length,
      sources: [{ path: TML, mtime: statSync(at(TML)).mtime.toISOString() }],
    }),
    clubs,
  };
  mkdirSync(join(INTEL_ROOT, "cups"), { recursive: true });
  writeFileSync(join(INTEL_ROOT, "cups", `${INTEL_SEASON}.json`), `${JSON.stringify(file, null, 1)}\n`);

  console.log(`${ties.length} ties for ${Object.keys(clubs).length} clubs, ${rows.length - ties.length} log rows left aside`);
  for (const [label, count] of tally(ties.map((tie) => `${cupName(tie.competition) ?? tie.competition} ${tie.score === null ? "to come" : "played"}`))) {
    console.log(`  ${label}: ${count}`);
  }
  console.log(`  opponents unnamed: ${ties.filter((tie) => tie.opponentCode === null && tie.opponentName === null).length}`);
  for (const complaint of complaints) console.error(`  ! ${complaint}`);
}

/** The sister's team id → FPL club code, through its FPL team id and this season's bootstrap. */
async function clubCodes(): Promise<Map<string, number>> {
  const byFplId = new Map((await fetchBootstrap()).teams.map((team) => [String(team.id), team.code]));
  const codes = new Map<string, number>();
  for (const team of jsonIn(TEAMS)) {
    const fpl = record(team.source_mappings)?.fpl;
    const code = typeof fpl === "string" ? byFplId.get(fpl) : undefined;
    if (typeof team.team_id === "string" && code !== undefined) codes.set(team.team_id, code);
  }
  if (codes.size !== byFplId.size) throw new Error(`${codes.size} of FPL's ${byFplId.size} clubs bridged from ${TEAMS}`);
  return codes;
}

/** The sister's team id → FotMob's name for it, off every tie outside the league that FotMob has a page for. */
function fotmobNames(): Map<string, string> {
  const metas = new Map<string, Record<string, unknown>>();
  for (const competition of cupDirs(FOTMOB)) {
    for (const match of readdirSync(at(FOTMOB, competition))) {
      const meta = readJson(at(FOTMOB, competition, match, "_meta.json"));
      if (meta !== null) metas.set(String(meta.match_id), meta);
    }
  }
  const names = new Map<string, string>();
  for (const competition of cupDirs(MATCHES)) {
    for (const match of jsonIn(join(MATCHES, competition))) {
      const meta = metas.get(String(record(match.source_mappings)?.fotmob_id));
      if (meta === undefined) continue;
      for (const side of ["home", "away"]) {
        const id = match[`${side}_team_id`];
        const name = meta[`${side}_team_name`];
        if (typeof id === "string" && typeof name === "string") names.set(id, name);
      }
    }
  }
  return names;
}

/** One log row, or null when a field the export reads is not the type the log promises. */
function tmlRow(raw: Record<string, unknown>): TmlRow | null {
  const text = (key: string) => {
    const value = raw[key];
    return typeof value === "string" ? value : null;
  };
  const flag = (key: string) => {
    const value = raw[key];
    return typeof value === "boolean" ? value : null;
  };
  const goals = (key: string) => {
    const value = raw[key];
    return typeof value === "number" && Number.isInteger(value) ? value : null;
  };
  const [competition, team, opponent, status] = ["competition", "team_id", "opponent_team_id", "status"].map(text);
  const [home, neutral] = ["is_home", "neutral"].map(flag);
  if (competition === null || team === null || opponent === null || status === null || home === null || neutral === null) return null;
  return {
    competition,
    team_id: team,
    opponent_team_id: opponent,
    opponent_name: text("opponent_name"),
    is_home: home,
    neutral,
    status,
    kickoff_utc: text("kickoff_utc"),
    goals_for: goals("goals_for"),
    goals_against: goals("goals_against"),
  };
}

function at(...parts: string[]): string {
  return join(SISTER, ...parts);
}

/** The competitions a folder files, leaving out the league. */
function cupDirs(path: string): string[] {
  return readdirSync(at(path), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== LEAGUE_DIR)
    .map((entry) => entry.name);
}

function jsonIn(path: string): Record<string, unknown>[] {
  return readdirSync(at(path))
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      const json = readJson(at(path, name));
      return json === null ? [] : [json];
    });
}

/** A JSON object off disk, or null when the file is not there. */
function readJson(path: string): Record<string, unknown> | null {
  try {
    return record(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function tally(labels: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
}

void main();
