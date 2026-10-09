import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLE_REVALIDATE, PAGE_REVALIDATE } from "../apps/companion/app/config";

// Next reads `revalidate` statically, so every route segment repeats its constant as a literal; this holds each copy,
// pages and layouts both, found by walking `app/`. `(paper)/paper/**` takes ARTICLE_REVALIDATE (an article ships with
// a deploy), everything else PAGE_REVALIDATE, decided by the path and never by a list.

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

/** Read as text: importing `next.config.ts` would bring Next's own `ProcessEnv` typing into every script. */
const STALE = /staleTimes: \{ dynamic: (\d+) \}/;

describe("the router's own cache", () => {
  it("keeps a visited page on the phone as long as the server keeps it", () => {
    const config = readFileSync(join(APP, "..", "next.config.ts"), "utf8");
    // A regex that stops matching reads NaN, which fails rather than passing on nothing.
    expect(Number(STALE.exec(config)?.[1])).toBe(PAGE_REVALIDATE);
  });
});
