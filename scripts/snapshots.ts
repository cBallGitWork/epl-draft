import { readdir } from "node:fs/promises";

// Which capture days actually exist on disk. Where captures *go* is `paths.ts`;
// what was *written* is only knowable by asking the filesystem, and that is this
// file.
//
// Extracted on the third occurrence, not the second: the staleness check wants
// every date, the bridge wants the newest pool capture, and the alignment script
// wants the newest league capture. Three callers is what told us the shared thing
// is "which days were captured" rather than any one caller's phrasing of it.

/** A capture directory and nothing else, so a stray `tmp/` or a `.DS_Store`
 *  cannot be mistaken for a day we captured. */
const CAPTURE_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isMissingDirectory(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

/** Every capture day under `root`, oldest first.
 *
 *  An absent directory answers `[]` — nothing has been captured for that league
 *  yet, which is a legitimate state that `captureStaleness` already has an
 *  opinion about. Every other failure is real and rethrown: reporting a
 *  permissions problem as "no captures" would surface as "overdue" and hide the
 *  actual cause behind a plausible one. */
export async function captureDates(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && CAPTURE_DAY.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (isMissingDirectory(error)) return [];
    throw error;
  }
}

/** The most recent capture day under `root`, or null when there are none. What
 *  to do about none differs by caller, so it is left to them. */
export async function newestCapture(root: string): Promise<string | null> {
  return (await captureDates(root)).at(-1) ?? null;
}
