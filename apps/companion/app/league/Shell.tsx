import Caption from "../components/shell/Caption";
import { LEAGUE_NAME } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import SectionNav from "./SectionNav";
import type { LeagueSection } from "./SectionNav";
import { PANEL } from "@/app/desk";

// The frame every league section wears, including when it has nothing to show.
//
// The header and the nav are not decoration on an empty state: without them a
// reader who lands on the table during a Fantrax outage has no way to reach
// Schedule or Matchups, so the section becomes a dead end rather than a section
// with nothing in it. Schedule already knew this and the other two did not, which
// is exactly the kind of divergence a shared frame stops happening again.

/** How many rows a league panel is drawn to hold when the league will not say.
 *
 *  **Ten, because the league is ten** (Craig, 31 Aug 2026 — it had been sixteen
 *  in every doc since the repo started). This is a floor on the SHAPE of the
 *  screen and not a claim about the competition: `teams` below is read from
 *  `getLeagueInfo` and wins whenever it is bigger, so a sixteen-team league
 *  draws sixteen without anyone editing this.
 *
 *  It is needed because the count is genuinely absent today. The real league's
 *  `teamInfo` is an empty object until managers join — checked in the 31 Aug
 *  snapshot — so the one screen this most has to look right on is the one that
 *  can tell us nothing about its own size. A panel sized to a league of nought
 *  is a strip. */
const PANEL_ROWS = 10;

export default function LeagueShell({
  title,
  current,
  sub,
  teams,
  children,
}: {
  /** What this VIEW is — "League Table", "Schedule". Printed as CM prints it:
   *  a yellow caption centred inside the panel, under the tab strip and over the
   *  content. The blue bar above names the competition; this names what is in
   *  the panel, and every screen in the game has both. */
  title: string;
  current: LeagueSection;
  sub?: React.ReactNode;
  /** How many teams are in the league, when the caller knows. The panel is drawn
   *  to hold that many rows, or `PANEL_ROWS`, whichever is more. */
  teams?: number;
  children: React.ReactNode;
}) {
  return (
    // `gap-2` and not `gap-3`. The stack is four boxes now rather than three —
    // bar, strip, caption, content — and 12px between each of them spread the
    // screen out until the panels stopped reading as one object. CM butts its
    // title bar, tab strip and panels almost together; this is that, with enough
    // air to keep the bevels legible.
    <div className="flex flex-col gap-2">
      {/* The competition's own bar, and the competition's own NAME on it. CM
          heads this screen "English Premier Division" and lets the tab strip
          under it say which view you are on — the bar names the thing, the tabs
          name the page (`cm9900/24.jpg`). It used to read "Table", which is a
          page title in a slot meant for a subject. */}
      <PageHeader title={LEAGUE_NAME} sub={sub} competition />
      <SectionNav current={current} />

      {/* **Two boxes, not one.** Craig, 1 Sep 2026, against CM's stat screen:
          "the team stats title row is a row itself, its own box, then the table
          etc is its own container". The shot bears it out — "Average Rating"
          sits on its own bordered strip with the two grey controls, and the list
          under it is a separate bordered block. This had them in one panel with
          the caption floating at the top of it, which is a heading inside a box
          rather than a box of its own. */}
      <Caption>{title}</Caption>

      {/* The content's own container, sized to hold the league.
          `min-h` so a short league still draws a panel rather than a strip: the
          block is the screen's shape and it should not shrink to its contents,
          which is why CM's tables look full at twelve rows and ours looked
          abandoned at four.

          **Sized in ROWS rather than in pixels**, which is the difference
          between a panel that holds the league and a panel that happens to be
          320px. `min-h-80` was the latter and it was short at both widths: ten
          rows want 366px on the desk and 526px under a thumb, because a row is
          29px there and 45px here. The arithmetic is in CSS because only CSS has
          the breakpoint — see `--table-row` in `desk.css`, which is measured
          rather than assumed. */}
      <section
        className={PANEL}
        style={{
          minHeight: `calc(${Math.max(teams ?? 0, PANEL_ROWS)} * var(--table-row) + var(--table-chrome))`,
        }}
      >
        {children}
      </section>

    </div>
  );
}
