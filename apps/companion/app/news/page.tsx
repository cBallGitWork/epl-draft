import type { InboxItem } from "@epl/core";
import { FANTRAX_LEAGUE_PAGE, FANTRAX_PENDING_PATH, londonDayAndDate, londonTime } from "@epl/core";
import Letter from "./Letter";
import MailRow from "./MailRow";
import Mailbox from "./Mailbox";
import { doubtWash } from "../components/football/doubtRow";
import Nothing from "../components/shell/Nothing";
import OutLink from "../components/shell/OutLink";
import { BUTTON } from "../components/shell/ButtonLink";
import PageHeader from "../components/shell/PageHeader";
import { readInbox } from "./inbox";
import { ownerTag } from "./owner";
import { NEWS } from "../titles";
import { MAIL } from "../components/shell/sections";
import { SMALL_CAPS, MINOR_CAPS } from "@/app/desk";

// The manager's inbox, as CM files it (`docs/ui/reference/craig/02-news.jpg`): a dated list, the open letter beside it.
// `?item=` picks the letter, so a headline is a link and the page stays a server component.

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const [{ item }, inbox] = await Promise.all([searchParams, readInbox()]);

  // The letter the URL chose; a desk opens the newest without one, a phone shows the list.
  const chosen = inbox.items.find((entry) => entry.id === item) ?? null;
  const open = chosen ?? inbox.items[0] ?? null;
  // Whose inbox this is, by name.
  const mine = inbox.mine === null ? null : (inbox.names.get(inbox.mine) ?? null);

  return (
    <div className="flex flex-col gap-2">
      {/* The bar is the manager's ("123 News"), with no caption: DESIGN §2's one exception. */}
      <PageHeader title={mine === null ? NEWS : `${mine} ${NEWS}`} />

      {/* Fantrax shows a manager's pending claims and trades only to his own session (PLATFORM_NOTES, 1 Oct 2026). */}
      <OutLink
        href={`${FANTRAX_LEAGUE_PAGE}/${FANTRAX_PENDING_PATH}`}
        className={`${BUTTON} lg:self-start ${chosen === null ? "" : "max-lg:hidden"}`}
      >
        Pending claims and trades on Fantrax
      </OutLink>

      {inbox.items.length === 0 ? (
        <section className="cm-panel p-3">
          <Nothing title="Nothing filed" code="0 items">
            The club has been told nothing yet — no business, no doubts, and no round to report.
          </Nothing>
        </section>
      ) : (
        <Mailbox
          letter={open === null ? null : <Letter item={open} />}
          back={chosen === null ? null : { href: MAIL, label: "All mail" }}
        >
          {inbox.items.map((entry) => (
            <li key={entry.id}>
              <Row item={entry} open={entry.id === open?.id} names={inbox.names} mine={inbox.mine} />
            </li>
          ))}
        </Mailbox>
      )}
    </div>
  );
}

/** One line in the list: the date in the blue block, a red ground when open, red ink when urgent. */
function Row({
  item,
  open,
  names,
  mine,
}: {
  item: InboxItem;
  open: boolean;
  names: Map<string, string>;
  mine: string | null;
}) {
  const who = ownerTag(item.teamId, mine, names);
  const when = itemDay(item);
  return (
    <MailRow
      href={`${MAIL}?item=${encodeURIComponent(item.id)}`}
      open={open}
      day={when.day}
      time={when.time}
      headline={item.headline}
      wash={doubtWash(item.mark?.band ?? null)}
      ink={open || item.mark?.band ? "text-ink" : item.urgent ? "text-bad" : "text-ink"}
    >
      {/* The box that says OUT: filled when he will not play, outlined when he might (DESIGN §2). */}
      {item.mark === null ? null : (
        <span
          className={`numeric shrink-0 self-center px-1 ${MINOR_CAPS} leading-[1.5] ${
            item.mark.out ? "cm-state" : "cm-state-doubt"
          }`}
        >
          {item.mark.label}
        </span>
      )}
      {/* The open row's red ground decides this ink: `muted` is 3.79:1 on it. */}
      {who === null ? null : (
        <span className={`flex shrink-0 items-center pr-1.5 ${SMALL_CAPS} ${open ? "text-ink" : "text-muted"}`}>
          {who}
        </span>
      )}
    </MailRow>
  );
}

/** What the blue block says: the London day and clock it happened, or the round it belongs to. */
function itemDay(item: InboxItem): { day: string; time: string | null } {
  if (item.at === null) {
    return { day: item.gameweek === null ? "" : `GW${item.gameweek}`, time: null };
  }
  return { day: londonDayAndDate(item.at), time: londonTime(item.at) };
}
