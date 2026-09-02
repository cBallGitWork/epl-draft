import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_REVALIDATE } from "@epl/core";

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

describe("every route segment's revalidate", () => {
  it("is found at all — the walk works", () => {
    // A regex that stops matching would otherwise pass this file silently by
    // finding nothing to disagree with.
    expect(declared.length).toBeGreaterThan(5);
  });

  it("agrees with PAGE_REVALIDATE", () => {
    const wrong = declared
      .filter((entry) => Number(entry.match[1]) !== PAGE_REVALIDATE)
      .map((entry) => `${entry.path.slice(APP.length + 1)} = ${entry.match[1]}`);

    expect(wrong).toEqual([]);
  });
});
