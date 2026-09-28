import { type Assignment, type StoryThread, buildNewsBrief } from "@epl/core";
import type { DeskFacts } from "./facts";

// One wire item's brief, joined back to the story the newsdesk chose.

export function newsBrief(
  assignment: Assignment,
  facts: DeskFacts,
  threads: readonly StoryThread[],
): string | null {
  // The assignment's key is `news:{article url}` — the article itself, so a
  // story re-listed as it moves up the feed is never covered twice.
  const key = assignment.key.replace(/^news:/, "");
  const story = facts.news.find((each) => each.item.key === key);
  if (story === undefined) return null;

  return buildNewsBrief({ angle: story, threads });
}
