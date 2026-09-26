import Link from "next/link";
import type { InboxItem } from "@epl/core";
import { DASH, londonDayAndDate, londonTime } from "@epl/core";
import DateChip from "../../components/shell/DateChip";
import Section from "../../components/shell/Section";
import Letter from "../../news/Letter";
import { PANEL_FLUSH, ROW_NAME } from "@/app/desk";
import type { NewsItem } from "./newsItems";

// His news in Mail's shape (Craig, 25 Sep 2026: "should match the Email/news section"): the dated
// list beside the letter on a desk and above it on a phone, the open row on CM's red ground, and
// the story opened in Mail's own `Letter`.

/** What his news says when there is none: the stories run from 1 July. */
export const NO_NEWS = "Nothing has been written about him since 1 July.";

export default function Inbox({
  items,
  href,
  openId,
}: {
  items: readonly NewsItem[];
  /** Where a row points, given its id. */
  href: (id: string) => string;
  /** Which story is open, from the URL; the newest when none is. */
  openId?: string;
}) {
  if (items.length === 0) {
    return (
      <Section title="News" aside="Fantrax's own">
        <p className="text-sm text-muted">{NO_NEWS}</p>
      </Section>
    );
  }

  const open = items.find((item) => item.id === openId) ?? items[0];

  return (
    <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:items-start lg:gap-3">
      <StoryList
        items={items}
        href={href}
        open={open}
        className={`${PANEL_FLUSH} cm-scroll cm-scroll-y max-h-72 overflow-y-auto lg:max-h-[40rem]`}
      />
      <Letter item={letter(open)} />
    </div>
  );
}

/** The dated rows, newest first: the News tab's list, and the profile's latest few. */
export function StoryList({
  items,
  href,
  open,
  className = "",
}: {
  items: readonly NewsItem[];
  href: (id: string) => string;
  /** The row on CM's red ground, or none. */
  open?: NewsItem;
  className?: string;
}) {
  return (
    <ul className={`cm-rows ${className}`}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={href(item.id)}
            aria-current={item === open ? "true" : undefined}
            className={`cm-row flex min-h-11 items-stretch gap-1.5 ${item === open ? "bg-league-deep" : "hover:bg-surface"}`}
          >
            <DateChip
              day={item.at === null ? DASH : londonDayAndDate(new Date(item.at).toISOString())}
              time={item.at === null ? null : londonTime(new Date(item.at).toISOString())}
              className="w-[5.5rem] lg:w-28"
            />
            <span className={`flex min-w-0 flex-1 items-center py-1 pr-1.5 ${ROW_NAME} text-ink`}>
              <span className="line-clamp-2">{item.headline}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A story as Mail's letter: Fantrax's desk sends it, the headline is the subject, and the body is
 *  whatever of the story the subject has not said, then the provider's analysis. */
function letter(item: NewsItem): InboxItem {
  const rest = item.body.startsWith(item.headline) ? item.body.slice(item.headline.length).trim() : item.body;
  const body = [rest, item.analysis]
    .filter((part): part is string => part !== null && part.trim() !== "")
    .join(" ");
  return {
    id: item.id,
    category: "message",
    at: item.at === null ? null : { iso: new Date(item.at).toISOString() },
    gameweek: null,
    headline: item.headline,
    body,
    from: "Fantrax's news desk",
    about: null,
    teamId: null,
    mark: null,
    urgent: false,
  };
}
