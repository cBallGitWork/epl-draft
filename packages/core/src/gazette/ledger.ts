// The newsroom's memory, committed beside the paper: covered keys (club codes, never per-season ids) stop a
// story filing twice, and threads count their beats so a worn storyline is not reused.

/** One running storyline, as the model reports it and the ledger wears it. */
export interface StoryThread {
  /** What the saga is about, in a few words; slugged, it is the merge key. */
  subject: string;
  /** The latest development, one line. */
  beat: string;
  /** `open` runs; `retired` is finished or worn out and may not come back. */
  status: "open" | "retired";
  /** How many editions have advanced it; past `THREAD_MAX_BEATS` it is worn whatever its status. */
  beats: number;
  /** ISO instant of the last edition that used it. */
  lastUsedAt: string;
}

/** One league's memory, keyed by league so a test league's never reaches the real paper. */
export interface LedgerBook {
  covered: string[];
  threads: StoryThread[];
}

export type Ledger = Record<string, LedgerBook>;

/** Covered keys kept per league: months of margin over the two gameweeks in print. */
export const MAX_COVERED = 400;

/** Threads kept per league, open and retired together. */
const MAX_THREADS = 24;

/** Beats before a thread is worn out. */
export const THREAD_MAX_BEATS = 6;

export function normalizeLedger(parsed: unknown): Ledger {
  if (parsed === null || typeof parsed !== "object") return {};
  const ledger: Ledger = {};
  for (const [leagueId, book] of Object.entries(parsed as Record<string, unknown>)) {
    if (leagueId === "" || book === null || typeof book !== "object") continue;
    const raw = book as Partial<LedgerBook>;
    ledger[leagueId] = {
      covered: Array.isArray(raw.covered)
        ? raw.covered.filter((key): key is string => typeof key === "string" && key !== "")
        : [],
      threads: Array.isArray(raw.threads) ? raw.threads.filter(isThread) : [],
    };
  }
  return ledger;
}

/** What the model reports back per story; wear is counted here, never claimed by it. */
export interface ThreadUpdate {
  subject: string;
  beat: string;
  status?: "open" | "retired";
}

/** A new ledger after a filing: keys spent, threads advanced, wear counted at `filedAt`. */
export function recordCoverage(
  ledger: Ledger,
  leagueId: string,
  spentKeys: readonly string[],
  updates: readonly ThreadUpdate[],
  filedAt: string,
): Ledger {
  const book = ledger[leagueId] ?? { covered: [], threads: [] };

  // Newest keys last; the trim drops from the front, which is oldest-first.
  const covered = [...book.covered];
  for (const key of spentKeys) if (!covered.includes(key)) covered.push(key);

  const threads = [...book.threads];
  for (const update of updates) {
    const subject = threadSlug(update.subject);
    if (subject === "" || update.beat === "") continue;
    const known = threads.findIndex((thread) => threadSlug(thread.subject) === subject);
    if (known === -1) {
      threads.push({
        subject: update.subject,
        beat: update.beat,
        status: update.status ?? "open",
        beats: 1,
        lastUsedAt: filedAt,
      });
    } else {
      const thread = threads[known];
      threads[known] = {
        // The first phrasing of the subject stays.
        subject: thread.subject,
        beat: update.beat,
        // Retirement is one-way.
        status: thread.status === "retired" ? "retired" : (update.status ?? "open"),
        beats: thread.beats + 1,
        lastUsedAt: filedAt,
      };
    }
  }
  // Over the cap, the least recently used go first, retired before open at equal age.
  const kept = [...threads]
    .sort(
      (a, b) =>
        Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt) ||
        (a.status === "retired" ? 1 : 0) - (b.status === "retired" ? 1 : 0),
    )
    .slice(0, MAX_THREADS);

  return {
    ...ledger,
    [leagueId]: { covered: covered.slice(-MAX_COVERED), threads: kept },
  };
}

/** Whether a covered-key was already spent for this league. */
export function isCovered(ledger: Ledger, leagueId: string, key: string): boolean {
  return (ledger[leagueId]?.covered ?? []).includes(key);
}

/** A subject's merge key: case, punctuation and spacing ignored. */
export function threadSlug(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isThread(value: unknown): value is StoryThread {
  const thread = value as Partial<StoryThread>;
  return (
    typeof thread?.subject === "string" &&
    thread.subject !== "" &&
    typeof thread.beat === "string" &&
    (thread.status === "open" || thread.status === "retired") &&
    typeof thread.beats === "number" &&
    typeof thread.lastUsedAt === "string"
  );
}
