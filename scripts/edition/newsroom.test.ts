import { describe, expect, it } from "vitest";
import { storyOfColumn, type ColumnMeta } from "./newsroom";

const meta: ColumnMeta = {
  slug: "gw3-power-ranking",
  kind: "power-ranking",
  leagueId: "zbn1z3ukmsgb36sz",
  period: 3,
  gameweek: 3,
  filedAt: "2026-08-31T09:00:00.000Z",
  expiresAt: null,
  edition: "The Monday Club",
  byline: "The Pecking Order",
  subject: "power-ranking:gw3",
};

describe("storyOfColumn", () => {
  it("folds the model's top-level cargo into extras", () => {
    // The prompts ask for `ranks`/`quotes`/`captions`/`quiz` at the top level,
    // which is the shape a model reliably returns; the story keeps them under
    // `extras`. Without the fold the page renders nothing of it and says
    // nothing about why — every reader of `extras` treats absence as ordinary.
    const { story } = storyOfColumn(
      {
        headline: "Top Two Are Fooling Nobody",
        deck: "The table is closer than it looks.",
        body: "A paragraph.",
        ranks: [{ teamId: "t1", move: 2, line: "Third on paper, first on anything that matters." }],
      },
      meta,
    );
    expect(story.extras?.ranks).toEqual([
      { teamId: "t1", move: 2, line: "Third on paper, first on anything that matters." },
    ]);
  });

  it("keeps the calls a predictions column makes", () => {
    const { story } = storyOfColumn(
      {
        headline: "H",
        deck: "D",
        body: "B",
        ties: [{ homeTeamId: "a", awayTeamId: "b", line: "Tight.", callsTeamId: "a" }],
      },
      { ...meta, kind: "predictions", slug: "gw3-predictions" },
    );
    expect(story.ties).toHaveLength(1);
    expect(story.ties?.[0].callsTeamId).toBe("a");
  });

  it("carries no extras when the column filed none", () => {
    const { story } = storyOfColumn({ headline: "H", deck: "D", body: "B" }, meta);
    expect(story.extras).toBeUndefined();
  });

  it("takes at most three thread beats, and refuses malformed ones", () => {
    const { threads } = storyOfColumn(
      {
        headline: "H",
        deck: "D",
        body: "B",
        threads: [
          { subject: "a", beat: "one" },
          { subject: "b", beat: "two", status: "retired" },
          { subject: "", beat: "no subject" },
          { subject: "d", beat: "four" },
          { subject: "e", beat: "five" },
        ],
      },
      meta,
    );
    expect(threads.map((t) => t.subject)).toEqual(["a", "b", "d"]);
  });
});
