import { LEAGUE_NAME } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import SectionNav from "./SectionNav";
import type { LeagueSection } from "./SectionNav";

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
    <div className="flex flex-col gap-3">
      {/* The competition's own bar, and the competition's own NAME on it. CM
          heads this screen "English Premier Division" and lets the tab strip
          under it say which view you are on — the bar names the thing, the tabs
          name the page (`cm9900/24.jpg`). It used to read "Table", which is a
          page title in a slot meant for a subject. */}
      <PageHeader title={LEAGUE_NAME} sub={sub} competition />
      <SectionNav current={current} />

      {/* **One panel, and the caption lives inside it.** A Championship Manager
          screen is a bordered block that opens with its yellow caption and runs
          down to the foot — the caption is the panel's own head, not a line
          floating above a table (`cm9900/24.jpg`, `25.jpg`). Ours had the
          caption in the gap between two things, which is where a heading goes
          when nobody has decided what it heads.

          `min-h` so a four-team league still draws a panel rather than a strip:
          the block is the screen's shape and it should not shrink to its
          contents, which is exactly why CM's tables look full at twelve rows and
          ours looked abandoned at four.

          **Sized in ROWS rather than in pixels**, which is the difference
          between a panel that holds the league and a panel that happens to be
          320px. `min-h-80` was the latter and it was short at both widths: ten
          rows want 366px on the desk and 526px under a thumb, because a row is
          29px there and 45px here. The arithmetic is in CSS because only CSS has
          the breakpoint — see `--table-row` in `desk.css`, which is measured
          rather than assumed. */}
      <section
        className="cm-panel flex flex-col gap-2 p-2"
        style={{
          minHeight: `calc(${Math.max(teams ?? 0, PANEL_ROWS)} * var(--table-row) + var(--table-chrome))`,
        }}
      >
        <p className="text-center font-chrome text-sm font-bold text-accent lg:text-lg">{title}</p>
        {children}
      </section>
    </div>
  );
}
