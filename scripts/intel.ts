import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SEASON, type Bridge, type IntelManifest } from "@epl/core";
import { INTEL_ROOT, MAPPINGS_ROOT } from "./paths";

// Reading the sister repo's export and the bridge off disk, and the manifest every export written here carries.
//
// Absent is the ordinary state and every caller treats it as one. A file that
// will not PARSE is not absent and throws: a corrupt export is a broken
// pipeline rather than an empty one.
//
// `intel-check.ts` deliberately keeps its own reader, which catches instead —
// saying "xi/26-27.json will not parse" rather than dying is that script's whole job.

/** The season as the export's filenames spell it — `26-27`, from `2026/27`. */
export const INTEL_SEASON = SEASON.slice(2).replace("/", "-");

/** One of the sister repo's exports, or null when we do not hold it. */
export function readIntel<T>(...segments: string[]): T | null {
  const path = join(INTEL_ROOT, ...segments);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/** The manifest of an export written here: this season, stamped now unless told when. Fields in the files' order. */
export function intelManifest(
  fields: Pick<IntelManifest, "gameweek" | "rows" | "sources">,
  exportedAt = new Date().toISOString(),
): IntelManifest {
  return { season: INTEL_SEASON, gameweek: fields.gameweek, exportedAt, rows: fields.rows, sources: fields.sources };
}

/** The committed Fantrax→FPL bridge (`npm run bridge`), which every export keyed on a Fantrax id joins through. */
export function readBridge(): Bridge {
  return JSON.parse(readFileSync(join(MAPPINGS_ROOT, "fantrax.json"), "utf8")) as Bridge;
}
