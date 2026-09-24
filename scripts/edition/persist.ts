import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_PAPER_STORIES,
  composePaper,
  normalizeLedger,
  normalizeStory,
  recordCoverage,
  type Ledger,
  type PublishedStory,
  type StoryKind,
  type ThreadUpdate,
} from "@epl/core";
import { EDITIONS_ROOT } from "../paths";

// Where a filing lands: the paper, the ledger, the archive. All in one commit,
// which is why the validation here is load-bearing — these commits ride
// GITHUB_TOKEN and run no CI, so what this file refuses is the only refusal
// there is.

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

/** Every archived story of one kind in one league. The paper keeps 24 and retires a column once
 *  its round is reported; the archive keeps them all, which is what a record is marked from. */
export function readArchive(leagueId: string, kind: StoryKind): PublishedStory[] {
  const dir = join(EDITIONS_ROOT, "archive", leagueId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      const story = normalizeStory(readJson(join(dir, name)));
      return story !== null && story.kind === kind && story.leagueId === leagueId ? [story] : [];
    });
}

export function readLedger(): Ledger {
  return normalizeLedger(readJson(LEDGER_PATH));
}

export interface Filing {
  story: PublishedStory;
  spentKeys: readonly string[];
  threads: readonly ThreadUpdate[];
}

/** Everything a firing's filings change, written together so the commit is
 *  atomic. One firing serves one league — the first story's. */
export function persistFilings(filings: readonly Filing[], ledger: Ledger, now: string): void {
  if (filings.length === 0) return;
  const leagueId = filings[0].story.leagueId;

  const existing = readPaperStories();
  const mine = existing.filter((each) => each.leagueId === leagueId);
  const others = existing.filter((each) => each.leagueId !== leagueId);

  const slugs = new Set(filings.map((filing) => filing.story.slug));
  const merged = composePaper(
    [...mine.filter((each) => !slugs.has(each.slug)), ...filings.map((filing) => filing.story)],
    now,
  ).slice(0, MAX_PAPER_STORIES);
  // The one impossible outcome: filing stories cannot shrink a paper to
  // nothing. If it did, the compose dropped what it should have kept, and a
  // red run is cheaper than an empty front page.
  if (merged.length === 0) throw new Error("Filing produced an empty paper; refusing to write it.");

  mkdirSync(EDITIONS_ROOT, { recursive: true });
  writeFileSync(
    PAPER_PATH,
    `${JSON.stringify({ updatedAt: now, stories: [...others, ...merged] }, null, 2)}\n`,
  );

  const archiveDir = join(EDITIONS_ROOT, "archive", leagueId);
  mkdirSync(archiveDir, { recursive: true });
  let book = ledger;
  for (const filing of filings) {
    writeFileSync(
      join(archiveDir, `${filing.story.slug}.json`),
      `${JSON.stringify(filing.story, null, 2)}\n`,
    );
    book = recordCoverage(book, leagueId, filing.spentKeys, filing.threads, now);
  }
  writeFileSync(LEDGER_PATH, `${JSON.stringify(book, null, 2)}\n`);
}
