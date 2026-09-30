import type { FootballPlayer } from "@epl/core";
import { availabilityOf, londonDayAndDate, londonTime, DASH } from "@epl/core";
import Section from "../../components/shell/Section";
import StateBox from "../../components/football/StateBox";
import { doubtRow } from "../../components/football/doubtRow";
import MailRow from "../../news/MailRow";
import { playerHref } from "../routes";
import { condition } from "./condition";
import { latestNews } from "./latestNews";
import { noteBody, type NewsItem } from "./newsItems";

// Whether he can play and the newest thing written about him (Craig, 26 Sep 2026); the rest is on News.

export default async function Fitness({ fantraxId, player }: { fantraxId: string; player: FootballPlayer | null }) {
  const story = await latestNews(fantraxId);
  if (player === null && story === null) return null;

  return (
    <Section title={[player && "Fitness", story && "News"].filter(Boolean).join(" and ")}>
      {player === null ? null : <ConditionRow player={player} />}
      {story === null ? null : <Story story={story} href={`${playerHref(fantraxId)}/news?story=${encodeURIComponent(story.id)}`} />}
    </Section>
  );
}

/** FPL's note beside his chance, once: "Ankle injury … DBT 75%", or "Fit … 100%". */
function ConditionRow({ player }: { player: FootballPlayer }) {
  const { said, chance } = condition(availabilityOf(player));

  return (
    <div className={`flex min-h-7 items-baseline justify-between gap-2 border-b border-bg px-1 py-0.5 ${doubtRow(player)}`}>
      <span className="text-sm text-ink lg:text-base">{said}</span>
      <span className="flex shrink-0 items-center gap-2">
        <StateBox player={player} />
        <span className="numeric text-sm font-bold text-mid lg:text-base" title="FPL's chance of him playing the next gameweek">
          {chance}
        </span>
      </span>
    </div>
  );
}

/** Fantrax's newest note on him: Mail's row, opening it on his News tab, then the rest of it. */
function Story({ story, href }: { story: NewsItem; href: string }) {
  const iso = story.at === null ? null : new Date(story.at).toISOString();
  return (
    <div className="flex flex-col gap-1.5">
      <ul className="cm-rows">
        <li>
          <MailRow
            href={href}
            open={false}
            day={iso === null ? DASH : londonDayAndDate(iso)}
            time={iso === null ? null : londonTime(iso)}
            headline={story.headline}
          />
        </li>
      </ul>
      {noteBody(story).map((paragraph) => (
        <p key={paragraph} className="text-sm leading-snug text-ink">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
