import TabStrip from "../../../components/shell/TabStrip";
import { CLUB } from "../../routes";

// One club's screens, as Championship Manager's club strip (`cm9900/25.jpg`).
// No Transfers: FPL publishes no transfer feed for a real club, so one would be invented.

/** A segment, not an href: the club is only known at render. */
const TABS = [
  { segment: "", label: "Squad", key: "squad" },
  { segment: "/depth", label: "Depth", key: "depth" },
  // Replaced Match, which Fixtures duplicates (Craig, 3 Sep 2026).
  // Spelt out in full: `labels="word"` wraps it to two lines (Craig, 5 Sep 2026).
  { segment: "/set-pieces", label: "Set Pieces", key: "setPieces" },
  { segment: "/fixtures", label: "Fixtures", key: "fixtures" },
  { segment: "/stats", label: "Stats", key: "stats" },
] as const;

export type ClubTab = (typeof TABS)[number]["key"];

export default function ClubTabs({
  code,
  current,
  /** Tabs with nothing behind them for this club; `TabStrip` greys them in place. */
  empty = [],
}: {
  code: number;
  current: ClubTab;
  empty?: readonly ClubTab[];
}) {
  return (
    <TabStrip
      label="Club views"
      tabs={TABS.map((tab) => ({ ...tab, href: `${CLUB}/${code}${tab.segment}` }))}
      current={current}
      dim={empty}
      labels="word"
    />
  );
}
