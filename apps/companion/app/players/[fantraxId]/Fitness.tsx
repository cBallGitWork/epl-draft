import type { FootballPlayer } from "@epl/core";
import { availabilityOf, londonMoment } from "@epl/core";
import Section from "../../components/shell/Section";
import { fitnessNote } from "./condition";
import { latestNews } from "./latestNews";
import { filedAt, storyText, type NewsItem } from "./newsItems";

// Whether he may miss out and the newest thing written about him, as plain text (Craig, 1 Oct 2026); the rest is on News.

/** Prose a step above a row's name, so a paragraph reads at arm's length. */
const PROSE = "text-base leading-relaxed text-ink lg:text-lg";

export default async function Fitness({ fantraxId, player }: { fantraxId: string; player: FootballPlayer | null }) {
  const story = await latestNews(fantraxId);
  const note = player === null ? null : fitnessNote(availabilityOf(player));
  if (note === null && story === null) return null;

  return (
    <Section title={[note && "Fitness", story && "News"].filter(Boolean).join(" and ")}>
      {note === null ? null : <p className={PROSE}>{note}</p>}
      {story === null ? null : <Story story={story} />}
    </Section>
  );
}

/** Fantrax's newest note on him: when it was filed, then all of it. */
function Story({ story }: { story: NewsItem }) {
  const iso = filedAt(story);
  return (
    <div className="flex flex-col gap-1.5">
      {iso === null ? null : (
        <time dateTime={iso} className="text-sm text-muted lg:text-base">
          {londonMoment(iso)}
        </time>
      )}
      {storyText(story).map((paragraph) => (
        <p key={paragraph} className={PROSE}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
