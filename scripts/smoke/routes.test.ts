import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { NEVER_WALKED, skipped, walkPaths } from "./routes";

// Holds the smoke walk to the app's route table, found by walking `app/` for its pages, never from a list.

const APP = join(import.meta.dirname, "..", "..", "apps", "companion", "app");

/** Every page's route, `(group)` folders dropped: `/players/[fantraxId]/data`. */
function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    if (entry.name !== "page.tsx") return [];
    const segments = relative(APP, dir).split(sep).filter((segment) => segment !== "" && !/^\(.*\)$/.test(segment));
    return [`/${segments.join("/")}`];
  });
}

/** Whether a walked path is an instance of a route: `[param]` takes one segment, and the query is not the route's. */
function instanceOf(route: string, path: string): boolean {
  const pattern = route.split("/").map((segment) => (/^\[.+\]$/.test(segment) ? "[^/]+" : segment)).join("/");
  return new RegExp(`^${pattern}$`).test(path.split("?")[0]);
}

const ALL_IDS = { teamId: "t1", playerId: "p1", club: 3, match: 4 };
const ROUTES = pages(APP);

describe("the smoke walk", () => {
  it("visits every page the app has, bar those it says it never walks", () => {
    const walked = walkPaths(ALL_IDS);
    const missed = ROUTES.filter((route) => !(route in NEVER_WALKED) && !walked.some((path) => instanceOf(route, path)));
    expect(missed).toEqual([]);
  });

  it("names only real routes as never walked, and never walks them", () => {
    const walked = walkPaths(ALL_IDS);
    for (const route of Object.keys(NEVER_WALKED)) {
      expect(ROUTES).toContain(route);
      expect(walked.filter((path) => instanceOf(route, path))).toEqual([]);
    }
  });

  it("says which id-scoped routes it skipped when a read named no id", () => {
    expect(skipped(ALL_IDS)).toEqual([]);
    const lines = skipped({ ...ALL_IDS, club: null, match: null });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^\/prem\/club\/\[code\] /);
    expect(lines[1]).toMatch(/^\/prem\/match\/\[id\] /);
  });
});
