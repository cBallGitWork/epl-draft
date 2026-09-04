import Section from "../../components/shell/Section";
import { PANEL } from "@/app/desk";
import { LEAGUE_TIMEZONE } from "@epl/core";
import Link from "next/link";
import type { NewsItem } from "./newsItems";

// Championship Manager's news screen, which is an email client: a list of dated
// rows at the top, and the one you are reading opened underneath.
//
// **Two boxes, not one** (Craig, 4 Sep 2026: "Maybe news needs two separate
// transparent boxes like the cm screenshot"). The reference is unambiguous: the
// list is its own panel at the top, a bar sits under it, and the story is a
// second panel below with the photograph between them. One box holding both made
// the list and the body read as a single object.
//
// **Read off the reference rather than remembered.** CM draws the date in a blue
// index block down the left of each row, the headline beside it, the row you are
// on marked, and then the opened item's headline CENTRED IN YELLOW over its body
// in large white text. Ours does the same four things.
//
// **The yellow is correct here by our own rules, not just by CM's.** DESIGN §3
// gives the accent to *yours · selected · active*, and the opened item is the
// selected one — the single place on this screen where something is. That is why
// the headline may take a colour the attribute grid two tabs away may not.
//
// **Nothing here is a control.** CM's inbox selects and ours opens the newest,
// because a selection needs client state and the whole list is a handful of
// items. The rows are still marked so a reader can see which body they are
// looking at rather than inferring it from the date.

/** `Wed 19 Aug 14:30` — the date CM's inbox shows, plus the time Craig asked
 *  for (4 Sep 2026: *"include the time"*). Two items filed on one day are
 *  ordinary on a matchday, and a column of identical dates cannot be read as an
 *  order. */
const WHEN = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: LEAGUE_TIMEZONE,
});

export default function Inbox({
  items,
  href,
  openId,
}: {
  items: readonly NewsItem[];
  /** Where a row points, given its id. The route owns the query string; this
   *  owns the list. */
  href: (id: string) => string;
  /** Which story is open, from the URL. Undefined opens the newest, which is
   *  what a fresh tap on the tab should do. */
  openId?: string;
}) {
  if (items.length === 0) {
    return (
      <Section title="News" aside="Fantrax's own">
        <p className="text-sm text-muted">
          Nothing has been written about him since 1 July.
        </p>
      </Section>
    );
  }

  // **Any item opens, not only the newest** (Craig, 4 Sep 2026: *"allow older
  // news to be tapped"*). The list said so about itself for one commit — "older
  // items are listed above and not opened" — which is a screen explaining its
  // own limitation instead of losing it. An id the URL names but the list does
  // not carry falls back to the newest rather than 404ing: a story ages out of
  // the 1 July window while somebody has the link open.
  const open = items.find((item) => item.id === openId) ?? items[0];

  return (
    <>
      <Section title="News" aside="Fantrax's own">
        <ul className="flex flex-col gap-px">
          {items.map((item) => (
            <li key={item.id}>
              {/* A row is a CONTROL now, so it takes the control floor — 44 under
                  a thumb, 36 on the desk (DESIGN §6) — where it was a 28px row.
                  `MatchLog` records the same trade: CM's inbox could be dense
                  because nothing in it was clickable. */}
              <Link
                href={href(item.id)}
                className={`flex min-h-11 items-stretch gap-2 lg:min-h-9 ${
                  item === open ? "bg-raised" : "text-faint hover:bg-raised/60"
                }`}
              >
              {/* CM's index block, in his club's colour like every other one on
                  his screens — `.cm-index` from `desk.css`, which owns the
                  `--cm-index` fallback and the inset rule the shell re-points.
                  This wrote the two custom properties out in Tailwind for one
                  commit, which is a second copy of a decision that already has a
                  home.

                  `w-24` because the widest label this formats is a Wednesday in
                  September — "Wed 19 Aug" at `2xs` — and a column that resizes
                  per row stops being a column. */}
              <span className="cm-index numeric flex w-24 shrink-0 items-center justify-center px-1 text-2xs">
                {item.at === null ? "—" : WHEN.format(new Date(item.at))}
              </span>
              <span
                className={`min-w-0 flex-1 self-center truncate py-1 text-sm ${
                  item === open ? "font-bold text-ink" : ""
                }`}
              >
                {item.headline}
              </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* The story, in its OWN box. CM centres the headline in yellow over the
          body and sets the body large, with the photograph showing between the
          two panels rather than inside one.

          **The body is dropped when it IS the headline.** Fantrax files match
          reports whose `headlineNoBrief` and `content` are the same sentence —
          most of them — and printing both put one line twice under itself. A
          transfer story has a longer body and gets both. */}
      {/* **No headline over the body** (Craig, 4 Sep 2026: *"dont need the title
          in yellowat the start, its repeat information"*). The selected row two
          inches above already carries it in bold, and CM's own inbox does not
          repeat it either — `cm9900/05.jpg` opens straight into the story. */}
      <section className={PANEL}>
        {open.body === open.headline ? null : (
          <p className="text-sm text-ink lg:text-base">{open.body}</p>
        )}
        {open.analysis === null ? null : (
          <p className="border-l-2 border-line pl-2 text-sm text-muted">
            {open.analysis}
          </p>
        )}
      </section>
    </>
  );
}
