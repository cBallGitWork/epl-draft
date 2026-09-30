import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  type TransactionView,
  mapDraftPicks,
  mapLeagueInfo,
  mapTeamRosters,
  mapTransactions,
} from "@epl/core";
import { captureDates } from "../snapshots";

// What each captured Fantrax read maps to, one sha256 per file: same capture, same mapper, same line.

/** The views capture-fantrax records; the second copy of its list, so not yet extracted. */
const VIEWS: readonly TransactionView[] = ["CLAIM_DROP", "TRADE", "LINEUP_CHANGE"];

type Raw<F extends (...args: never[]) => unknown> = Parameters<F>[0];
type Mapper = (raw: unknown) => unknown;

/** Each captured read's core mapper, by manifest method. The fxea `getStandings` has none. */
const MAPPERS: Readonly<Record<string, Mapper>> = {
  getLeagueInfo: (raw) => mapLeagueInfo(raw as Raw<typeof mapLeagueInfo>),
  getTeamRosters: (raw) => mapTeamRosters(raw as Raw<typeof mapTeamRosters>),
  getDraftResults: (raw) => mapDraftPicks(raw as Raw<typeof mapDraftPicks>),
  ...Object.fromEntries(
    VIEWS.map((view): [string, Mapper] => [
      `getTransactionDetailsHistory-${view}`,
      (raw) => mapTransactions(raw as Raw<typeof mapTransactions>, view),
    ]),
  ),
};

export function mapperFor(method: string): Mapper | null {
  return MAPPERS[method] ?? null;
}

export function fingerprint(mapped: unknown): string {
  return createHash("sha256").update(JSON.stringify(mapped)).digest("hex");
}

/** The methods a day's manifest says Fantrax answered; a failed read left no file to replay. */
async function answered(dir: string): Promise<string[]> {
  const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8")) as {
    reads?: { method?: unknown; ok?: unknown }[];
  };
  return (manifest.reads ?? [])
    .filter((read) => read.ok === true && typeof read.method === "string")
    .map((read) => String(read.method));
}

/** The recorded keys in their order, then any other archive on disk (an abandoned one) by name. */
export async function leagueKeys(recorded: readonly string[], root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const onDisk = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  return [...new Set([...recorded, ...onDisk.sort()])];
}

/** `key/day/file sha256` for every mapped read under one league's root, oldest day first. */
export async function replayLeague(key: string, root: string): Promise<string[]> {
  const lines: string[] = [];
  for (const day of await captureDates(root)) {
    const dir = join(root, day);
    for (const method of (await answered(dir)).sort()) {
      const mapper = mapperFor(method);
      if (mapper === null) continue;
      const raw: unknown = JSON.parse(await readFile(join(dir, `${method}.json`), "utf8"));
      lines.push(`${key}/${day}/${method}.json ${fingerprint(mapper(raw))}`);
    }
  }
  return lines;
}
