import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Where captures live, and what "today" means. Shared by the writer and the
// reader deliberately: if they disagreed about either, the staleness check would
// cheerfully report on a directory nothing was ever written to. That is a
// contract between two callers, not a coincidence worth duplicating.

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const SNAPSHOT_ROOT = join(REPO_ROOT, "data", "snapshots", "fantrax");

export function captureDir(date: string): string {
  return join(SNAPSHOT_ROOT, date);
}

/** Today as a London calendar date. The league is British and its deadlines are
 *  British, so a capture run late on a UK evening belongs to that UK day even
 *  when the machine running it thinks otherwise. */
export function todayInLondon(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
