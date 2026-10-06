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

// The manager's news, the way Championship Manager files it.
//
// Craig, 5 Sep 2026, with the shot: *"Need to build league/team news for manager
// like CM."* `docs/ui/reference/craig/02-news.jpg` is the object and this is it,
// tab for tab: a dated list with a blue block down the left, the selected item
// on a red ground, its headline in yellow below the list, and the body under
// that.
//
// **Its own section, not a tab of the League** (Craig, the same day: *"Should
// [news] be its own section and not the league?"*). It was `/league/news` for an
// hour, and he is right on the game's own evidence: CM's rail entry for this
// screen is the MANAGER'S NAME, and its title bar reads `Mike Paul News` — the
// news belongs to the man, not to the competition. A section it is, and the
// title bar carries his team the way the game carries his name.
//
// **What that cost, because six sections is the measured ceiling.** `navfit`
// reads a seventh plate as 45px against a 53px label at 320. Players is what
// moved: the pool IS the Premier League's players, you reach it through the
// competition it belongs to, and that is the argument `shell/sections.ts`
// already makes about squads. It is now on both competitions' strips — the
// League's `Player Stats`, which it always was, and the Prem's — so it went from
// one way in to two.
//
// **Selection is a query string and not state**, which is the whole reason this
// stays a server component. `?item=` makes an item addressable — a headline you
// can send somebody — and it means the page does not ship a reducer to a phone
// to do what a link already does.
//
// **There is no filter strip** (Craig, 5 Sep 2026: *"ditch the blue row"*).
// `All · Messages · Competitions · Injuries and Bans` is CM's own and was drawn
// faithfully — four blue plates, two lines tall on a phone so "Injuries and Bans"
// could not clip. What it filtered was four items. The game's inbox runs a season
// of a hundred and gets its money back; ours runs a week of a league of ten, and
// a filter over four rows is chrome asking to be paid for what it saves.
//
// It comes back the day there is a list long enough to want it, and CM's four
// words are the ones it comes back as — `InboxCategory` still carries them and
// every item is still filed under one.


export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const [{ item }, inbox] = await Promise.all([searchParams, readInbox()]);

  // The letter the URL chose; a desk opens the newest without one, a phone shows the list.
  const chosen = inbox.items.find((entry) => entry.id === item) ?? null;
  const open = chosen ?? inbox.items[0] ?? null;
  // Whose inbox this is. `readInbox` already resolves both halves — the id off
  // the signed cookie and the name off `getLeagueInfo` — so this costs no read.
  const mine = inbox.mine === null ? null : (inbox.names.get(inbox.mine) ?? null);

  return (
    <div className="flex flex-col gap-2">
      {/* **The bar is the MANAGER's, and this screen is CM's one exception to
          the two-boxes rule** (Craig, 5 Sep 2026: "needs 'Draft team name news'
          not pro league"). `cm9900`'s own inbox heads the bar `Mike Paul News` —
          subject and view in one line, with no caption under it — and it is the
          single screen in the library that does.

          The app refused that exception earlier the same day, on the argument
          that a rule holding on nine screens and not the tenth is not a rule.
          The reference wins: the news IS the manager's, and a bar reading the
          competition made it look like the league's noticeboard rather than his
          post. So the caption goes with the change — "News" under a bar that
          already ends in the word is the two boxes saying one thing twice.

          A reader with no team keeps a bar and it says the plain word, which is
          also what the loading frame shows. */}
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

/** One line in the list: when, and what.
 *
 *  **The blue block carries the date**, which is what CM's carries here — the
 *  same block that holds a league position on a scoreline row. The wire's own
 *  minute left that block on 5 Sep 2026 for brackets after the player's name —
 *  so a scoreline row and this are the two the app has left. It is the row's "when", and an item with no date of its own falls
 *  back to its round (`core/inbox/types.ts` on why a doubt has neither).
 *
 *  **The open row is on a red ground and the URGENT one is in red ink**, which
 *  is the distinction the reference makes and a first build would flatten:
 *  `02-news.jpg` draws the selected row filled red AND has an unselected row
 *  that is merely important. Ours are two marks — a fill for "you are reading
 *  this", an ink for "this is bad news about you" — so an item can be both
 *  without either disappearing. */
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
