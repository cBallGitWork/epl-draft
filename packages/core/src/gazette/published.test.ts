import { describe, expect, it } from "vitest";
import { editionMatches, markPreview, normalizePublished } from "./published";
import type { PublishedEdition } from "./published";
import type { StoryResult } from "./types";

const edition = (over: Partial<PublishedEdition> = {}): PublishedEdition => ({
  kind: "report",
  period: 1,
  gameweek: 1,
  filedAt: "2026-08-26T09:00:00.000Z",
  byline: "The Desk",
  headline: "Something clever",
  deck: "Something plain.",
  intro: "A paragraph.",
  sections: [],
  ties: [],
  ...over,
});

const result = (winner: string, loser: string): StoryResult => ({
  winner: { teamId: winner, name: winner, points: 45 },
  loser: { teamId: loser, name: loser, points: 31 },
  margin: 14,
});

describe("editionMatches", () => {
  it("prints a column only for the round on screen", () => {
    // The newest edition on disk is last week's for most of every week. Printed
    // unchecked, the paper reports a round that finished eight days ago under
    // today's masthead.
    expect(editionMatches(edition({ period: 1 }), 1, "report")).toBe(true);
    expect(editionMatches(edition({ period: 1 }), 2, "report")).toBe(false);
  });

  it("will not print a preview as a report, or the other way round", () => {
    expect(editionMatches(edition({ kind: "preview" }), 1, "report")).toBe(false);
    expect(editionMatches(edition({ kind: "preview" }), 1, "preview")).toBe(true);
  });

  it("treats no edition and no round as ordinary", () => {
    expect(editionMatches(null, 1, "report")).toBe(false);
    expect(editionMatches(edition(), null, "report")).toBe(false);
  });
});

describe("normalizePublished", () => {
  it("keeps an edition a page can render", () => {
    const kept = normalizePublished(edition({ intro: "Two words." }));
    expect(kept?.intro).toBe("Two words.");
  });

  it("refuses anything that cannot be matched to a round or printed", () => {
    expect(normalizePublished(null)).toBeNull();
    expect(normalizePublished("a paper")).toBeNull();
    expect(normalizePublished({ ...edition(), kind: "column" })).toBeNull();
    expect(normalizePublished({ ...edition(), period: "one" })).toBeNull();
    expect(normalizePublished({ ...edition(), headline: "" })).toBeNull();
  });

  it("fills what it can and drops what it cannot, rather than throwing", () => {
    // This arrives as JSON from a model: the schema is a request, not a
    // guarantee, and a malformed section must cost the section and not the page.
    const messy = normalizePublished({
      ...edition(),
      deck: undefined,
      sections: [{ key: "verdict", heading: "The verdict", body: "Real." }, { key: "x" }, null],
      ties: [
        { homeTeamId: "a", awayTeamId: "b", line: "Real." },
        { homeTeamId: "a", line: "No away side." },
      ],
    });
    expect(messy?.deck).toBe("");
    expect(messy?.sections).toHaveLength(1);
    expect(messy?.ties).toHaveLength(1);
  });

  it("drops a section with a heading and nothing under it", () => {
    const empty = normalizePublished({
      ...edition(),
      sections: [{ key: "verdict", heading: "The verdict", body: "" }],
    });
    expect(empty?.sections).toEqual([]);
  });
});

describe("markPreview", () => {
  const preview = edition({
    kind: "preview",
    ties: [
      { homeTeamId: "a", awayTeamId: "b", line: "…", callsTeamId: "a" },
      { homeTeamId: "c", awayTeamId: "d", line: "…", callsTeamId: "c" },
    ],
  });

  it("marks the calls against what actually happened", () => {
    expect(markPreview(preview, [result("a", "b"), result("d", "c")])).toEqual({
      right: 1,
      called: 2,
    });
  });

  it("reads a tie from either side, because home and away mean nothing here", () => {
    expect(markPreview(preview, [result("b", "a")])).toEqual({ right: 0, called: 1 });
  });

  it("does not count a tie he declined to call", () => {
    // Silence is not a wrong answer — and counting it as one would make saying
    // nothing the cheapest way to look right.
    const quiet = edition({
      kind: "preview",
      ties: [{ homeTeamId: "a", awayTeamId: "b", line: "Too close.", callsTeamId: null }],
    });
    expect(markPreview(quiet, [result("a", "b")])).toBeNull();
  });

  it("does not count a tie that has not produced a result", () => {
    expect(markPreview(preview, [result("a", "b")])).toEqual({ right: 1, called: 1 });
  });

  it("marks nothing when there is no preview to mark", () => {
    expect(markPreview(null, [result("a", "b")])).toBeNull();
    expect(markPreview(edition({ kind: "report" }), [result("a", "b")])).toBeNull();
  });
});
