import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { SEASON, projectionIntel, type Bridge, type IntelManifest, type IntelProjections, type ProjectedPlayer } from "@epl/core";
import { INTEL_ROOT, MAPPINGS_ROOT } from "./paths";

// The intel exports on disk, read and written, the bridge read, and the manifest every export written here carries.
// Absent is ordinary; a file that will not parse throws, since a corrupt export is a broken pipeline, not an empty one.
// `intel-check.ts` keeps its own reader, which catches: saying a file will not parse is that script's whole job.

/** The season as the export's filenames spell it — `26-27`, from `2026/27`. */
export const INTEL_SEASON = SEASON.slice(2).replace("/", "-");

/** Where one season's export of a kind sits, `data/intel/<kind>/<season>.json`: this season's unless told. */
export function intelPath(kind: string, season = INTEL_SEASON): string {
  return join(INTEL_ROOT, kind, `${season}.json`);
}

/** One of the sister repo's exports, or null when we do not hold it. */
export function readIntel<T>(kind: string, season = INTEL_SEASON): T | null {
  const path = intelPath(kind, season);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/** This season's export of a kind, written, its folder made first; each writer keeps its own layout. */
export function writeIntel(kind: string, text: string): void {
  const path = intelPath(kind);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

/** This season's projections export, by FPL code, as the paper's desks read it. */
export function readProjections(): Map<number, ProjectedPlayer> {
  return projectionIntel(readIntel<IntelProjections>("projections"));
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
