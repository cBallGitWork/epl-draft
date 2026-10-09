import { describe, expect, it } from "vitest";
import { type SortKey, defaultDescending } from "@epl/core";
import { sortHref } from "./sort";

/** The order the page reads off a head's link, as `league/page.tsx` parses it. */
function readBack(href: string): { sort: string; descending: boolean } {
  const query = new URL(href, "http://x").searchParams;
  const sort = (query.get("sort") ?? "rank") as SortKey;
  const dir = query.get("dir");
  return { sort, descending: dir === null ? defaultDescending(sort) : dir === "desc" };
}

describe("sortHref", () => {
  it("flips a column that opens high to low", () => {
    expect(readBack(sortHref("pts", "pts", true))).toEqual({ sort: "pts", descending: false });
  });

  it("flips it back", () => {
    expect(readBack(sortHref("pts", "pts", false))).toEqual({ sort: "pts", descending: true });
  });

  it("opens a new column its natural way", () => {
    expect(readBack(sortHref("pts", "rank", false))).toEqual({ sort: "pts", descending: true });
    expect(readBack(sortHref("against", "pts", true))).toEqual({ sort: "against", descending: false });
  });

  it("sends Fantrax's order to the bare route", () => {
    expect(sortHref("rank", "rank", true)).toBe("/league");
  });
});
