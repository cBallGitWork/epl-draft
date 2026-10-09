import { describe, expect, it, vi } from "vitest";
import { type TableSortKey, defaultDescendingTable } from "@epl/core";
import { tableHref } from "./sort";

// The nav is a component whose `@/` imports vitest does not resolve; the route is all `sort.ts` reads of it.
vi.mock("./PremNav", () => ({ TABLE: "/prem" }));

/** The order the page reads off a head's link, as `prem/(competition)/page.tsx` parses it. */
function readBack(href: string): { sort: string; descending: boolean } {
  const query = new URL(href, "http://x").searchParams;
  const sort = (query.get("sort") ?? "place") as TableSortKey;
  const dir = query.get("dir");
  return { sort, descending: dir === null ? defaultDescendingTable(sort) : dir === "desc" };
}

describe("tableHref", () => {
  it("flips a column that opens high to low", () => {
    expect(readBack(tableHref("pts", "pts", true))).toEqual({ sort: "pts", descending: false });
  });

  it("flips it back", () => {
    expect(readBack(tableHref("pts", "pts", false))).toEqual({ sort: "pts", descending: true });
  });

  it("opens a new column its natural way", () => {
    expect(readBack(tableHref("against", "pts", true))).toEqual({ sort: "against", descending: false });
  });

  it("sends the competition's order to the bare route", () => {
    expect(tableHref("place", "place", true)).toBe("/prem");
  });
});
