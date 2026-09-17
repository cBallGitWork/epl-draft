import { describe, expect, it } from "vitest";
import { composePaper } from "./frontPage";
import type { PublishedStory } from "./story";

const NOW = "2026-08-31T12:00:00.000Z";

// Its own factory rather than an import from story.test.ts: importing a test
// file registers that file's tests a second time inside this suite.
const story = (over: Partial<PublishedStory> = {}): PublishedStory => ({
  slug: "p3-report-a-v-b",
  kind: "tie-report",
  leagueId: "zbn1z3ukmsgb36sz",
  period: 3,
  gameweek: 3,
  filedAt: "2026-08-31T09:00:00.000Z",
  expiresAt: null,
  edition: "The Monday Club",
  byline: "The Back Page",
  headline: "Something clever",
  deck: "Something plain.",
  body: "A paragraph.",
  subjects: ["tie-report:p3:a-v-b"],
  image: null,
  face: null,
  ties: [],
  ...over,
});

describe("composePaper", () => {
  it("drops an expired story and keeps one with no expiry", () => {
    // A preview dies at its kickoff: printed after it, the paper forecasts a
    // match that is already being played.
    const paper = composePaper(
      [
        story({ slug: "dead", kind: "fixture-preview", expiresAt: "2026-08-31T11:00:00.000Z" }),
        story({ slug: "alive" }),
      ],
      NOW,
    );
    expect(paper.map((s) => s.slug)).toEqual(["alive"]);
  });

  it("keeps a story whose expiry cannot be read", () => {
    // "Cannot be shown to be expired" reads as "stays": refusal at this edge
    // costs a stale line, while a throw costs the paper.
    const paper = composePaper([story({ expiresAt: "not-a-date" })], NOW);
    expect(paper).toHaveLength(1);
  });

  it("lets a tie report retire its period's preview, calls and predictions", () => {
    const paper = composePaper(
      [
        story({ slug: "preview", kind: "round-preview", filedAt: "2026-08-28T18:00:00.000Z" }),
        story({ slug: "call", kind: "tie-call", filedAt: "2026-08-30T16:00:00.000Z" }),
        story({ slug: "lawro", kind: "predictions", filedAt: "2026-08-29T10:00:00.000Z" }),
        story({ slug: "report", kind: "tie-report", filedAt: "2026-08-31T09:00:00.000Z" }),
        story({ slug: "next-preview", kind: "round-preview", period: 4, gameweek: 4 }),
      ],
      NOW,
    );
    // The report is the round's last word — but only ITS round's: next week's
    // preview stands, or the paper would eat its own future.
    expect(paper.map((s) => s.slug)).toEqual(["next-preview", "report"]);
  });

  it("lets a fresher telling of the same subject replace the earlier one", () => {
    // The "Sunday's paper covers Sunday" mechanic: the second look at the same
    // match supersedes the first rather than stacking beside it.
    const paper = composePaper(
      [
        story({ slug: "first", kind: "match-report", subjects: ["match:gw3:3v7"], filedAt: "2026-08-30T21:00:00.000Z" }),
        story({ slug: "second", kind: "match-report", subjects: ["match:gw3:3v7"], filedAt: "2026-08-31T09:00:00.000Z" }),
        story({ slug: "unrelated", kind: "match-report", subjects: ["match:gw3:1v2"], filedAt: "2026-08-30T21:00:00.000Z" }),
      ],
      NOW,
    );
    expect(paper.map((s) => s.slug)).toEqual(["second", "unrelated"]);
  });

  it("leads with the newest period, then reporting over columns, then recency", () => {
    const paper = composePaper(
      [
        story({ slug: "old-report", kind: "tie-report", period: 2, gameweek: 2 }),
        story({ slug: "column", kind: "eleven", period: 3, filedAt: "2026-08-31T10:00:00.000Z" }),
        story({ slug: "match", kind: "match-report", period: 3, subjects: ["match:gw3:1v2"], filedAt: "2026-08-30T21:00:00.000Z" }),
        story({ slug: "later-match", kind: "match-report", period: 3, subjects: ["match:gw3:3v7"], filedAt: "2026-08-31T09:00:00.000Z" }),
      ],
      NOW,
    );
    // A paper that leads with last week is not a paper, whatever last week's
    // story weighed. Then TODAY'S paper, and within one day what happened
    // outranks what we think — so the 31st's report leads the 31st's column,
    // and both lead the 30th's report however heavy its kind.
    expect(paper.map((s) => s.slug)).toEqual(["later-match", "column", "match", "old-report"]);
  });

  it("puts a fresh column above a heavier story filed yesterday", () => {
    // The change of 17 Sep 2026, and the reason a reader noticed nothing when
    // the schedule landed without it: `eleven` is weight 40 against
    // `tie-report`'s 90, so Tuesday's column sorted below Sunday's report and
    // the reader opened Tuesday's paper to Sunday's splash.
    const paper = composePaper(
      [
        story({ slug: "sunday-report", kind: "tie-report", period: 3, filedAt: "2026-08-30T18:00:00.000Z" }),
        story({ slug: "tuesday-column", kind: "eleven", period: 3, filedAt: "2026-09-01T08:00:00.000Z" }),
      ],
      NOW,
    );
    expect(paper.map((s) => s.slug)).toEqual(["tuesday-column", "sunday-report"]);
  });

  it("reads the day in London, not UTC", () => {
    // 23:30 UTC on a summer Sunday is already Monday in London. A UTC day key
    // would file both of these on the 30th and fall back to kind weight, which
    // is the bug this comparator exists to avoid — and the same instant
    // `bylines.ts` stamps the edition name from.
    const paper = composePaper(
      [
        story({ slug: "sunday-report", kind: "tie-report", period: 3, filedAt: "2026-08-30T18:00:00.000Z" }),
        story({ slug: "monday-column", kind: "eleven", period: 3, filedAt: "2026-08-30T23:30:00.000Z" }),
      ],
      NOW,
    );
    expect(paper.map((s) => s.slug)).toEqual(["monday-column", "sunday-report"]);
  });
});
