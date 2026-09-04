import Section from "../../components/shell/Section";
import type { PlayerStory } from "@epl/core";
import { LEAGUE_TIMEZONE } from "@epl/core";

// The latest thing Fantrax's provider has written about him — whole, with its
// analysis, and dated.
//
// **Not `getPlayerProfile`'s `latestNews`.** That is the same story truncated to
// one sentence with an ellipsis, beside "Analysis available to registered users".
// `getPlayerNews` hands over the full body and the full analysis for nothing, so
// this reads that instead. `playerNews.ts` records the probe.
//
// **The latest, and the heading says so.** Fantrax files one story per player, so
// there is no history here to offer and the screen does not pretend to one.
//
// Its `newsDate` is epoch milliseconds — the one date in this adapter that is a
// number rather than one of their unparseable strings — so unlike every other
// Fantrax timestamp in the app it CAN be shown in the league's own time.

const WHEN = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: LEAGUE_TIMEZONE,
});

export default function Story({ story }: { story: PlayerStory | null }) {
  if (story === null) return null;
  return (
    <Section title="Latest" aside="Fantrax's own">
      <p className="text-sm text-ink">{story.content}</p>
      {story.analysis === null ? null : (
        <p className="border-l-2 border-line pl-2 text-sm text-muted">{story.analysis}</p>
      )}
      {story.at === null ? null : (
        <p className="numeric text-2xs text-faint">{WHEN.format(new Date(story.at))}</p>
      )}
    </Section>
  );
}
