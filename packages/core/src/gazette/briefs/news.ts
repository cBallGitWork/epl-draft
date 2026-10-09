import type { NewsItem } from "../../news/map";
import type { StoryThread } from "../ledger";
import { storylinesBlock } from "./storylines";
import { briefOf } from "./briefOf";

// The one brief carrying copy somebody else wrote, quarantined in its own block; the story is the manager it hits.

/** One wire item, with the league's stake in it already worked out. */
interface NewsAngle {
  item: NewsItem;
  /** The men in our league the item is about, with their owners; an item with none is not filed. */
  affected: { playerName: string; ownerName: string }[];
}

export function buildNewsBrief(brief: {
  angle: NewsAngle;
  threads: readonly StoryThread[];
}): string {
  const { item, affected } = brief.angle;

  return briefOf([
    "A NEWS STORY, from the wire, with a draft angle.",
    [
      "EXTERNAL COPY — the BBC's, not ours. Real reporting by somebody else, handed to you ONLY so you know what happened. Distil it; never reproduce it, never quote it as though we obtained it, and never add a detail it does not contain:",
      `- Headline: ${item.title}`,
      item.summary === "" ? null : `- Summary: ${item.summary}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    [
      "OUR STAKE, and this is the story. The event is the Premier League's; the paper's angle is what it does to this league. Lead on the manager it hits, never on the club:",
      ...affected.map((man) => `- ${man.playerName}, owned by ${man.ownerName}`),
    ].join("\n"),
    "Two short paragraphs. If the wire copy does not actually say what it means for these players — and it usually will not — say what is known and stop. You do not know how long anybody is out for unless you were told.",
    storylinesBlock(brief.threads),
  ]);
}
