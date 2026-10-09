import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  FANTRAX_LEAGUE_ID,
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

// Where a filing lands: the paper, its archive file, then the ledger, one story at a time. These
// commits ride GITHUB_TOKEN and run no CI, so what this file refuses is the only refusal there is.

const paperPath = (root: string): string => join(root, "paper.json");
const ledgerPath = (root: string): string => join(root, "ledger.json");

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
export function readPaperStories(root = EDITIONS_ROOT): PublishedStory[] {
  const parsed = readJson(paperPath(root));
  if (parsed === null || typeof parsed !== "object") return [];
  const stories = (parsed as { stories?: unknown }).stories;
  if (!Array.isArray(stories)) return [];
  return stories.map(normalizeStory).filter((story): story is PublishedStory => story !== null);
}

/** Every archived story of one kind in the served league, the latest period first. The paper keeps 24 and retires a
 *  column once its round is reported; the archive keeps them all, which is what a record is marked from. */
export function readArchive(kind: StoryKind): PublishedStory[] {
  const dir = join(EDITIONS_ROOT, "archive", FANTRAX_LEAGUE_ID);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name) => {
      const story = normalizeStory(readJson(join(dir, name)));
      return story !== null && story.kind === kind && story.leagueId === FANTRAX_LEAGUE_ID ? [story] : [];
    })
    .sort((a, b) => b.period - a.period);
}

export function readLedger(root = EDITIONS_ROOT): Ledger {
  return normalizeLedger(readJson(ledgerPath(root)));
}

export interface Filing {
  story: PublishedStory;
  spentKeys: readonly string[];
  threads: readonly ThreadUpdate[];
}

/** The newest of `filings` saved: the paper, its archive file, then the ledger LAST. The ledger is
 *  the commit point: a story whose save died before it is filed again next firing, never lost. */
export function saveFiling(
  found: readonly PublishedStory[],
  filings: readonly Filing[],
  ledger: Ledger,
  now: string,
  root = EDITIONS_ROOT,
): Ledger {
  const filing = filings.at(-1);
  if (filing === undefined) return ledger;
  printStory(found, filings, filing.story, now, root);
  const book = recordCoverage(ledger, filing.story.leagueId, filing.spentKeys, filing.threads, now);
  writeFileSync(ledgerPath(root), `${JSON.stringify(book, null, 2)}\n`);
  return book;
}

/** The paper as the firing `found` it plus every story it has filed, and `story`'s archive file.
 *  Composed from `found` every time, so the last save prints what one save of the lot would. */
export function printStory(
  found: readonly PublishedStory[],
  filings: readonly Filing[],
  story: PublishedStory,
  now: string,
  root = EDITIONS_ROOT,
): void {
  const leagueId = story.leagueId;
  const mine = found.filter((each) => each.leagueId === leagueId);
  const others = found.filter((each) => each.leagueId !== leagueId);

  const slugs = new Set(filings.map((filing) => filing.story.slug));
  const merged = composePaper(
    [...mine.filter((each) => !slugs.has(each.slug)), ...filings.map((filing) => filing.story)],
    now,
  ).slice(0, MAX_PAPER_STORIES);
  // Filing cannot shrink a paper to nothing; if it did, the compose dropped what it should have kept.
  if (merged.length === 0) throw new Error("Filing produced an empty paper; refusing to write it.");

  mkdirSync(root, { recursive: true });
  writeFileSync(paperPath(root), `${JSON.stringify({ updatedAt: now, stories: [...others, ...merged] }, null, 2)}\n`);

  const archiveDir = join(root, "archive", leagueId);
  mkdirSync(archiveDir, { recursive: true });
  writeFileSync(join(archiveDir, `${story.slug}.json`), `${JSON.stringify(story, null, 2)}\n`);
}
