import TabStrip from "../../components/shell/TabStrip";
import { SQUAD } from "../routes";

// A team's five screens, CM's club tabs (`cm9900/25.jpg`) with Stats for the finances. The hrefs follow the slug, so a
// manager who came in by My Team stays under `/squad/me` and the rail stays lit.

/** The five, declared once; a `segment`, since the team is only known at render. */
const TABS = [
  { segment: "", label: "Squad", key: "squad" },
  { segment: "/transfers", label: "Transfers", key: "transfers" },
  // "Match", not "Next Match": two words wrap at 390.
  { segment: "/next", label: "Match", key: "next" },
  { segment: "/fixtures", label: "Fixtures", key: "fixtures" },
  { segment: "/stats", label: "Stats", key: "stats" },
] as const;

export type TeamTab = (typeof TABS)[number]["key"];

export default function TeamTabs({
  slug,
  current,
  empty = [],
}: {
  /** What the URL calls this team: his id, or `me` on the front door. */
  slug: string;
  current: TeamTab;
  /** Tabs with nothing behind them for this team, greyed in place by `TabStrip`. */
  empty?: readonly TeamTab[];
}) {
  return (
    <TabStrip
      label="Team views"
      tabs={TABS.map((tab) => ({ ...tab, href: `${SQUAD}/${slug}${tab.segment}` }))}
      current={current}
      dim={empty}
      labels="word"
    />
  );
}
