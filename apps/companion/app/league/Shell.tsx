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

export default function LeagueShell({
  title,
  current,
  sub,
  children,
}: {
  /** What this VIEW is — "League Table", "Schedule". Printed as CM prints it:
   *  a yellow caption centred inside the panel, under the tab strip and over the
   *  content. The blue bar above names the competition; this names what is in
   *  the panel, and every screen in the game has both. */
  title: string;
  current: LeagueSection;
  sub?: React.ReactNode;
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
          ours looked abandoned at four. */}
      <section className="cm-panel flex min-h-80 flex-col gap-2 p-2">
        <p className="text-center font-chrome text-sm font-bold text-accent lg:text-lg">{title}</p>
        {children}
      </section>
    </div>
  );
}
