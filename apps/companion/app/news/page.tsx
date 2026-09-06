import Link from "next/link";
import type { InboxItem } from "@epl/core";
import { fantraxMoment, fantraxTime } from "@epl/core";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import { readInbox } from "./inbox";
import { londonDayAndDate, londonTime } from "../londonTime";
import { NEWS } from "../titles";
import { PANEL_FLUSH, QUIET_FIGURE, ROW_NAME, SMALL_CAPS } from "@/app/desk";

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

const HERE = "/news";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const [{ item }, inbox] = await Promise.all([searchParams, readInbox()]);

  // The one being read: what the URL asked for, or the top of the list. CM opens
  // on the newest and so does this — an inbox with nothing selected is a list
  // with a blank half under it.
  const open = inbox.items.find((entry) => entry.id === item) ?? inbox.items[0] ?? null;
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

      {inbox.items.length === 0 ? (
        <section className="cm-panel p-3">
          <Nothing title="Nothing filed" code="0 items">
            The club has been told nothing yet — no business, no doubts, and no round to report.
          </Nothing>
        </section>
      ) : (
        <>
          {/* **Inside a panel, and it was not for an hour.** The list wore
              `LeagueShell`'s panel while this was a League tab; a section of its
              own has none, and the rows went straight onto the photograph — the
              one thing DESIGN §2 forbids and the only thing `groundfit`
              measures. `PANEL_FLUSH`, because the list manages its own spacing.

              The list itself: CM's is about eight rows deep with the reader's
              own scrollbar, and ours takes the same shape and the same bar,
              because a list cut at eight with no bar looks like a list with
              eight things in it (`desk.css` on `.cm-scroll`). */}
          <ul className={`${PANEL_FLUSH} cm-rows cm-scroll cm-scroll-y max-h-72 overflow-y-auto lg:max-h-64`}>
            {inbox.items.map((entry) => (
              <li key={entry.id}>
                <Row item={entry} open={entry.id === open?.id} names={inbox.names} />
              </li>
            ))}
          </ul>

          {open === null ? null : <Read item={open} />}
        </>
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
}: {
  item: InboxItem;
  open: boolean;
  names: Map<string, string>;
}) {
  const who = item.teamId === null ? null : names.get(item.teamId);
  return (
    <Link
      href={`${HERE}?item=${encodeURIComponent(item.id)}`}
      aria-current={open ? "true" : undefined}
      className={`cm-row flex min-h-11 items-stretch gap-2 ${
        open ? "bg-league-deep" : "hover:bg-surface"
      }`}
    >
      <span className="cm-index numeric flex w-16 shrink-0 items-center justify-center px-1 text-center text-3xs font-bold leading-tight lg:w-24">
        {itemDay(item)}
      </span>
      <span
        className={`flex min-w-0 flex-1 items-center truncate py-1 ${ROW_NAME} ${
          open ? "text-ink" : item.urgent ? "text-bad" : "text-ink"
        }`}
      >
        {item.headline}
      </span>
      {/* **The open row's ground decides this ink**, which the first build let
          the quiet slot decide instead: `--color-muted` is 3.79:1 on
          `--color-league-deep` and `sweep` caught it at both widths. The red
          ground is a plate in every sense DESIGN §2 means, so the row owns its
          ink and the manager's name goes to full strength on it — the quiet is
          for telling a name apart from a headline, and on the one row you are
          reading there is nothing to tell it apart from. */}
      {who === null ? null : (
        <span
          className={`flex shrink-0 items-center pr-2 ${SMALL_CAPS} ${
            open ? "text-ink" : "text-muted"
          }`}
        >
          {who}
        </span>
      )}
    </Link>
  );
}

/** The item you are reading: its headline in CM's yellow, and the body under it.
 *
 *  Inside a panel, which is where `cm9900/24.jpg` puts a yellow caption and
 *  where DESIGN §2 requires anything printed at all — the reference's own news
 *  screen sets both straight on the photograph, and that is the one thing in the
 *  shot we do not copy. */
function Read({ item }: { item: InboxItem }) {
  return (
    <article className="cm-panel flex flex-col gap-2 p-3 lg:p-4">
      <h2 className="cm-title text-center font-chrome text-base font-bold text-accent lg:text-2xl">
        {item.headline}
      </h2>
      <p className="text-sm text-ink lg:text-base">{item.body}</p>
      {/* **A quiet figure, not a column head.** `HEAD_PLATE` is a bevelled plate
          for the head of a stats board, and this is a date under a paragraph —
          the plate said "sort by me" about a line nothing can be sorted by. It is
          the last thing on the item and the first thing a reader skips, which is
          what `QUIET_FIGURE` is the recipe for. */}
      {itemMoment(item) === null ? null : (
        <p className={`${QUIET_FIGURE} self-start`}>{itemMoment(item)}</p>
      )}
    </article>
  );
}

/** What the blue block says: the day it happened, or the round it belongs to.
 *
 *  **Two vocabularies, and the tag on `at` is what tells them apart.** Ours is an
 *  instant and is formatted in London like every other time this app prints;
 *  Fantrax's is a stamp in their own zone and is RE-SPELLED — `Sep 2` into
 *  `2 Sep` — because converting it is how a transaction moves a day. The block
 *  drew their US string verbatim beside our `Sat 12 Sept` until 5 Sep 2026, and
 *  the item with neither falls back to its round.
 *
 *  **And it carries the CLOCK** (Craig, 5 Sep 2026: "the blue row tab should
 *  include the time too, we have it"). He is right that we have it: every deal
 *  carries Fantrax's hour and minute by construction — `fantraxParts`' regex
 *  requires one — and the deadline is a real instant. What has no clock is a
 *  standing state: the round's own result and every doubt are `at: null` with a
 *  gameweek, because FPL publishes no "as of" for a doubt and dating it to the
 *  moment we read it would invent a fact. Those two still show `GW3`, which is
 *  the honest answer and the reason this function has three branches. */
function itemDay(item: InboxItem): string {
  if (item.at === null) return item.gameweek === null ? "" : `GW${item.gameweek}`;
  if ("iso" in item.at) return `${londonDayAndDate(item.at.iso)} ${londonTime(item.at.iso)}`;
  return fantraxTime(item.at.fantrax) ?? "";
}

/** The same date with its clock, for the item being read. Fantrax's carries the
 *  zone on its face (`Wed 2 Sep, 6:11 AM ET`) because we did not convert it. */
function itemMoment(item: InboxItem): string | null {
  if (item.at === null) return null;
  if ("iso" in item.at) return `${londonDayAndDate(item.at.iso)}, ${londonTime(item.at.iso)}`;
  return fantraxMoment(item.at.fantrax);
}
