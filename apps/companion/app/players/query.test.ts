import { describe, expect, it } from "vitest";
import { chosen, filterHref, isChosen, shownRows } from "./query";
import type { PoolRow } from "./pool";

const player = (
  fantraxId: string,
  positions: string[],
  status: string,
  name = fantraxId,
): PoolRow =>
  ({
    entry: {
      player: { fantraxId, displayName: name, rawName: name, clubCode: "ARS", position: null, rotowireId: null },
      eligiblePositions: positions,
      status,
      ownerTeamId: null,
    },
    stats: null,
    fplCode: null,
  }) as unknown as PoolRow;

const NOBODY = new Map<string, Record<string, number | null>>();

describe("chosen", () => {
  it("reads a comma list, and nothing from an absent one", () => {
    expect(chosen("D,M")).toEqual(["D", "M"]);
    expect(chosen(undefined)).toEqual([]);
  });

  it("drops a blank rather than filtering on the empty string", () => {
    expect(chosen("D,")).toEqual(["D"]);
  });
});

describe("filterHref", () => {
  it("adds a second value rather than replacing the first", () => {
    expect(filterHref({ pos: "D" }, "pos", "M")).toContain("pos=D%2CM");
  });

  it("takes one away and leaves the rest", () => {
    expect(filterHref({ pos: "D,M,F" }, "pos", "M")).toContain("pos=D%2CF");
  });

  it("drops the parameter when the last one goes off", () => {
    expect(filterHref({ pos: "D" }, "pos", "D")).toBe("/players");
  });

  it("keeps the other controls' state, so a chip cannot quietly do two things", () => {
    const href = filterHref({ pos: "D", q: "saka", sort: "fpts" }, "pos", "M");
    expect(href).toContain("q=saka");
    expect(href).toContain("sort=fpts");
  });
});

describe("isChosen", () => {
  it("is on for a value in the list and off for one merely containing it", () => {
    expect(isChosen({ pos: "D,M" }, "pos", "M")).toBe(true);
    // "M" must not match inside "MID" — a substring test would light the wrong chip.
    expect(isChosen({ pos: "MID" }, "pos", "M")).toBe(false);
  });
});

describe("shownRows", () => {
  const pool = [
    player("a", ["D"], "FA"),
    player("b", ["M"], "FA"),
    player("c", ["F"], "WW"),
    player("d", ["D", "M"], "T"),
  ];

  it("shows everyone when nothing is chosen", () => {
    expect(shownRows(pool, {}, NOBODY)).toHaveLength(4);
  });

  it("unions within one filter — a defender OR a midfielder", () => {
    const shown = shownRows(pool, { pos: "D,M" }, NOBODY).map((row) => row.entry.player.fantraxId);
    expect(shown.sort()).toEqual(["a", "b", "d"]);
  });

  it("intersects between filters — a midfielder who is also a free agent", () => {
    const shown = shownRows(pool, { pos: "D,M", status: "FA" }, NOBODY).map(
      (row) => row.entry.player.fantraxId,
    );
    expect(shown.sort()).toEqual(["a", "b"]);
  });

  it("keeps a man eligible at either of two chosen positions once", () => {
    // `d` is D and M, and both are chosen. A filter that returned him twice
    // would be a directory that grew as you narrowed it.
    const shown = shownRows([player("d", ["D", "M"], "T")], { pos: "D,M" }, NOBODY);
    expect(shown).toHaveLength(1);
  });
});
