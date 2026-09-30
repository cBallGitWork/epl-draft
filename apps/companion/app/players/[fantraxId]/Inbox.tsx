import Link from "next/link";
import type { InboxItem } from "@epl/core";
import { DASH, londonDayAndDate, londonTime } from "@epl/core";
import DateChip from "../../components/shell/DateChip";
import Section from "../../components/shell/Section";
import Letter from "../../news/Letter";
import { PANEL_FLUSH, ROW_NAME } from "@/app/desk";
import { noteBody, type NewsItem } from "./newsItems";

// His news in Mail's shape (Craig, 25 Sep 2026: "should match the Email/news section"): the dated
// list beside the letter on a desk and above it on a phone, the open row on CM's red ground, and
// the story opened in Mail's own `Letter`.

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
        <p className="text-sm text-muted">Nothing has been written about him since 1 July.</p>
      </Section>
    );
  }

  const open = items.find((item) => item.id === openId) ?? items[0];

  return (
    <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:items-start lg:gap-3">
      <ul className={`${PANEL_FLUSH} cm-rows cm-scroll cm-scroll-y max-h-72 overflow-y-auto lg:max-h-[40rem]`}>
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
      <Letter item={letter(open)} />
    </div>
  );
}

/** A story as Mail's letter: Fantrax's desk sends it, the headline is the subject, and the body is
 *  whatever of the story the subject has not said, then the provider's analysis. */
function letter(item: NewsItem): InboxItem {
  const body = noteBody(item).join(" ");
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
