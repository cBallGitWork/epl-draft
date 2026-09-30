import { describe, expect, it } from "vitest";
import { writerOf } from "./staff";
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
    expect(writerOfFiled("match-report")).toBe("Phil McNutly");
    expect(writerOfFiled("tie-report")).toBe("Daniel Tayler");
    expect(writerOfFiled("eleven")).toBe("Garth Crookes");
    expect(writerOfFiled("power-ranking")).toBe("Martin Samual");
    expect(writerOfFiled("dodgers")).toBe("Danny Bakor");
    expect(writerOfFiled("wire")).toBe("Fabrizio Ramono");
    expect(writerOfFiled("news")).toBe("David Ornstien");
  });

  it("lets a reporter stamped at filing win, as Lawro's archive carries his", () => {
    expect(writerOfFiled("predictions", "Mark Lawrenson")).toBe("Mark Lawrenson");
  });
});
