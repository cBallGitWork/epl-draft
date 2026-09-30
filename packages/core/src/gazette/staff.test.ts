import { describe, expect, it } from "vitest";
import { STAFF_WRITERS, writerOf } from "./staff";
import { normalizeStory } from "./story";

// A story as the archive holds it: filed under Franco Bell before the staff existed, so with no `reporter`.
const writerOfFiled = (kind: string, reporter?: string) => {
  const story = normalizeStory({
    slug: `gw5-${kind}`,
    kind,
    leagueId: "zbn1z3ukmsgb36sz",
    period: 5,
    gameweek: 5,
    filedAt: "2026-09-22T08:00:00.000Z",
    headline: "Something clever",
    ...(reporter === undefined ? {} : { reporter }),
  });
  return story === null ? null : writerOf(story);
};

describe("writerOf", () => {
  it("names a filed story with no reporter after its kind's staff writer", () => {
    expect(writerOfFiled("match-report")).toBe("Phill McLunty");
    expect(writerOfFiled("tie-report")).toBe("Danial Talyor");
    expect(writerOfFiled("eleven")).toBe("Garf Crookes");
    expect(writerOfFiled("power-ranking")).toBe("Martyn Masuel");
    expect(writerOfFiled("dodgers")).toBe("Donny Kaber");
    expect(writerOfFiled("wire")).toBe("Fabrizzio Morano");
    expect(writerOfFiled("news")).toBe("Davide Onrstein");
    expect(writerOfFiled("predicted-xi")).toBe("Davide Onrstein");
  });

  it("lets a reporter stamped at filing win, as Lawro's archive carries his", () => {
    expect(writerOfFiled("predictions", "Mark Lawrenson")).toBe("Mark Lawrenson");
  });

  it("mangles both names of the journalist each writer is after, and never prints the real one", () => {
    const after = {
      "match-report": "Phil McNulty", "tie-report": "Daniel Taylor", eleven: "Garth Crooks", "power-ranking": "Martin Samuel",
      dodgers: "Danny Baker", wire: "Fabrizio Romano", news: "David Ornstein",
    } as const;
    for (const [kind, real] of Object.entries(after)) {
      const staff = STAFF_WRITERS[kind as keyof typeof after];
      expect(staff, real).toBeDefined();
      const [first, last] = real.split(" ");
      const [staffFirst, staffLast] = (staff ?? "").split(" ");
      expect(staffFirst, real).not.toBe(first);
      expect(staffLast, real).not.toBe(last);
    }
  });
});
