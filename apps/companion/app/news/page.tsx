import Link from "next/link";
import type { InboxItem } from "@epl/core";
import { fantraxTime } from "@epl/core";
import DateChip from "../components/shell/DateChip";
import Letter from "./Letter";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import { readInbox } from "./inbox";
import { londonDayAndDate, londonTime } from "../londonTime";
import { NEWS } from "../titles";
import { PANEL_FLUSH, ROW_NAME, SMALL_CAPS } from "@/app/desk";

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
        /* **The list beside the letter on a desk, and stacked under a thumb**
            (Craig, 17 Sep 2026: *"on desktop we barely use the space"*, and he is
            right — the whole screen was one column of 390px ideas at 1440, eight
            rows and a three-line letter, with five hundred pixels of the
            photograph under it).

            The reference stacks them, and that is a reading of `02-news.jpg`
            rather than of CM: the game ran at 800x600, where a list and a letter
            side by side would be two narrow columns. Ours has the width the
            reference never had, and an inbox is the one shape every mail client
            ever written puts in two columns for the same reason — you pick from
            the list and read without losing your place in it.

            `items-start` so the letter sits at the top of its column rather than
            stretching to the list's height, and the list keeps its own scroll. */
        <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:items-start lg:gap-3">
          {/* **Inside a panel, and it was not for an hour.** The list wore
              `LeagueShell`'s panel while this was a League tab; a section of its
              own has none, and the rows went straight onto the photograph — the
              one thing DESIGN §2 forbids and the only thing `groundfit`
              measures. `PANEL_FLUSH`, because the list manages its own spacing.

              The list itself: CM's is about eight rows deep with the reader's
              own scrollbar, and ours takes the same shape and the same bar,
              because a list cut at eight with no bar looks like a list with
              eight things in it (`desk.css` on `.cm-scroll`). It is DEEPER on a
              desk than on a phone now rather than shallower — `lg:max-h-64` was
              a phone's ceiling applied to a screen with three times the room,
              and Craig asked for more of it twice (17 Sep 2026: *"left list, use
              more space, and make that column just a little bigger"*). Hence the
              7:6 split as well: the list is the screen's subject and the letter
              is what one row of it says, so the list takes the larger half. */}
          <ul className={`${PANEL_FLUSH} cm-rows cm-scroll cm-scroll-y max-h-72 overflow-y-auto lg:max-h-[40rem]`}>
            {inbox.items.map((entry) => (
              <li key={entry.id}>
                <Row
                  item={entry}
                  open={entry.id === open?.id}
                  names={inbox.names}
                  mine={inbox.mine}
                />
              </li>
            ))}
          </ul>

          {open === null ? null : <Letter item={open} />}
        </div>
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
  // **"You" rather than your own team's name**, which is the row's half of
  // Craig's "make it clear its their team too": a column reading `TEST2` on one
  // row and `TEST3` on the next asks a manager to remember which of the two he
  // is, and the page title above already says. The opponent keeps his name,
  // because that is the fact being reported; the letter says why it is on the
  // screen at all.
  const who =
    item.teamId === null ? null : item.teamId === mine ? "You" : names.get(item.teamId);
  const when = itemDay(item);
  return (
    <Link
      href={`${HERE}?item=${encodeURIComponent(item.id)}`}
      aria-current={open ? "true" : undefined}
      className={`cm-row flex min-h-11 items-stretch gap-1.5 ${
        open ? "bg-league-deep" : "hover:bg-surface"
      }`}
    >
      {/* **`DateChip` at its own size, and no size override at all now** — which
          is the whole of Craig's *"side boxes (blue bar) harder to read"* and
          *"share the code"* (17 Sep 2026). This chip carried a `text-3xs`
          exception, documented at length as the mechanism working as designed;
          what it actually was is this list reading a date three steps smaller
          than the player inbox reads the same date, because this one had to
          swallow the day and the clock as one wrapping string in a 64px box.
          Handing the two lines over separately is what buys the size back. */}
      <DateChip day={when.day} time={when.time} className="w-[5.5rem] lg:w-28" />
      <span
        className={`flex min-w-0 flex-1 items-center truncate py-1 ${ROW_NAME} ${
          open ? "text-ink" : item.urgent ? "text-bad" : "text-ink"
        }`}
      >
        {item.headline}
      </span>
      {/* **The box that says OUT**, and it is `StateBox`'s object rather than a
          new one — filled for a man who is definitely not playing, outlined for
          one who might yet, which is DESIGN §2's rule that certain and uncertain
          are said in FILL rather than in a second hue. The word is the football
          layer's, so the row says WHY in four characters.

          The class string is duplicated from `StateBox` on CODE_RULES §1: two
          occurrences are a coincidence, and it is named in `desk.ts` at the
          third. `StateBox` itself takes a `FootballPlayer` and this row holds an
          item, so sharing it would mean an options bag with one caller each. */}
      {item.mark === null ? null : (
        <span
          className={`numeric shrink-0 self-center px-1 text-3xs font-bold uppercase leading-[1.5] ${
            item.mark.out ? "cm-state" : "cm-state-doubt"
          }`}
        >
          {item.mark.label}
        </span>
      )}
      {/* **The open row's ground decides this ink**, which the first build let
          the quiet slot decide instead: `--color-muted` is 3.79:1 on
          `--color-league-deep` and `sweep` caught it at both widths. The red
          ground is a plate in every sense DESIGN §2 means, so the row owns its
          ink and the manager's name goes to full strength on it — the quiet is
          for telling a name apart from a headline, and on the one row you are
          reading there is nothing to tell it apart from. */}
      {who === null ? null : (
        <span
          className={`flex shrink-0 items-center pr-1.5 ${SMALL_CAPS} ${
            open ? "text-ink" : "text-muted"
          }`}
        >
          {who}
        </span>
      )}
    </Link>
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
 *  requires one — and the deadline is a real instant.
 *
 *  **A doubt has one too, and this docblock was the last place saying it did
 *  not.** It read that "every doubt is `at: null` … because FPL publishes no
 *  'as of' for a doubt" — the claim `doubts.ts` and PLATFORM_NOTES now record as
 *  false (`news_added`, 198/198). It was written down in three files and
 *  corrected in two; this was the third, left standing above code that already
 *  did the opposite.
 *
 *  What is genuinely undated is the round's own RESULT — a standing fact about a
 *  finished tie — and a doubt FPL published no stamp for. Both fall back to the
 *  round, which is what the first branch is for. */
function itemDay(item: InboxItem): { day: string; time: string | null } {
  if (item.at === null) {
    return { day: item.gameweek === null ? "" : `GW${item.gameweek}`, time: null };
  }
  if ("iso" in item.at) {
    return { day: londonDayAndDate(item.at.iso), time: londonTime(item.at.iso) };
  }
  const stamp = fantraxTime(item.at.fantrax);
  if (stamp === null) return { day: "", time: null };
  // **Their clock is the last token by construction**, not by luck: `fantraxTime`
  // builds `"{weekday} {day} {month} {h}:{mm}{am|pm}"` and every part before the
  // hour carries a space of its own. Split there rather than re-deriving the
  // parts here — `fantraxParts` is private to `when.ts` and a second parser for
  // one caller is the rule of 2/3 answered at one.
  const at = stamp.lastIndexOf(" ");
  return at === -1 ? { day: stamp, time: null } : { day: stamp.slice(0, at), time: stamp.slice(at + 1) };
}
