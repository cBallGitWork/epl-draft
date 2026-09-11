// The newsroom's memory: what has been covered, and which storylines are
// running. Committed beside the paper and read back before every filing.
//
// Two jobs that share a file because they share a rhythm — both are written in
// the same commit as the stories that change them:
//
// **Covered keys are the idempotence truth.** A cron that fires every half hour
// must find "already filed" somewhere cheaper than an API call, and the key
// grammar is ours: club codes, never per-season ids (`layer-split.md`'s
// identity rule reaches persisted keys too), and a news item's key is its
// article URL with the fragment stripped — the BBC feed re-lists the same
// article under different `#n` positions, so the raw guid double-covers.
//
// **Threads carry wear.** The World Cup paper repeated its jokes daily because
// nothing made it stop; a 38-week season needs the brake in the data. Every
// thread counts its beats and remembers when it last ran, so the brief can
// split storylines into "live, may advance" and "worn, may not reuse".

/** One running storyline, as the model reports it and the ledger wears it. */
export interface StoryThread {
  /** What the saga is about, in a few words. Doubles as the merge key once
   *  slugged, so two phrasings of one saga stay one thread. */
  subject: string;
  /** The latest development, one line. */
  beat: string;
  /** `open` runs; `retired` is finished or worn out and may not come back. */
  status: "open" | "retired";
  /** How many editions have advanced it. Past `THREAD_MAX_BEATS` the brief
   *  moves it to the worn list whatever its status says. */
  beats: number;
  /** ISO instant of the last edition that used it. */
  lastUsedAt: string;
}

/** One league's memory. Keyed by league for the same reason every persisted
 *  shape here carries a leagueId: the rehearsal league rehearses, and its
 *  memory must not leak onto the real league's paper. */
export interface LedgerBook {
  covered: string[];
  threads: StoryThread[];
}

export type Ledger = Record<string, LedgerBook>;

/** Covered keys kept per league. A key this old is a round long superseded —
 *  at the paper's own cap of two rounds in print, four hundred keys is months
 *  of margin, and the ledger stays a file a human can open. */
export const MAX_COVERED = 400;

/** Threads kept per league, open and retired together. */
const MAX_THREADS = 24;

/** Beats before a thread is worn out. Six editions on one joke is already one
 *  more than the World Cup paper's readers wanted. */
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

/** What the model reports back per story: the saga, the development, and
 *  whether it is done. Wear is ours to keep, not its to claim. */
export interface ThreadUpdate {
  subject: string;
  beat: string;
  status?: "open" | "retired";
}

/** The ledger after a filing: keys spent, threads advanced, wear counted.
 *  Pure — returns a new ledger, clocks injected as the filing instant. */
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
        // The first phrasing of the subject stays — it is the merge identity.
        subject: thread.subject,
        beat: update.beat,
        // Retirement is a one-way door: a worn joke does not reopen because
        // the model liked it again.
        status: thread.status === "retired" ? "retired" : (update.status ?? "open"),
        beats: thread.beats + 1,
        lastUsedAt: filedAt,
      };
    }
  }
  // Oldest-used drop first when over the cap; retired before open at equal age,
  // since a retired thread is only kept to stop its own resurrection.
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

/** Two phrasings of one saga are one thread: case, punctuation and spacing do
 *  not multiply storylines. */
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
