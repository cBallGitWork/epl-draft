import { describe, expect, it } from "vitest";
import { editionMatches, markPreview, normalizePublished } from "./published";
import type { PublishedEdition } from "./published";
import type { StoryResult } from "./types";

const edition = (over: Partial<PublishedEdition> = {}): PublishedEdition => ({
  kind: "report",
  leagueId: "zbn1z3ukmsgb36sz",
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
    expect(editionMatches(edition({ period: 1 }), 1, "report", "zbn1z3ukmsgb36sz")).toBe(true);
    expect(editionMatches(edition({ period: 1 }), 2, "report", "zbn1z3ukmsgb36sz")).toBe(false);
  });

  // The 10 Oct swap in miniature. Both leagues number their periods from the same
  // Friday — verified byte-identical in today's captures — so period and kind
  // alone match an edition written about the rehearsal league to the real
  // league's front page, and print a column naming test2 and test3 to sixteen
  // people. CI writes the column with whatever `FANTRAX_LEAGUE_ID` it inherits;
  // the page must not take one on trust.
  it("refuses a column written about another league", () => {
    const rehearsal = edition({ leagueId: "zbn1z3ukmsgb36sz" });
    expect(editionMatches(rehearsal, 1, "report", "zbn1z3ukmsgb36sz")).toBe(true);
    expect(editionMatches(rehearsal, 1, "report", "ayyoh3n2mr326v2o")).toBe(false);
  });

  it("will not print a preview as a report, or the other way round", () => {
    expect(editionMatches(edition({ kind: "preview" }), 1, "report", "zbn1z3ukmsgb36sz")).toBe(false);
    expect(editionMatches(edition({ kind: "preview" }), 1, "preview", "zbn1z3ukmsgb36sz")).toBe(true);
  });

  it("treats no edition and no round as ordinary", () => {
    expect(editionMatches(null, 1, "report", "zbn1z3ukmsgb36sz")).toBe(false);
    expect(editionMatches(edition(), null, "report", "zbn1z3ukmsgb36sz")).toBe(false);
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

  it("keeps one of a repeated section or tie, because the page keys on both", () => {
    // The writer is told which keys to use and is a model. Two sections keyed
    // `verdict` collide on the page; a retry is not a sequel, so the first wins.
    const twice = normalizePublished({
      ...edition(),
      sections: [
        { key: "verdict", heading: "The verdict", body: "First." },
        { key: "verdict", heading: "The verdict", body: "Again." },
      ],
      ties: [
        { homeTeamId: "a", awayTeamId: "b", line: "First." },
        { homeTeamId: "a", awayTeamId: "b", line: "Again." },
      ],
    });
    expect(twice?.sections).toHaveLength(1);
    expect(twice?.sections[0]?.body).toBe("First.");
    expect(twice?.ties).toHaveLength(1);
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
