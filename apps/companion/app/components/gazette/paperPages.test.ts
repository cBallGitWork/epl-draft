import { describe, expect, it } from "vitest";
import { STORY_KINDS } from "@epl/core";
import { PAPER_PAGES, pageOf } from "./paperPages";

// Every kind must reach a page, or its stories are reachable from nowhere.
//
// On 17 Sep 2026 `wire` and `news` were in no page's `kinds`. Four of the
// sixteen filed stories were therefore linked from no page in the app — not the
// front page, which shows eight and ranked them 10th, 11th, 12th and 16th, and
// not either inside page, which filter by kind. Typing the URL reached them, and
// the folio then called them "Page 1", because the slug route falls back to
// `?? 1` when no page claims the kind.

describe("every story kind reaches a page", () => {
  it("has no orphans", () => {
    const orphaned = STORY_KINDS.filter((kind) => pageOf(kind) === null);
    expect(orphaned).toEqual([]);
  });

  it("puts each kind on exactly one page", () => {
    // Two pages claiming a kind would make `pageOf` depend on array order, and
    // a teaser would point at a different page than the article's own folio.
    for (const kind of STORY_KINDS) {
      const claiming = PAPER_PAGES.filter((page) => page.kinds?.includes(kind));
      expect(claiming, `${kind} is claimed by ${claiming.length} pages`).toHaveLength(1);
    }
  });

  it("claims no kind that does not exist", () => {
    // A typo in the table would silently orphan the kind it meant to claim.
    const known = new Set<string>(STORY_KINDS);
    const unknown = PAPER_PAGES.flatMap((page) => page.kinds ?? []).filter((kind) => !known.has(kind));
    expect(unknown).toEqual([]);
  });
});
