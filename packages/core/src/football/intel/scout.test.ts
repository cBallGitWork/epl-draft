import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { xiFault } from "./map";
import { parseScoutXi, sameElevens } from "./scout";

// Arsenal and Chelsea as Scout's team-news page drew them on 23 Sep 2026.
const HTML = readFileSync(new URL("../__fixtures__/scoutTeamNews.html", import.meta.url), "utf8");
const clubs = parseScoutXi(HTML);

describe("parseScoutXi", () => {
  it("reads every club block, keyed by FPL's short name", () => {
    expect(Object.keys(clubs).sort()).toEqual(["ARS", "CHE"]);
  });

  it("keeps Scout's formation and its order: keeper first, each row as drawn", () => {
    expect(clubs.ARS.formation).toBe("4-2-3-1");
    expect(clubs.ARS.starters.map((man) => man.code)).toEqual([
      154561, 445122, 199798, 226597, 466075, 204480, 208706, 223340, 184029, 439509, 219847,
    ]);
  });

  it("counts each row Scout draws, so a short one is caught", () => {
    expect(clubs.CHE.slots).toEqual({ "1": 1, "2": 3, "3": 4, "4": 3 });
    expect(xiFault(clubs.ARS)).toBeNull();
    expect(xiFault(clubs.CHE)).toBeNull();
  });

  it("finds nothing on a page with no club blocks", () => {
    expect(parseScoutXi("<html>a challenge page</html>")).toEqual({});
  });
});

describe("sameElevens", () => {
  it("is true for the same men in the same shapes", () => {
    expect(sameElevens(clubs, parseScoutXi(HTML))).toBe(true);
  });

  it("is false when one man changes", () => {
    const changed = { ...clubs, ARS: { ...clubs.ARS, starters: [{ code: 1, prob: 0.9 }, ...clubs.ARS.starters.slice(1)] } };
    expect(sameElevens(clubs, changed)).toBe(false);
  });

  it("is false when a club is missing", () => {
    expect(sameElevens(clubs, { ARS: clubs.ARS })).toBe(false);
  });
});
