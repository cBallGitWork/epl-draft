import { describe, expect, it } from "vitest";
import type { PlayerStory } from "@epl/core";
import { firstStoryAfter } from "./matchdayLeague";

const story = (headline: string, at: string): PlayerStory => ({ id: headline, headline, content: "", analysis: null, at: Date.parse(at) });
const KICKOFF = "2026-09-26T14:00:00Z";
const stories = [story("before", "2026-09-26T09:00:00Z"), story("late", "2026-09-28T09:00:00Z"), story("first", "2026-09-26T18:00:00Z"), story("stale", "2026-10-05T09:00:00Z")];

describe("firstStoryAfter", () => {
  it("is the first story after the kickoff, within a few days of it", () => {
    expect(firstStoryAfter(stories, KICKOFF)).toBe("first");
    expect(firstStoryAfter([stories[0], stories[3]], KICKOFF)).toBeNull();
  });

  it("stops at a cut-off, so a report never reads what was published after it", () => {
    expect(firstStoryAfter(stories, KICKOFF, Date.parse("2026-09-26T17:00:00Z"))).toBeNull();
  });
});
