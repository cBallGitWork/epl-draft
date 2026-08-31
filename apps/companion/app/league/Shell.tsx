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
      <p className="pt-1 text-center font-display text-sm font-bold text-accent">{title}</p>
      {children}
    </div>
  );
}
