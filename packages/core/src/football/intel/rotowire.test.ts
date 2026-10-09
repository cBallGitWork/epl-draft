import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { xiFault } from "./map";
import { joinRotowireSide, parseRotowireXi } from "./rotowire";

// Arsenal v Leeds and Liverpool v Man City as RotoWire drew them on 9 Oct 2026.
const HTML = readFileSync(new URL("../__fixtures__/rotowireLineups.html", import.meta.url), "utf8");
const ties = parseRotowireXi(HTML);
const liverpool = ties[1].home;
const city = ties[1].away;
const ISAK = 23369;
const JACQUET = 39552;

describe("parseRotowireXi", () => {
  it("reads each match, home side first, by RotoWire's club label", () => {
    expect(ties.map((tie) => [tie.home.abbr, tie.away.abbr])).toEqual([
      ["ARS", "LEE"],
      ["LIV", "MCI"],
    ]);
  });

  it("reads Liverpool's predicted eleven, keeper first, without Isak", () => {
    expect(liverpool.confirmed).toBe(false);
    expect(liverpool.formation).toBe("4-2-3-1");
    expect(liverpool.slots).toEqual({ "1": 1, "2": 4, "3": 2, "4": 3, "5": 1 });
    expect(liverpool.starters).toEqual([21124, 35296, 19194, JACQUET, 30591, 30875, 29041, 35762, 29729, 44878, 32412]);
    expect(liverpool.starters).not.toContain(ISAK);
  });

  it("tags Isak out and Jacquet questionable, once each, and a suspension as out", () => {
    const status = new Map(liverpool.absent.map((man) => [man.rotowireId, man.status]));
    expect(status.get(ISAK)).toBe("OUT");
    expect(status.get(JACQUET)).toBe("QUES");
    expect(liverpool.absent.filter((man) => man.rotowireId === JACQUET)).toHaveLength(1);
    // Foden, SUS.
    expect(city.absent).toContainEqual({ rotowireId: 24854, status: "OUT" });
  });

  it("finds nothing on a page with no lineup boxes", () => {
    expect(parseRotowireXi("<html>a challenge page</html>")).toEqual([]);
  });

  it("leaves the slots unknown for a position label it cannot place", () => {
    const odd = HTML.replace('lineup__pos ">GK<', 'lineup__pos ">XX<');
    expect(parseRotowireXi(odd)[0].home.slots).toBeNull();
  });
});

describe("joinRotowireSide", () => {
  it("joins every man through the given ids, and the eleven passes", () => {
    const { xi, unjoined } = joinRotowireSide(liverpool, (id) => id + 1);
    expect(unjoined).toEqual([]);
    expect(xi.lineup).toBe("predicted");
    expect(xi.starters[0]).toEqual({ code: 21125, prob: 0.9 });
    expect(xi.absent).toContainEqual({ code: ISAK + 1, status: "OUT" });
    expect(xiFault(xi)).toBeNull();
  });

  it("leaves out a man it cannot join and reports him, so the eleven falls short", () => {
    const { xi, unjoined } = joinRotowireSide(liverpool, (id) => (id === JACQUET ? null : id));
    expect(unjoined).toEqual([JACQUET]);
    expect(xi.starters).toHaveLength(10);
    expect(xi.absent?.some((man) => man.code === JACQUET)).toBe(false);
    expect(xiFault(xi)).not.toBeNull();
  });
});
