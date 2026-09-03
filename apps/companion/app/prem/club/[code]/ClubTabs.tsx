import TabStrip from "../../../components/shell/TabStrip";
import { CLUB } from "../../PremNav";

// One club's own screens, and how you get between them.
//
// **Championship Manager's club screen, which is a strip and not a page.**
// `cm9900/25.jpg` runs `Squad · Transfers · Next Match · Fixtures · Finances &
// Info` across the top of Everton. Ours drops two: Transfers, because FPL
// publishes no transfer feed for a real club and inventing one is the failure
// this section is careful about, and Finances, which `squad/[teamId]/TeamTabs`
// already dropped for a fantasy side.
//
// **Tactics is not here, and that is the reference's own filing.** `25.jpg` has
// no Tactics tab: `Tactics · Training · Last Match · 6th in PRM · History` is
// the FOOT row under the panel. So it arrives downstairs when there is a real
// XI to draw, and `PremNav` already records why a foot row waits for its second
// entry rather than shipping as one stray button.
//
// A server component for `SectionNav`'s reason: each page knows which one it
// is, so passing that in costs a prop and saves shipping a component to the
// phone to work out what the URL already says.

/** `segment` rather than a stored href, because every one of these is a route
 *  under a club that is only known at render — `TeamTabs` does the same for the
 *  same reason. */
const TABS = [
  { segment: "", label: "Squad", key: "squad" },
  // "Match", not "Next Match": two words wrap at 390 while the others sit on
  // one, and a strip whose plates disagree about their height is not a strip.
  // CM's own tabs are one word wherever it can manage it, and the screen it
  // heads says "Next Match" in the caption box, where there is room.
  { segment: "/next", label: "Match", key: "next" },
  { segment: "/fixtures", label: "Fixtures", key: "fixtures" },
  { segment: "/stats", label: "Stats", key: "stats" },
] as const;

export type ClubTab = (typeof TABS)[number]["key"];

export default function ClubTabs({
  code,
  current,
  /** Tabs with nothing behind them for THIS club. `TabStrip` greys them and
   *  keeps them in place, which is CM's own answer for a view that exists and
   *  has nothing in it (`cm0102/07.jpg`). */
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
