import Link from "next/link";
import type { InboxCategory, InboxItem } from "@epl/core";
import { LEAGUE_NAME } from "@epl/core";
import Caption from "../components/shell/Caption";
import Nothing from "../components/shell/Nothing";
import PageHeader from "../components/shell/PageHeader";
import { readInbox } from "./inbox";
import { londonDayAndDate } from "../londonTime";
import { NEWS } from "../titles";
import { HEAD_PLATE, PANEL_FLUSH, ROW_NAME, SMALL_CAPS } from "@/app/desk";

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
// **What the tabs are is CM's, not ours.** `All · Messages · Competitions ·
// Injuries and Bans` are the game's four words and they are already right:
// business is a message, a round is a competition, and a doubtful player is an
// injury or a ban. See `core/inbox/types.ts`.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** CM's own four, in CM's own order. `all` is the absence of a filter rather
 *  than a category, which is why it is not on `InboxCategory`. */
const TABS: readonly { key: string; label: string; of: InboxCategory | null }[] = [
  { key: "all", label: "All", of: null },
  { key: "messages", label: "Messages", of: "message" },
  { key: "competitions", label: "Competitions", of: "competition" },
  { key: "injuries", label: "Injuries and Bans", of: "injury" },
];

const HERE = "/news";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; item?: string }>;
}) {
  const [{ tab, item }, inbox] = await Promise.all([searchParams, readInbox()]);

  const chosen = TABS.find((entry) => entry.key === tab) ?? TABS[0];
  const shown = inbox.items.filter((entry) => chosen.of === null || entry.category === chosen.of);
  // The one being read: what the URL asked for, or the top of the list. CM opens
  // on the newest and so does this — an inbox with nothing selected is a list
  // with a blank half under it.
  const open = shown.find((entry) => entry.id === item) ?? shown[0] ?? null;

  return (
    <div className="flex flex-col gap-2">
      {/* **The bar names the SUBJECT and the caption names the VIEW**, which is
          the app's rule and was the one screen breaking it (Craig, 5 Sep 2026:
          "news needs the proper CM title like the rest of the app"). It read
          `TEST2 NEWS` on the bar with no caption at all — the two boxes
          collapsed into one. CM's own news bar does exactly that, and it is the
          single screen in the library that does; `app/titles.ts` carries the
          rule and why ours wins.

          The subject is the LEAGUE and not the manager, on what is actually in
          the list: another manager's signing, a doubt on a rival's squad, the
          round's deadline. It is his news the way the table is his table. That
          also keeps one shell for a reader with no team, who still has every
          reason to read it. */}
      <PageHeader
        title={LEAGUE_NAME}
        sub={inbox.gameweek === null ? undefined : `Gameweek ${inbox.gameweek}`}
        competition
      />

      {/* The strip. Not `TabStrip`: these are not routes, they are filters on
          one route, and a strip that took `href`s would have to be told to keep
          the item in the query string on every entry. Four plates, CM's own. */}
      <nav aria-label="News" className="flex">
        {TABS.map((entry) => (
          <Link
            key={entry.key}
            href={entry.key === "all" ? HERE : `${HERE}?tab=${entry.key}`}
            aria-current={entry.key === chosen.key ? "page" : undefined}
            // **Wraps rather than truncates**, which the first build had the
            // wrong way round: "Injuries and Bans" is CM's own label and at 390
            // across four plates it came out "NJURIES AND BANS" — `truncate`
            // clips the left of a centred line. `TabStrip` solved this once
            // already with its `labels="word"`, and the answer is the same: a
            // plate is allowed to be two lines tall, and a clipped word is not
            // a label.
            className="cm-tab flex min-w-0 flex-1 items-center justify-center px-1 py-1 text-center text-3xs font-bold uppercase leading-tight lg:text-2xs"
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      <Caption>{NEWS}</Caption>

      {shown.length === 0 ? (
        <section className="cm-panel p-3">
          <Nothing
            title="Nothing filed"
            code={`${inbox.items.length} items, 0 in ${chosen.label.toLowerCase()}`}
          >
            {inbox.items.length === 0
              ? "The club has been told nothing yet — no business, no doubts, and no round to report."
              : `Nothing under ${chosen.label.toLowerCase()}. The other tabs have the rest.`}
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
            {shown.map((entry) => (
              <li key={entry.id}>
                <Row
                  item={entry}
                  tab={chosen.key}
                  open={entry.id === open?.id}
                  names={inbox.names}
                />
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
 *  same block that holds a league position on a scoreline row and a minute on
 *  the wire. It is the row's "when", and an item with no date of its own falls
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
  tab,
  open,
  names,
}: {
  item: InboxItem;
  tab: string;
  open: boolean;
  names: Map<string, string>;
}) {
  const who = item.teamId === null ? null : names.get(item.teamId);
  return (
    <Link
      href={`${HERE}?${tab === "all" ? "" : `tab=${tab}&`}item=${encodeURIComponent(item.id)}`}
      aria-current={open ? "true" : undefined}
      className={`cm-row flex min-h-11 items-stretch gap-2 ${
        open ? "bg-league-deep" : "hover:bg-surface"
      }`}
    >
      <span className="cm-index numeric flex w-16 shrink-0 items-center justify-center px-1 text-center text-3xs font-bold leading-tight lg:w-24">
        {item.at === null
          ? item.gameweek === null
            ? ""
            : `GW${item.gameweek}`
          : londonDayAndDate(item.at)}
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
      {item.at === null ? null : <p className={`${HEAD_PLATE} numeric self-start`}>{item.at}</p>}
    </article>
  );
}
