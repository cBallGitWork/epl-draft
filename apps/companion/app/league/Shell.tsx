import { LEAGUE_NAME } from "@epl/core";
import PageHeader from "../components/shell/PageHeader";
import SectionShell from "../components/shell/SectionShell";
import SectionNav from "./SectionNav";
import type { LeagueSection } from "./SectionNav";
import { LEAGUE_CAPTION } from "../titles";

// The frame every league section wears, empty states included: without the bar and the tabs, a
// reader who lands here during a Fantrax outage has no way on to Schedule or Matchups.

/** The fewest rows a league panel opens at, so a page with little on it does not open short: a layout floor, not the
 *  league's size, which `teams` (from `getLeagueInfo`) passes and which wins when bigger. */
const PANEL_FLOOR = 10;

export default function LeagueShell({
  title,
  current,
  sub,
  teams,
  children,
}: {
  current: LeagueSection;
  title?: string;
  sub?: React.ReactNode;
  teams?: number;
  children: React.ReactNode;
}) {
  return (
    <SectionShell
      // The competition's own name on its bar; the tabs under it name the page (`cm9900/24.jpg`).
      header={<PageHeader title={LEAGUE_NAME} sub={sub} competition />}
      nav={<SectionNav current={current} />}
      caption={title ?? LEAGUE_CAPTION[current]}
      captionOnPhone={current === "matchups"}
      rows={Math.max(teams ?? 0, PANEL_FLOOR)}
      tight
    >
      {children}
    </SectionShell>
  );
}
