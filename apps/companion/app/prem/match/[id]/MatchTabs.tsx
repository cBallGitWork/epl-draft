import TabStrip from "../../../components/shell/TabStrip";
import { MATCH } from "../../routes";

// One match's own screens — CM's `cm9900/22.jpg` strip, with Stats merged and Highlights for Match Report.

const TABS = [
  { segment: "", label: "Overview", key: "overview" },
  // Craig's order, 23 Sep 2026: Line Ups second, Stats third, Action Zones, then Highlights.
  { segment: "/players", label: "Line Ups", key: "players" },
  // Both sides and each club's men, switched by the foot row.
  { segment: "/stats", label: "Stats", key: "stats" },
  // Shots and average positions, where CM keeps them.
  { segment: "/zones", label: "Action Zones", key: "zones" },
  { segment: "/highlights", label: "Highlights", key: "highlights" },
] as const;

export type MatchTab = (typeof TABS)[number]["key"];

export default function MatchTabs({ id, current }: { id: number; current: MatchTab }) {
  return (
    <TabStrip
      label="Match views"
      tabs={TABS.map((tab) => ({ ...tab, href: `${MATCH}/${id}${tab.segment}` }))}
      current={current}
      labels="word"
    />
  );
}
