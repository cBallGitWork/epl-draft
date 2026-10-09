import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_PAPER_STORIES, composePaper, type PublishedStory, type StoryKind } from "@epl/core";
import { readLedger, readPaperStories, saveFiling, type Filing } from "./persist";

const NOW = "2026-10-10T12:00:00.000Z";
const EARLIER = "2026-10-10T09:00:00.000Z";
const YESTERDAY = "2026-10-09T09:00:00.000Z";
const LEAGUE = "a-test-league";

const roots: string[] = [];
function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "edition-"));
  roots.push(root);
  return root;
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function story(slug: string, kind: StoryKind = "match-report", filedAt = NOW, period = 1): PublishedStory {
  return {
    slug, kind, leagueId: LEAGUE, period, gameweek: 6, filedAt, expiresAt: null,
    edition: "", byline: "", headline: `Headline ${slug}`, deck: "", body: "", subjects: [slug], image: null, face: null,
  };
}

function filing(slug: string, kind?: StoryKind, period?: number): Filing {
  return { story: story(slug, kind, NOW, period), spentKeys: [`key:${slug}`], threads: [] };
}

describe("a firing's save point", () => {
  it("the ledger is written after the paper and archive", () => {
    const clear = tempRoot();
    saveFiling([], [filing("a")], {}, NOW, clear);
    expect(readLedger(clear)[LEAGUE]?.covered).toEqual(["key:a"]);

    // A directory in a file's place stops the save there; the ledger, the commit point, must not be written.
    for (const blocked of ["paper.json", join("archive", LEAGUE, "a.json")]) {
      const root = tempRoot();
      mkdirSync(join(root, blocked), { recursive: true });
      expect(() => saveFiling([], [filing("a")], {}, NOW, root)).toThrow(/EISDIR/);
      expect(existsSync(join(root, "ledger.json"))).toBe(false);
    }
  });

  it("the paper is on disk when the archive write fails", () => {
    const root = tempRoot();
    mkdirSync(join(root, "archive", LEAGUE, "a.json"), { recursive: true });
    expect(() => saveFiling([], [filing("a")], {}, NOW, root)).toThrow();
    expect(readPaperStories(root).map((each) => each.slug)).toEqual(["a"]);
  });

  it("saving story by story writes the bytes one save of the lot did", () => {
    // A full paper: the next round's Bin XI filed second retires two stories, so the one the first save pushed
    // off the back is still in print — as it was when the firing saved once, at the end.
    const found = [
      story("bin-a", "bin-xi", EARLIER),
      story("bin-b", "bin-xi", EARLIER),
      ...Array.from({ length: MAX_PAPER_STORIES - 3 }, (_, n) => story(`old-${n}`, "match-report", EARLIER)),
      story("yesterday", "match-report", YESTERDAY),
    ];
    const root = tempRoot();
    const filings = [filing("new"), filing("report", "bin-xi", 2)];
    const ledger = saveFiling(found, filings.slice(0, 1), {}, NOW, root);
    saveFiling(found, filings, ledger, NOW, root);

    const batch = composePaper([...found, ...filings.map((each) => each.story)], NOW).slice(0, MAX_PAPER_STORIES);
    expect(readFileSync(join(root, "paper.json"), "utf8")).toBe(`${JSON.stringify({ updatedAt: NOW, stories: batch }, null, 2)}\n`);
    expect(batch.map((each) => each.slug)).toContain("yesterday");
    expect(readLedger(root)[LEAGUE]?.covered).toEqual(["key:new", "key:report"]);
  });
});
