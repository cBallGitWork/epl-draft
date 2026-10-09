import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isAbsent } from "./absent";

// Which capture days exist on disk, and what each recorded. Where captures go is `paths.ts`.

/** A capture directory and nothing else, so a stray `tmp/` or a `.DS_Store` cannot be mistaken for a day we captured. */
const CAPTURE_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Fantrax's refusal for a league nobody has joined: a true answer about it until its draft, and a failure after. */
const NO_TEAMS = "NO_TEAMS";

/** Every capture day under `root`, oldest first. An absent directory is `[]`; any other failure is rethrown, as
 *  a permissions problem reported as "no captures" would surface as "overdue" and hide the cause. */
export async function captureDates(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && CAPTURE_DAY.test(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (isAbsent(error)) return [];
    throw error;
  }
}

/** The most recent capture day under `root`, or null when there are none. */
export async function newestCapture(root: string): Promise<string | null> {
  return (await captureDates(root)).at(-1) ?? null;
}

/** Whether Fantrax said the league under `root` had drafted, in the newest capture that recorded its draft. */
export async function drafted(root: string): Promise<boolean> {
  for (const date of (await captureDates(root)).reverse()) {
    const raw = await readFile(join(root, date, "getDraftResults.json"), "utf8").catch(() => null);
    if (raw === null) continue;
    const board: unknown = JSON.parse(raw);
    return typeof board === "object" && board !== null && "draftState" in board && board.draftState === "completed";
  }
  return false;
}

/** Whether a failed read may stand as an answer about the league: only NO_TEAMS, and only before its draft. */
export function excused(code: string | null, isDrafted: boolean): boolean {
  return code === NO_TEAMS && !isDrafted;
}

/** A read a capture day's manifest records as failed, with the provider's code when it gave one. */
export interface FailedRead {
  method: string;
  code: string | null;
}

/** One manifest entry, read as untrusted: a file on disk is no surer than the provider that filled it. */
function outcome(read: unknown): FailedRead & { ok: boolean } {
  const entry: object = typeof read === "object" && read !== null ? read : {};
  return {
    ok: "ok" in entry && entry.ok === true,
    method: "method" in entry && typeof entry.method === "string" ? entry.method : "an unnamed read",
    code: "code" in entry && typeof entry.code === "string" ? entry.code : null,
  };
}

/** What one capture day recorded, off its own manifest: the directory is made before the first read, so it proves
 *  nothing. Null when the manifest is absent or unreadable, which callers must not read as healthy. */
export async function captureReads(dir: string): Promise<{ ok: number; failed: FailedRead[] } | null> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"));
  } catch {
    return null;
  }

  const reads: unknown = typeof parsed === "object" && parsed !== null && "reads" in parsed ? parsed.reads : null;
  if (!Array.isArray(reads)) return null;

  const outcomes = reads.map(outcome);
  return {
    ok: outcomes.filter((read) => read.ok).length,
    failed: outcomes.filter((read) => !read.ok).map(({ method, code }) => ({ method, code })),
  };
}

/** Whether every one of `dirs` (`<league>/<date>`) recorded every read, bar NO_TEAMS before that league's draft:
 *  when the evening backup capture stands down. */
export async function everyDayCaptured(dirs: readonly string[]): Promise<boolean> {
  for (const dir of dirs) {
    const reads = await captureReads(dir);
    if (reads === null || reads.ok === 0) return false;
    const isDrafted = await drafted(dirname(dir));
    if (reads.failed.some((read) => !excused(read.code, isDrafted))) return false;
  }
  return true;
}
