import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLE_REVALIDATE, PAGE_REVALIDATE } from "@epl/core";

// The one rule in this repo that a compiler cannot hold.
//
// `PAGE_REVALIDATE` says every route segment must repeat it as a LITERAL,
// because Next analyses `revalidate` statically and will not read an import.
// That is a real constraint and it has a real cost: twenty-one hand-written
// copies of one number, and until now nothing checked they agreed. A rule with
// no instrument is a hope, which is the same argument `groundfit.mjs` makes for
// the pitch and `bridge-check.ts` for the mapping.
//
// **Discovered by walking, never from a checked-in list.** PLATFORM_NOTES
// records a route list going stale as exactly the failure to avoid, and a
// parallel session is adding and removing paper routes as this runs.
//
// **`layout.tsx` as well as `page.tsx`.** `(paper)/layout.tsx` carries one of
// the copies, so a page-only glob would pass while missing it — the quiet kind
// of green that makes a test worse than none.
//
// **Two numbers since 17 Sep 2026, and which one a route takes is DERIVED.** An
// article is published by a deploy rather than by a revalidation — its prose is
// static-imported and baked into the bundle — so `(paper)/paper/**` takes
// `ARTICLE_REVALIDATE` and everything else, the front page included, takes
// `PAGE_REVALIDATE`. The split is read off the PATH and never off a list: a
// checked-in list of article routes is the staleness this file's own docblock
// warns about, and a new page under `(paper)/paper/` should be held to the
// article rule the moment it exists rather than when somebody remembers.

const APP = join(import.meta.dirname, "..", "apps", "companion", "app");
const DECLARES = /export const revalidate = (\d+)/;

/** Every route file under `app/`, found by walking it. */
function segments(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return segments(path);
    return entry.name === "page.tsx" || entry.name === "layout.tsx" ? [path] : [];
  });
}

const declared = segments(APP)
  .map((path) => ({ path, match: DECLARES.exec(readFileSync(path, "utf8")) }))
  .filter((entry): entry is { path: string; match: RegExpExecArray } => entry.match !== null);

/** Which constant a route answers to, from its path alone. Everything under the
 *  paper's `paper/` subtree prints an article; the front page does not. */
function expected(path: string): number {
  return path.includes(join("(paper)", "paper")) ? ARTICLE_REVALIDATE : PAGE_REVALIDATE;
}

describe("every route segment's revalidate", () => {
  it("is found at all — the walk works", () => {
    // A regex that stops matching would otherwise pass this file silently by
    // finding nothing to disagree with.
    expect(declared.length).toBeGreaterThan(5);
  });

  it("agrees with the constant its route answers to", () => {
    const wrong = declared
      .filter((entry) => Number(entry.match[1]) !== expected(entry.path))
      .map(
        (entry) =>
          `${entry.path.slice(APP.length + 1)} = ${entry.match[1]}, wanted ${expected(entry.path)}`,
      );

    expect(wrong).toEqual([]);
  });

  it("holds both constants, so neither rule is vacuous", () => {
    // A split that all fell on one side would pass the check above while
    // testing nothing about the other number.
    const values = new Set(declared.map((entry) => Number(entry.match[1])));
    expect(values).toEqual(new Set([PAGE_REVALIDATE, ARTICLE_REVALIDATE]));
  });
});
