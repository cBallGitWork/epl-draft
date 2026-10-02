import type { InboxItem } from "@epl/core";
import { DASH, londonDayAndDate, londonTime } from "@epl/core";
import Nothing from "../../components/shell/Nothing";
import Letter from "../../news/Letter";
import MailRow from "../../news/MailRow";
import Mailbox from "../../news/Mailbox";
import { filedAt, noteBody, type NewsItem } from "./newsItems";

// His news in Mail's own frame, rows and letter (Craig, 25 Sep 2026: "should match the Email/news section").

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
      <section className="cm-panel p-3">
        <Nothing title="Nothing filed">Nothing has been written about him since 1 July.</Nothing>
      </section>
    );
  }

  const open = items.find((item) => item.id === openId) ?? items[0];

  return (
    <Mailbox letter={<Letter item={letter(open)} />}>
      {items.map((item) => {
        const iso = filedAt(item);
        return (
          <li key={item.id}>
            <MailRow
              href={href(item.id)}
              open={item === open}
              day={iso === null ? DASH : londonDayAndDate(iso)}
              time={iso === null ? null : londonTime(iso)}
              headline={item.headline}
            />
          </li>
        );
      })}
    </Mailbox>
  );
}

/** A story as Mail's letter: Fantrax's desk sends it, the headline is the subject, and the body is
 *  whatever of the story the subject has not said, then the provider's analysis. */
function letter(item: NewsItem): InboxItem {
  return {
    id: item.id,
    category: "message",
    at: filedAt(item),
    gameweek: null,
    headline: item.headline,
    body: noteBody(item).join(" "),
    from: "Fantrax's news desk",
    about: null,
    teamId: null,
    mark: null,
    urgent: false,
  };
}
