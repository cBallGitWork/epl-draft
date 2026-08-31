import type { NewsItem } from "../../news/map";
import type { StoryThread } from "../ledger";
import { storylinesBlock } from "./storylines";

// The one brief that carries copy somebody else wrote.
//
// **External copy is quarantined, and the block says so in the block.** Every
// other brief in this directory hands the writer facts we read from an API and
// stand behind. This one hands him a stranger's headline, and the difference
// has to be stated where he meets it — otherwise a wire summary gets rewritten
// as though the paper reported it, which is both a lie and a plagiarism.
//
// The story is never the news. A sacking or an injury is a Premier League
// event; what makes it OUR story is the manager whose squad it just wrecked.

/** One wire item, with the league's stake in it already worked out. */
export interface NewsAngle {
  item: NewsItem;
  /** The men in our league the item is about, with their owners. Empty means
   *  nobody holds anybody involved — which is why such items are not filed. */
  affected: { playerName: string; ownerName: string }[];
}

export function buildNewsBrief(brief: {
  angle: NewsAngle;
  threads: readonly StoryThread[];
}): string {
  const { item, affected } = brief.angle;

  return [
    "A NEWS STORY, from the wire, with a draft angle.",
    [
      "EXTERNAL COPY — the BBC's, not ours. Real reporting by somebody else, handed to you ONLY so you know what happened. Distil it; never reproduce it, never quote it as though we obtained it, and never add a detail it does not contain:",
      `- Headline: ${item.title}`,
      item.summary === "" ? null : `- Summary: ${item.summary}`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    [
      "OUR STAKE, and this is the story. The event is the Premier League's; the paper's angle is what it does to the sixteen. Lead on the manager it hits, never on the club:",
      ...affected.map((man) => `- ${man.playerName}, owned by ${man.ownerName}`),
    ].join("\n"),
    "Two short paragraphs. If the wire copy does not actually say what it means for these players — and it usually will not — say what is known and stop. You do not know how long anybody is out for unless you were told.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
