import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_PAPER_STORIES,
  composePaper,
  normalizeLedger,
  normalizeStory,
  recordCoverage,
  type Ledger,
  type PublishedEdition,
  type PublishedStory,
  type ThreadUpdate,
} from "@epl/core";
import { EDITIONS_ROOT } from "../paths";

// Where a filing lands: the paper, the ledger, the archive, and (until the app
// reads the paper directly) the latest.json mirror. All in one commit, which is
// why the validation here is load-bearing — these commits ride GITHUB_TOKEN and
// run no CI, so what this file refuses is the only refusal there is.

const PAPER_PATH = join(EDITIONS_ROOT, "paper.json");
const LEDGER_PATH = join(EDITIONS_ROOT, "ledger.json");

function readJson(path: string): unknown {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    // An unreadable file is treated as absent: the writer rebuilds it from what
    // it can prove, rather than dying on a corrupt commit forever.
    return null;
  }
}

/** Every story on file, all leagues — persistence must not drop another
 *  league's paper while filing this one's. */
export function readPaperStories(): PublishedStory[] {
  const parsed = readJson(PAPER_PATH);
  if (parsed === null || typeof parsed !== "object") return [];
  const stories = (parsed as { stories?: unknown }).stories;
  if (!Array.isArray(stories)) return [];
  return stories.map(normalizeStory).filter((story): story is PublishedStory => story !== null);
}

export function readLedger(): Ledger {
  return normalizeLedger(readJson(LEDGER_PATH));
}

export interface Filing {
  story: PublishedStory;
  /** The old shape, mirrored to latest.json while the app still reads it. Null
   *  once a filing kind has no old shape to mirror. */
  mirror: PublishedEdition | null;
  spentKeys: readonly string[];
  threads: readonly ThreadUpdate[];
}

/** Everything a filing changes, written together so the commit is atomic. */
export function persistFiling(filing: Filing, ledger: Ledger, now: string): void {
  const { story } = filing;
  const existing = readPaperStories();
  const mine = existing.filter((each) => each.leagueId === story.leagueId);
  const others = existing.filter((each) => each.leagueId !== story.leagueId);

  const merged = composePaper(
    [...mine.filter((each) => each.slug !== story.slug), story],
    now,
  ).slice(0, MAX_PAPER_STORIES);
  // The one impossible outcome: filing a story cannot shrink a paper to
  // nothing. If it did, the compose dropped what it should have kept, and a
  // red run is cheaper than an empty front page.
  if (merged.length === 0) throw new Error("Filing produced an empty paper; refusing to write it.");

  mkdirSync(EDITIONS_ROOT, { recursive: true });
  writeFileSync(
    PAPER_PATH,
    `${JSON.stringify({ updatedAt: now, stories: [...others, ...merged] }, null, 2)}\n`,
  );

  const archiveDir = join(EDITIONS_ROOT, "archive", story.leagueId);
  mkdirSync(archiveDir, { recursive: true });
  writeFileSync(join(archiveDir, `${story.slug}.json`), `${JSON.stringify(story, null, 2)}\n`);

  writeFileSync(
    LEDGER_PATH,
    `${JSON.stringify(recordCoverage(ledger, story.leagueId, filing.spentKeys, filing.threads, now), null, 2)}\n`,
  );

  if (filing.mirror !== null) {
    writeFileSync(join(EDITIONS_ROOT, "latest.json"), `${JSON.stringify(filing.mirror, null, 2)}\n`);
  }
}
