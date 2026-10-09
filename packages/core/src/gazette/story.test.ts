import { describe, expect, it } from "vitest";
import { normalizePaper, normalizeStory } from "./story";
import type { PublishedStory } from "./story";

const LEAGUE = "zbn1z3ukmsgb36sz";

const story = (over: Partial<PublishedStory> = {}): PublishedStory => ({
  slug: "gw3-report",
  kind: "match-report",
  leagueId: LEAGUE,
  period: 3,
  gameweek: 3,
  filedAt: "2026-08-31T09:00:00.000Z",
  expiresAt: null,
  edition: "The Monday Club",
  byline: "The Back Page",
  headline: "Something clever",
  deck: "Something plain.",
  body: "A paragraph.\n\nAnother.",
  subjects: ["match-report:gw3:2026-08-30"],
  image: null,
  face: null,
  ties: [],
  ...over,
});

describe("normalizeStory", () => {
  it("keeps a well-formed story", () => {
    expect(normalizeStory(story())).toEqual(story());
  });

  it("refuses what cannot be a story: no slug, unknown kind, no league, no round, no headline, no dateline", () => {
    // Each of these reads as "there is no such story", never a thrown page: the
    // payload was written with a model's help, so the schema is a request.
    expect(normalizeStory({ ...story(), slug: "" })).toBeNull();
    expect(normalizeStory({ ...story(), kind: "editorial-cartoon" })).toBeNull();
    // A kind the paper retired on 1 Oct 2026, as the archive still holds it.
    expect(normalizeStory({ ...story(), kind: "tie-report" })).toBeNull();
    expect(normalizeStory({ ...story(), leagueId: "" })).toBeNull();
    expect(normalizeStory({ ...story(), period: "3" })).toBeNull();
    expect(normalizeStory({ ...story(), headline: "" })).toBeNull();
    // Undated is unprintable, not coerced: the reversal that lets journalism
    // lead under moving scores leans entirely on the filed instant printing.
    expect(normalizeStory({ ...story(), filedAt: "" })).toBeNull();
    expect(normalizeStory(null)).toBeNull();
  });

  it("coerces the optional cargo and preserves absence as absence", () => {
    const survived = normalizeStory({
      slug: "s", kind: "presser", leagueId: LEAGUE, period: 3, gameweek: 3,
      headline: "H", filedAt: "2026-08-31T09:00:00.000Z",
    });
    expect(survived).not.toBeNull();
    expect(survived?.expiresAt).toBeNull();
    expect(survived?.image).toBeNull();
    expect(survived?.subjects).toEqual([]);
    expect(survived?.extras).toBeUndefined();
    // An empty expiry string is "does not expire", not an instant.
    expect(normalizeStory(story({ expiresAt: "" }))?.expiresAt).toBeNull();
    // A story filed before the Line-Ups led carries no lead, and an empty one is none.
    expect(survived).not.toHaveProperty("leadsUntil");
    expect(normalizeStory(story({ leadsUntil: "" }))).not.toHaveProperty("leadsUntil");
    expect(normalizeStory(story({ leadsUntil: "2026-10-10T11:15:00.000Z" }))?.leadsUntil).toBe("2026-10-10T11:15:00.000Z");
  });

  it("refuses an image without a source and keeps one with", () => {
    expect(normalizeStory({ ...story(), image: { src: "", alt: "x" } })?.image).toBeNull();
    expect(normalizeStory(story({ image: { src: "/paper/gw3.webp", alt: "The rout" } }))?.image)
      .toEqual({ src: "/paper/gw3.webp", alt: "The rout" });
  });

  it("dedupes a power ranking's rows", () => {
    const survived = normalizeStory(
      story({
        kind: "season-rankings",
        extras: {
          ranks: [
            { teamId: "a", line: "Up." },
            { teamId: "a", line: "Down." },
          ],
        },
      }),
    );
    // One rank per team — a model listing a side twice is a retry, not a view.
    expect(survived?.extras?.ranks).toHaveLength(1);
  });

  it("keeps a rank's team and line, and nothing a writer added beside them", () => {
    const survived = normalizeStory(
      story({
        kind: "season-rankings",
        extras: { ranks: [{ teamId: "a", line: "Top." }, { teamId: "b", move: 1, line: "Second." } as never, { teamId: "", line: "Nobody." }] },
      }),
    );
    expect(survived?.extras?.ranks).toEqual([{ teamId: "a", line: "Top." }, { teamId: "b", line: "Second." }]);
  });

  it("keeps the editor's moves on the record, each with the place the code gave it", () => {
    const moved = { teamId: "c", place: 2, by: "Craig", on: "2026-10-05", said: "put him 2nd", from: 3 };
    const survived = normalizeStory(story({ kind: "season-rankings", extras: { moves: [moved, { teamId: "d", place: 1 } as typeof moved] } }));
    expect(survived?.extras?.moves).toEqual([moved]);
  });
});

describe("normalizePaper", () => {
  it("keeps only this league's stories", () => {
    // The rehearsal gate: CI files with its environment's league and the app
    // serves its own, and both number periods from the same Friday.
    const parsed = { updatedAt: "", stories: [story(), story({ slug: "other", leagueId: "ayyoh3n2mr326v2o" })] };
    expect(normalizePaper(parsed, LEAGUE).map((s) => s.slug)).toEqual(["gw3-report"]);
  });

  it("drops malformed stories without dropping the paper", () => {
    const parsed = { updatedAt: "", stories: [{ garbage: true }, story()] };
    expect(normalizePaper(parsed, LEAGUE)).toHaveLength(1);
  });

  it("lets a rewrite supersede its own draft on a repeated slug", () => {
    const parsed = {
      updatedAt: "",
      stories: [story({ headline: "The draft" }), story({ headline: "The rewrite" })],
    };
    const paper = normalizePaper(parsed, LEAGUE);
    expect(paper).toHaveLength(1);
    expect(paper[0].headline).toBe("The rewrite");
  });

  it("answers an unreadable file with an empty paper", () => {
    expect(normalizePaper(null, LEAGUE)).toEqual([]);
    expect(normalizePaper({ stories: "no" }, LEAGUE)).toEqual([]);
  });
});
