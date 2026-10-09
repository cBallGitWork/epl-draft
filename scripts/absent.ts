import { readFileSync } from "node:fs";

// Absence is the one read failure a script may treat as "nothing yet": a permissions fault or a corrupt file reported
// as empty hides its cause, and a writer that then rebuilds from nothing overwrites what a person made by hand.

/** Whether a read failed because the file or folder is not there. */
export function isAbsent(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

/** A JSON file off disk, or `fallback` when there is no file; one that will not parse throws. */
export function readJsonOr<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    if (isAbsent(error)) return fallback;
    throw error;
  }
}
