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

/** Whether a held export says what a fresh one does, its manifest aside: a new `exportedAt` alone is not a change. */
export function sameApartFromManifest<T extends { manifest: IntelManifest }>(held: T, fresh: T): boolean {
  return canonical({ ...held, manifest: null }) === canonical({ ...fresh, manifest: null });
}

/** JSON with every object's keys sorted, so one value built two ways compares equal. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, inner: unknown) =>
    inner !== null && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : inner,
  );
}
