import type { FootballSnapshot, PublishedStory } from "@epl/core";
import BinXi from "./BinXi";
import Quiz from "./Quiz";
import DraftReport from "./DraftReport";
import Reports from "./Reports";
import Ranks from "./Ranks";
import Lineups from "./Lineups";
import Sheets from "./Sheets";
import TeamNews from "./TeamNews";

// What a column filed BESIDE its prose, by kind.
//
// Lifted out of `Teaser` when the article page arrived: the same switch now has
// two parents, which is a relocation rather than a new abstraction. A kind that
// carries none of it renders none of it — every one of these returns null on an
// empty list, so a story is never followed by an empty heading.

export default function Extras({
  story,
  named,
  mine,
  snapshot = null,
}: {
  story: PublishedStory;
  named: (teamId: string) => string;
  mine: string | null;
  /** The football the team sheets' pitches stand on. */
  snapshot?: FootballSnapshot | null;
}) {
  if (story.kind === "power-ranking") return <Ranks story={story} named={named} mine={mine} />;
  if (story.kind === "wire") return <Quiz story={story} />;
  if (story.kind === "presser") return <TeamNews story={story} />;
  if (story.kind === "predicted-xi") return <Lineups story={story} named={named} mine={mine} />;
  if (story.kind === "sheets") return <Sheets story={story} named={named} mine={mine} snapshot={snapshot} />;
  if (story.kind === "match-report") return <Reports story={story} snapshot={snapshot} />;
  if (story.kind === "bin-xi") return <BinXi story={story} snapshot={snapshot} />;
  if (story.kind === "draft-report") return <DraftReport story={story} snapshot={snapshot} />;
  return null;
}
